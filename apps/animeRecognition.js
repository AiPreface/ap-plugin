/*
 * @Author: 0卡苏打水
 * @Date: 2023-01-04 01:03:58
 * @LastEditors: 苏沫柒 3146312184@qq.com
 * @LastEditTime: 2023-04-09 17:14:42
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\apps\animedb.js
 * @Description: 
 * 
 * Copyright (c) 2023 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved. 
 */
import plugin from '../../../lib/plugins/plugin.js'
import fetch from 'node-fetch';
import axios from 'axios';
import {
	parseImg
} from '../utils/utils.js';
import fs from 'fs'
import {
	fileFromPath
} from 'formdata-node/file-from-path'
import {
	FormData
} from 'formdata-node'

let Path = process.cwd() + '\/data\/temp\/'

let getImagetime = {}

export class animedb extends plugin {
	constructor() {
		super({
			/** 功能名称 */
			name: '识别动漫人物',
			/** 功能描述 */
			dsc: '识别动漫人物',
			/** https://oicqjs.github.io/oicq/#events */
			event: 'message',
			/** 优先级，数字越小等级越高 */
			priority: 5000,
			rule: [{
					/** 命令正则匹配 */
					reg: '^#?(ap)?识别$',
					/** 执行方法 */
					fnc: 'animedb'
				},
				{
					/** 命令正则匹配 */
					reg: '^.*$',
					/** 执行方法 */
					fnc: 'getImage',
					log: false
				}
			]
		})
	}

	async animedb(e) {
		e = await parseImg(e)
		if (this.e.img) {
			if (!fs.existsSync(Path)) {
				fs.mkdirSync(Path)
			} else {
				let files = fs.readdirSync(Path)
				files.forEach(function(file, index) {
					let DelPath = Path + '/' + file
					fs.unlinkSync(DelPath)
				})
			}
			e.reply('正在识别图内动漫人物，请稍后...', true)
			let start = new Date()
			let img = await axios.get(e.img[0], {
				responseType: 'arraybuffer'
			});
			let base64 = Buffer.from(img.data, 'binary')
				.toString('base64');
			fs.writeFileSync(Path + 'img.png', base64, 'base64')
			const form = new FormData()
			form.append('image', await fileFromPath(Path + 'img.png'))
			const res = await fetch('https://aiapiv2.animedb.cn/ai/api/detect', {
				method: 'POST',
				body: form
			})
			const response = await res.json()
			let end = new Date()
			let content = response.data;
			let ForwardMsg = '';
			ForwardMsg += '===识别完成，耗时：' + ((end - start) / 1000)
				.toFixed(2) + 's===\n';
			if (content.length > 0) {
				for (let i = 0; i < content.length; i++) {
					ForwardMsg += '╔ 动漫人物：' + content[i].name + '\n';
					ForwardMsg += '╙ 出自动漫：' + content[i].cartoonname + '\n';
				}
			} else {
				ForwardMsg += '未识别到动漫人物';
			}
			e.reply(ForwardMsg, true)
			return true;

		} else {
			e.reply('请在60s内发送需要识别的图片~', true);
			getImagetime[e.user_id] = setTimeout(() => {
				if (getImagetime[e.user_id]) {
					e.reply('识别已超时，请再次发送命令~', true);
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
		let result = await this.animedb(e);
		if (result) {
			return true;
		}
	}
}