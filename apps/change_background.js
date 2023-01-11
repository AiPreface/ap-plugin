import plugin from '../../../lib/plugins/plugin.js'
import fetch from 'node-fetch'
import axios from 'axios'
import Config from '../components/ai_painting/config.js';
import {
	segment
} from 'oicq'
import Log from '../utils/Log.js'
// import canvas from 'canvas'
// import {
// 	createCanvas as canvas.createCanvas,
// 	loadImage as canvas.loadImage,
// 	Image as canvas.Image
// } from 'canvas'

import { createRequire } from "module";
const require = createRequire(import.meta.url);

const _path = process.cwd();
let ap_cfg = await Config.getcfg()
const URL = ap_cfg.remove_bg
let API = ''
if (URL) {
	API = 'https://' + URL.split('/')[4] + '-anime-remove-background.hf.space/api/queue/'
}

let SDAPI = ''
if (ap_cfg.APIList.length > 0) {
	let index = ap_cfg.usingAPI
	let apiobj = ap_cfg.APIList[index - 1]
	SDAPI = apiobj.url + '/sdapi/v1/img2img'
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
		if (!SDAPI) {
			return e.reply('当前无可用的SD绘图接口')
		}
		if (API == '') {
			return e.reply('当前无可用的去背景接口')
		}
		let canvas
		try {
			canvas = require("canvas");
			// Log.i(louvre)
			// Log.i(typeof louvre)
		} catch (err) {
			Log.w(err)
			e.reply('出错：重绘功能需要安装依赖：canvas\n请在yunzai根目录执行如下命令来安装依赖：\ncnpm install canvas --canvas_binary_host_mirror=https://registry.npmmirror.com/-/binary/canvas\n\n若安装依赖后仍出现此报错，您可查看控制台报错并联系开发者反馈')
			return true
		}

		if (FiguretypeUser[e.user_id]) {
			e.reply('当前有任务在列表中排队，请不要重复发送，处理完成后会自动发送结果，如果长时间没有结果，请等待1分钟再试')
			return true
		}
		if (e.source) {
			let reply;
			if (e.isGroup) {
				reply = (await e.group.getChatHistory(e.source.seq, 1))
					.pop()?.message;
			} else {
				reply = (await e.friend.getChatHistory(e.source.time, 1))
					.pop()?.message;
			}
			if (reply) {
				for (let val of reply) {
					if (val.type == "image") {
						e.img = [val.url];
						break;
					}
				}
			}
		}
		if (this.e.img) {
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
			var img2imgData = {
				"init_images": ['data:image/jpeg;base64,' + base64],
				"sampler_index": "DPM++ 2S a Karras",
				"denoising_strength": 0.6,
				"prompt": "masterpiece, best quality," + msg,
				"seed": -1,
				"steps": 35,
				"cfg_scale": 11,
				"width": width,
				"height": height,
				"negative_prompt": "lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry",
				"styles": ["string"],
				"mask": mask,
				"mask_blur": mask_blur,
				"inpainting_mask_invert": 1,
			}
			let img2imgRes = await fetch(SDAPI, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'authorization': 'Bearer'
				},
				body: JSON.stringify(img2imgData),
			})
			let json = await img2imgRes.json()
			let imagebase64 = json.images[0].toString()
				.replace(/data:image\/png;|base64,/g, "");
			e.reply(segment.image('base64://' + imagebase64), true)

			delete FiguretypeUser[e.user_id];
			return true
		} else {
			e.reply('图都没有，换什么啊！', true);
			return false;
		}
	}
	async PartialRedraw(e) {
		if (!SDAPI) {
			return e.reply('当前无可用的SD绘图接口')
		}
		if (API == '') {
			return e.reply('当前无可用的去背景接口')
		}
		let canvas
		try {
			canvas = require("canvas");
			// Log.i(louvre)
			// Log.i(typeof louvre)
		} catch (err) {
			Log.w(err)
			e.reply('出错：重绘功能需要安装依赖：canvas\n请在yunzai根目录执行如下命令来安装依赖：\ncnpm install canvas --canvas_binary_host_mirror=https://registry.npmmirror.com/-/binary/canvas\n\n若安装依赖后仍出现此报错，您可查看控制台报错并联系开发者反馈')
			return true
		}


		if (FiguretypeUser[e.user_id]) {
			e.reply('当前有任务在列表中排队，请不要重复发送，处理完成后会自动发送结果，如果长时间没有结果，请等待1分钟再试')
			return true
		}
		if (this.e.img) {
			if (this.e.img[1]) {
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
				var img2imgData = {
					"init_images": ['data:image/jpeg;base64,' + OriginImgBase64],
					"sampler_index": "DPM++ 2S a Karras",
					"denoising_strength": 0.6,
					"prompt": "masterpiece, best quality," + msg,
					"seed": -1,
					"steps": 35,
					"cfg_scale": 11,
					"width": width,
					"height": height,
					"negative_prompt": "lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry",
					"styles": ["string"],
					"mask": MaskImg,
					"mask_blur": 1,
					"inpainting_mask_invert": 1,
				}
				let img2imgRes = await fetch(SDAPI, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'authorization': 'Bearer'
					},
					body: JSON.stringify(img2imgData),
				})
				console.log(img2imgRes)
				let json = await img2imgRes.json()
				let imagebase64 = json.images[0].toString()
					.replace(/data:image\/png;|base64,/g, "");
				// console.log(imagebase64)
				e.reply(segment.image('base64://' + imagebase64), true)
				delete FiguretypeUser[e.user_id];
				return true
			} else {
				e.reply('请将原图中需要重绘的部分涂黑，与原图一起发出', true);
				return false;
			}
		} else {
			e.reply('图都没有，画什么啊！', true);
			return false;
		}
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
		// Log.i(louvre)
		// Log.i(typeof louvre)
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