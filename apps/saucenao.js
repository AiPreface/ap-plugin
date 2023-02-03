/*
 * @Author: Su
 * @Date: 2023-01-30 16:19:27
 * @LastEditors: 渔火Arcadia
 * @LastEditTime: 2023-01-30 18:40:23
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\apps\saucenao.js
 * @Description: Saucenao搜图
 * 
 * Copyright (c) 2023 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved. 
 */
import plugin from '../../../lib/plugins/plugin.js'
import axios from 'axios'
import {
	segment
} from 'oicq'
import Config from '../components/ai_painting/config.js'
import {
	parseImg
} from '../utils/utils.js'
import Log from "../utils/Log.js";
import NsfwCheck from '../components/ai_painting/nsfwcheck.js'

let ap_cfg = await Config.getcfg()
const APIKEY = ap_cfg.saucenao
const cooling = 120;
let getImagetime = {};
let thresholdList = {};
let coolingList = {};
let API_USE = 0;

setInterval(() => {
	API_USE = 0;
}, 1000 * 60 * 60 * 24);

export class saucenao extends plugin {
	constructor() {
		super({
			/** 功能名称 */
			name: 'Saucenao搜图',
			/** 功能描述 */
			dsc: '简单开发示例',
			/** https://oicqjs.github.io/oicq/#events */
			event: 'message',
			/** 优先级，数字越小等级越高 */
			priority: 5000,
			rule: [{
				/** 命令正则匹配 */
				reg: '^#?ap搜图((阈值)?\\d+)?$',
				/** 执行方法 */
				fnc: 'saucenao',
			},
			{
				/** 命令正则匹配 */
				reg: '^.*$',
				/** 执行方法 */
				fnc: 'getImage',
				/** 关闭日志 */
				log: false
			}
			]
		})
	}

	async saucenao(e) {
		if (!APIKEY)
			return await e.reply("请先配置搜图所需API，配置教程：https://www.wolai.com/wZpQ1pCV6t51bMPHupYTJA")
		let currentTime = new Date()
			.getTime();
		let lastTime = new Date(coolingList[e.user_id])
			.getTime();
		let elapsedTime = Math.floor((currentTime - lastTime) / 1000);
		if (coolingList[e.user_id] && elapsedTime < cooling && !e.isMaster) {
			e.reply(`请勿频繁调用，冷却时间为${cooling}秒，距离下次调用还有${cooling - elapsedTime}秒`);
			return false;
		}
		e = await parseImg(e)
		if (e.img) {
			let threshold = parseInt((e.msg ? e.msg.replace(/[^0-9]/ig, "") : thresholdList[e.user_id]) || 80);
			if (threshold < 50) {
				e.reply(`阈值不能低于50%，已自动调整为50%`);
				threshold = 50
			}
			else if (threshold > 99) {
				e.reply(`阈值已置为99%`);
				threshold = 99
			}
			// threshold = Math.max(50, threshold);
			let url = e.img[0];
			let APIURL = `https://saucenao.com/search.php?output_type=2&numres=30&api_key=${APIKEY[API_USE]}&url=${url}`;
			try {
				let res = await axios.get(APIURL, {
					headers: {
						"Accept-Encoding": "*"
					},
				});
				let data = res.data.results;
				let ForwardMsg;
				let data_msg = [];
				const filteredData = data.filter(result => result.header.similarity >= threshold || 0);
				const count = filteredData.length;
				if (count === 0) {
					e.reply(`未找到相似度高于${threshold}%的结果`);
					return;
				}
				data_msg.push({
					message: `搜索到${count}个相似度高于${threshold}%的结果：`,
					nickname: Bot.nickname,
					user_id: Bot.uin
				});
				for (let i = 0; i < data.length; i++) {
					let result = data[i];
					let index_name = result.header.index_name || "未知";
					let similarity = result.header.similarity || "未知";
					let ext_urls = result.data.ext_urls?.[0] || "未知";
					let title = result.data.title || "未知";
					let index_id = result.header.index_id;
					let thumbnail = result.header.thumbnail;
					if (similarity < threshold) {
						continue;
					}
					let base64 = await axios.get(thumbnail, {
						headers: {
							"Accept-Encoding": "*"
						},
						responseType: 'arraybuffer'
					});
					base64 = Buffer.from(base64.data, 'binary')
						.toString('base64');
					let nsfw = await NsfwCheck.check(base64);
					if (nsfw.message) {
						Log.w("【ap搜图：图像审核失败】" + nsfw.message);
						nsfw["isnsfw"] = false;
					}
					let msg = [
						(nsfw.isnsfw == false) ? segment.image(thumbnail) : `【缩略图不合规，已隐藏】`,
						`【序号】：${i + 1}\n【相似度】：${similarity}%\n【标题】：${title}\n【地址】：${ext_urls}\n【搜索引擎】：${index_name}`
					];

					if (index_id == 5 || index_id == 6) {
						let pixiv_id = result.data.pixiv_id;
						let member_id = result.data.member_id;
						let member_name = result.data.member_name;
						let quick_url = `https://pixiv.re/${pixiv_id}.jpg`;
						msg.push(`【PixivID】：${pixiv_id}\n【作者】：${member_name}\n【作者ID】：${member_id}\n【快速下载】：${quick_url}`);
					}
					data_msg.push({
						message: msg,
						nickname: Bot.nickname,
						user_id: Bot.uin
					});
				}
				ForwardMsg = e.isGroup ? await e.group.makeForwardMsg(data_msg) : await e.friend.makeForwardMsg(data_msg);
				e.reply(ForwardMsg);
				data_msg = [];
				coolingList[e.user_id] = new Date()
					.toLocaleString();
			} catch (err) {
				if (API_USE < APIKEY.length - 1) {
					API_USE++;
					this.saucenao(e);
					return true;
				} else {
					e.reply('搜索失败，可能是APIKEY达到使用限制或者APIKEY验证错误，请尝试增加APIKEY或检查网络~', true);
					Log.e(`API已用尽，当前为第${API_USE + 1}个APIKEY，共${APIKEY.length}个APIKEY`);
					Log.e(err)
				}
			}
			delete getImagetime[e.user_id];
			return true;
		} else {
			e.reply('请在60s内发送需要搜索的图片~', true);
			let threshold = e.msg.replace(/[^0-9]/ig, "") || 80;
			thresholdList[e.user_id] = threshold;
			getImagetime[e.user_id] = setTimeout(() => {
				if (getImagetime[e.user_id]) {
					e.reply('搜图已超时，请再次发送命令~', true);
					delete getImagetime[e.user_id];
					delete thresholdList[e.user_id];
				}
			}, 60000);
			return false;
		}
	}
	async getImage(e) {
		if (!e.img) {
			return false;
		}
		if (getImagetime[e.user_id]) {
			clearTimeout(getImagetime[e.user_id]);
			delete getImagetime[e.user_id];
		} else {
			return false;
		}
		let result = await this.saucenao(e);
		if (result) {
			return true;
		}
	}
}























































































































































































































































































































































































































































































































































































































































































































































































































































// 懒狗渔火