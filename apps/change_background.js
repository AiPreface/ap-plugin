/*
 * @Author: 0卡苏打水su
 * @Date: 2023-01-11 22:58:18
 * @LastEditors: 苏沫柒 3146312184@qq.com
 * @LastEditTime: 2023-02-19 12:23:34
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\apps\change_background.js
 * @Description: 图片局部重绘功能
 * 
 * Copyright (c) 2023 by susu , All Rights Reserved. 
 */
import plugin from '../../../lib/plugins/plugin.js'
import fetch from 'node-fetch'
import axios from 'axios'
import Config from '../components/ai_painting/config.js';
import { segment } from 'oicq'
import Log from '../utils/Log.js'
import { createRequire } from "module";
import Draw from '../components/ai_painting/draw.js'
import { parseImg } from '../utils/utils.js';
import { Parse } from "../components/apidx.js";
import { getuserName } from '../utils/utils.js'
import Pictools from '../utils/pic_tools.js';
const require = createRequire(import.meta.url);

let ap_cfg = await Config.getcfg()
const URL = ap_cfg.remove_bg
let API = ''
if (URL) {
	API = 'https://' + URL.split('/')[4] + '-anime-remove-background.hf.space/api/queue/'
}

let FiguretypeUser = {}

export class example extends plugin {
	constructor() {
		super({
			/** 功能名称 */
			name: '图像蒙版处理',
			/** 功能描述 */
			dsc: '简单开发示例',
			/** https://oicqjs.github.io/oicq/#events */
			event: 'message',
			/** 优先级，数字越小等级越高 */
			priority: 50,
			rule: [
				{
					/** 命令正则匹配 */
					reg: '^#?更?换(背景|人物).*$',
					/** 执行方法 */
					fnc: 'ChangeBackground'
				},
				{
					/** 命令正则匹配 */
					reg: '^#?局部重绘.*$',
					/** 执行方法 */
					fnc: 'PartialRedraw'
				}
			]
		})
	}
	async ChangeBackground(e) {
		if (API == '') {
			return e.reply('当前无可用的去背景接口')
		}
		let canvas
		try {
			canvas = require("canvas");
		} catch (err) {
			Log.w(err)
			e.reply('出错：重绘功能需要安装依赖：canvas\n请在yunzai根目录执行如下命令来安装依赖：\ncnpm install canvas --canvas_binary_host_mirror=https://registry.npmmirror.com/-/binary/canvas\n\n若安装依赖后仍出现此报错，您可查看控制台报错并联系开发者反馈')
			return true
		}

		if (FiguretypeUser[e.user_id]) {
			e.reply('当前有任务在列表中排队，请不要重复发送，处理完成后会自动发送结果，如果长时间没有结果，请等待1分钟再试')
			return true
		}

		e = await parseImg(e)

		if (!this.e.img) {
			e.reply('图都没有，换什么啊！', true);
			return false;
		}

		e.reply('正在处理图像中，请稍后...', true)
		FiguretypeUser[e.user_id] = setTimeout(() => {
			if (FiguretypeUser[e.user_id]) {
				delete FiguretypeUser[e.user_id];
			}
		}, 60000);
		let img = await axios.get(e.img[0], {
			responseType: 'arraybuffer'
		});
		var base64 = Buffer.from(img.data, 'binary')
			.toString('base64');
		let imgdata = await canvas.loadImage(e.img[0])
		var width = imgdata.width
		var height = imgdata.height
		width = Math.round(width / 64) * 64
		height = Math.round(height / 64) * 64
		if (width > 2048 || height > 2048) {
			e.reply('图片长宽超过2048，无法重绘，请更换图片再试')
			return true
		}
		let hash = await getHash(e);
		let response = await axios.post(
			API + `push/`, {
			'fn_index': 1,
			'data': [
				'data:image/jpeg;base64,' + base64
			],
			'action': 'predict',
			'session_hash': hash
		},
		)
		let statushash = response.data.hash
		console.log(`本次请求hash为${statushash}`)
		let res = await axios.post(
			API + 'status/', {
			'hash': statushash
		},
		)
		let status = res.data.status
		console.log(`本次请求状态为${status}`)
		while (status != 'COMPLETE') {
			res = await axios.post(
				API + 'status/', {
				'hash': statushash
			},
			)
			status = res.data.status
			console.log(`本次请求状态为${status}`)
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
		var mask = res.data.data.data[0]
		if (e.msg.match(/^#?更?换人物/)) {
			mask = await invertImage(mask)
			var mask_blur = 4
			if (!mask) return e.reply('出错：重绘功能需要安装依赖：canvas\n请在yunzai根目录执行如下命令来安装依赖：\ncnpm install canvas --canvas_binary_host_mirror=https://registry.npmmirror.com/-/binary/canvas\n\n若安装依赖后仍出现此报错，您可查看控制台报错并联系开发者反馈')
		} else {
			var mask_blur = 1
		}
		var msg = e.msg.replace(/^#?更?换(背景|人物)/, '')
		let current_group_policy = await Parse.parsecfg(this.e)
		let paramdata = {
			param: {
				sampler: 'DPM++ 2S a Karras',
				strength: 0.6,
				seed: -1,
				scale: 11,
				steps: 30,
				width: width,
				height: height,
				tags: "masterpiece, best quality," + msg,
				ntags: '',
				pt: [],
				npt: [],
				base64: base64, /* 图生图的源图，base64，不带头 */
				mask: mask,   /*  */
				mask_blur: mask_blur, /*  */
				inpainting_mask_invert: 1  /*  */
			},
			num: 1,    //画几张 
			rawtag: { tags: '', ntags: '' },  //未经处理的原始tag 
			specifyAPI: NaN,     //指定用哪个api 
			user: e.user_id,   /* 用户qq */
			code: 0,            //用来反馈构建参数是否成功 
			JH: current_group_policy.JH,        /* 审核  */
			message: ''      //构建参数失败时的描述信息 
		}

		let resp = await Draw.get_a_pic(paramdata)
		if (resp.isnsfw) {
			// 将图片base64转换为基于QQ图床的url
			let url = await Pictools.base64_to_imgurl(resp.base64)
			if (current_group_policy.isTellMaster) {
			  let msg = [
				"【aiPainting】不合规图片：\n",
				segment.image(`base64://${resp.base64}`),
				`\n来自${e.isGroup ? `群【${(await Bot.getGroupInfo(e.group_id)).group_name}】(${e.group_id})的` : ""}用户【${await getuserName(e)}】(${e.user_id})`,
				`\n【Tags】：${paramdata.rawtag.tags}`,
				`\n【nTags】：${paramdata.rawtag.ntags}`,
			  ]
			  Bot.pickUser(cfg.masterQQ[0]).sendMsg(msg);
			}
			e.reply(["图片不合规，不予展示", `\n${resp.md5}`], true)
			return true
		  }

		delete FiguretypeUser[e.user_id];
		if (resp.code) {
			return e.reply(resp.description)
		}
		return e.reply(segment.image('base64://' + resp.base64), true)
	}

	async PartialRedraw(e) {
		if (API == '') {
			return e.reply('当前无可用的去背景接口')
		}
		let canvas
		try {
			canvas = require("canvas");
		} catch (err) {
			Log.w(err)
			e.reply('出错：重绘功能需要安装依赖：canvas\n请在yunzai根目录执行如下命令来安装依赖：\ncnpm install canvas --canvas_binary_host_mirror=https://registry.npmmirror.com/-/binary/canvas\n\n若安装依赖后仍出现此报错，您可查看控制台报错并联系开发者反馈')
			return true
		}


		if (FiguretypeUser[e.user_id]) {
			e.reply('当前有任务在列表中排队，请不要重复发送，处理完成后会自动发送结果，如果长时间没有结果，请等待1分钟再试')
			return true
		}
		if (!this.e.img) {
			e.reply('图都没有，画什么啊！', true);
			return false;
		}
		if (!this.e.img[1]) {
			e.reply('请将原图中需要重绘的部分涂黑，与原图一起发出', true);
			return false;
		}

		e.reply('正在局部重绘中，请耐心等待喵~')
		let imgdata = await canvas.loadImage(e.img[0])
		var width = imgdata.width
		var height = imgdata.height
		width = Math.round(width / 64) * 64
		height = Math.round(height / 64) * 64
		if (width > 2048 || height > 2048) {
			e.reply('图片长宽超过2048，无法重绘，请更换图片再试')
			return true
		}
		let OriginImg = this.e.img[0];
		let BlackImg = this.e.img[1];
		let BlackImgBuffer = await axios.get(BlackImg, {
			responseType: 'arraybuffer'
		});
		var BlackImgBase64 = Buffer.from(BlackImgBuffer.data, 'binary')
			.toString('base64');
		let OriginImgBuffer = await axios.get(OriginImg, {
			responseType: 'arraybuffer'
		});
		var OriginImgBase64 = Buffer.from(OriginImgBuffer.data, 'binary')
			.toString('base64');
		var MaskImg = await getBlackPixelImage(BlackImgBase64);
		if (!MaskImg) return e.reply('出错：重绘功能需要安装依赖：canvas\n请在yunzai根目录执行如下命令来安装依赖：\ncnpm install canvas --canvas_binary_host_mirror=https://registry.npmmirror.com/-/binary/canvas\n\n若安装依赖后仍出现此报错，您可查看控制台报错并联系开发者反馈')
		var msg = e.msg.replace(/^#?局部重绘/, '')
		let current_group_policy = await Parse.parsecfg(this.e)
		let paramdata = {
			param: {
				sampler: 'DPM++ 2S a Karras',
				strength: 0.6,
				seed: -1,
				scale: 11,
				steps: 30,
				width: width,
				height: height,
				tags: "masterpiece, best quality," + msg,
				ntags: '',
				pt: [],
				npt: [],
				base64: OriginImgBase64, /* 图生图的源图，base64，不带头 */
				mask: MaskImg,   /*  */
				mask_blur: 1, /*  */
				inpainting_mask_invert: 1  /*  */
			},
			num: 1,    //画几张 
			rawtag: { tags: '', ntags: '' },  //未经处理的原始tag
			specifyAPI: NaN,     //指定用哪个api 
			user: e.user_id,   /* 用户qq */
			code: 0,            //用来反馈构建参数是否成功 
			JH: current_group_policy.JH,        /* 审核  */
			message: ''      //构建参数失败时的描述信息 
		}

		let resp = await Draw.get_a_pic(paramdata)
		if (resp.isnsfw) {
			// 将图片base64转换为基于QQ图床的url
			let url = await Pictools.base64_to_imgurl(resp.base64)
			if (current_group_policy.isTellMaster) {
			  let msg = [
				"【aiPainting】不合规图片：\n",
				segment.image(`base64://${resp.base64}`),
				`\n来自${e.isGroup ? `群【${(await Bot.getGroupInfo(e.group_id)).group_name}】(${e.group_id})的` : ""}用户【${await getuserName(e)}】(${e.user_id})`,
				`\n【Tags】：${paramdata.rawtag.tags}`,
				`\n【nTags】：${paramdata.rawtag.ntags}`,
			  ]
			  Bot.pickUser(cfg.masterQQ[0]).sendMsg(msg);
			}
			e.reply(["图片不合规，不予展示", `\n${resp.md5}`], true)
			return true
		  }

		delete FiguretypeUser[e.user_id];
		if (resp.code) {
			return e.reply(resp.description)
		}
		return e.reply(segment.image('base64://' + resp.base64), true)
	}
}

async function getHash(e) {
	let hash = '';
	let chars = '0123456789abcdefghijklmnopqrstuvwxyz';
	for (let i = 0; i < 10; i++) {
		hash += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return hash;
}

async function getBlackPixelImage(base64) {
	let canvas
	try {
		canvas = require("canvas");
		// Log.i(louvre)
		// Log.i(typeof louvre)
	} catch (err) {
		Log.w(err)
		return false
	}
	const image = await canvas.loadImage("data:image/png;base64," + base64);
	const canvas_ = canvas.createCanvas(image.width, image.height);
	const ctx = canvas_.getContext('2d');
	ctx.drawImage(image, 0, 0);
	const imageData = ctx.getImageData(0, 0, canvas_.width, canvas_.height);
	const data = imageData.data;
	for (let i = 0; i < data.length; i += 4) {
		const r = data[i];
		const g = data[i + 1];
		const b = data[i + 2];
		if (r <= 20 && g <= 20 && b <= 20) {
			data[i] = 0;
			data[i + 1] = 0;
			data[i + 2] = 0;
		} else {
			data[i] = 255;
			data[i + 1] = 255;
			data[i + 2] = 255;
		}
	}
	ctx.putImageData(imageData, 0, 0);
	return canvas_.toDataURL()
		.replace(/^data:image\/(png|jpg);base64,/, "");
}

async function invertImage(base64Image) {
	let canvas
	try {
		canvas = require("canvas");
	} catch (err) {
		Log.w(err)
		return false
	}
	const img = new canvas.Image();
	img.src = base64Image;
	const cvs = canvas.createCanvas(img.width, img.height);
	const ctx = cvs.getContext('2d');
	ctx.drawImage(img, 0, 0);
	const imageData = ctx.getImageData(0, 0, img.width, img.height);
	const data = imageData.data;
	for (let i = 0; i < data.length; i += 4) {
		data[i] = 255 - data[i];
		data[i + 1] = 255 - data[i + 1];
		data[i + 2] = 255 - data[i + 2];
	}
	ctx.putImageData(imageData, 0, 0);
	return cvs.toDataURL()
		.replace(/^data:image\/(png|jpg);base64,/, "");
}