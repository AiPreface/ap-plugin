/*
 * @Author: 0卡苏打水
 * @Date: 2023-01-19 01:03:58
 * @LastEditors: 0卡苏打水
 * @LastEditTime: 2023-01-19 16:33:08
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\apps\anime_aesthetic_predict.js
 * @Description: 
 * 
 * Copyright (c) 2023 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved. 
 */
import plugin from '../../../lib/plugins/plugin.js'
import _ from 'lodash'
import {
	parseImg
} from '../utils/utils.js';
import fetch from 'node-fetch'
import axios from 'axios'
import Config from '../components/ai_painting/config.js';
import Log from '../utils/Log.js';

let FiguretypeUser = {}
let getImagetime = {}
let ap_cfg = await Config.getcfg()
const API = ap_cfg.anime_aesthetic_predict

export class score extends plugin {
	constructor() {
		super({
			/** 功能名称 */
			name: 'AP-审美预测',
			/** 功能描述 */
			dsc: '^动漫审美预测',
			event: 'message',
			/** 优先级，数字越小等级越高 */
			priority: 1009,
			rule: [{
				/** 命令正则匹配 */
				reg: '^#?(二次元美学|动漫审美预测)$',
				/** 执行方法 */
				fnc: 'score',
			},
			{
				/** 命令正则匹配 */
				reg: '^.*$',
				/** 执行方法 */
				fnc: 'getImage',
				/** 日志 */
				log: false,
			}
			]
		})
	}

	async score(e) {
		if (!API)
			return await e.reply('请先配置动漫审美预测所需API')
		if (FiguretypeUser[e.user_id]) {
			e.reply('当前有任务在列表中排队，请不要重复发送，取得结果后完成后会自动发送结果，如果长时间没有结果，请等待1分钟再试')
			return true
		}
		e = await parseImg(e)
		if (this.e.img) {
			e.reply('正在进行预测，请稍后...')
			FiguretypeUser[e.user_id] = setTimeout(() => {
				if (FiguretypeUser[e.user_id]) {
					delete FiguretypeUser[e.user_id];
				}
			}, 60000);
			let start = new Date()
			let img = await axios.get(e.img[0], {
				responseType: 'arraybuffer'
			});
			let base64 = Buffer.from(img.data, 'binary')
				.toString('base64');
			await fetch(API, {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					data: [
						"data:image/png;base64," + base64
					]
				})
			})
				.then(r => r.json())
				.then(
					r => {
						let score = (r.data[0] * 100)
							.toFixed(2)
						let end = new Date()
						let time = ((end - start) / 1000)
							.toFixed(2)
						e.reply(`预测结果：${score}分，耗时：${time}秒`, true)
						delete FiguretypeUser[e.user_id]
					},).catch(error => {
						Log.e(error)
						e.reply('预测失败，请重试')
						delete FiguretypeUser[e.user_id]
					})
			return true
		} else {
			e.reply('请在60s内发送需要预测的图片~', true);
			getImagetime[e.user_id] = setTimeout(() => {
				if (getImagetime[e.user_id]) {
					e.reply('预测已超时，请再次发送命令~', true);
					delete getImagetime[e.user_id];
				}
			}, 60000);
			return false;
		}
	}
	async getImage(e) {
		if (!this.e.img) {
			return false;
		}
		if (getImagetime[e.user_id]) {
			clearTimeout(getImagetime[e.user_id]);
			delete getImagetime[e.user_id];
		} else {
			return false;
		}
		let result = await this.score(e);
		if (result) {
			return true;
		}
	}
}