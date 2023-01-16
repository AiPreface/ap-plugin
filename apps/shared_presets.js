/*
 * @Author: 0卡苏打水
 * @Date: 2023-01-15 02:34:55
 * @LastEditors: 渔火Arcadia
 * @LastEditTime: 2023-01-15 23:03:27
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\apps\share_presets.js
 * @Description: 云端共享预设
 * 
 * Copyright (c) 2023 by Su , All Rights Reserved. 
 */
import plugin from '../../../lib/plugins/plugin.js'
import fs from 'fs'
import { segment } from 'oicq'
import { createRequire } from "module";
import Log from '../utils/Log.js';
import path from 'path';
import Config from '../components/ai_painting/config.js';
const require = createRequire(import.meta.url)
const _path = process.cwd();
const file_path = path.join(_path, "\/plugins\/ap-plugin\/config\/config\/preset.json")
const text = "请先安装依赖：pnpm add request -w"

export class example extends plugin {
	constructor() {
		super({
			name: '共享预设',
			dsc: '简单开发示例',
			event: 'message',
			priority: 5000,
			rule: [{
				reg: '^#?导出预设$',
				fnc: 'Share_preset',
				permission: "master"
			},
			{
				reg: '^#?导入预设.*$',
				fnc: 'Import_Presets',
				permission: "master"
			}
			]
		})
	}

	async Share_preset(e) {
		let data = await Config.getPresets()
		let count = data.length
		let size = fs.statSync(file_path)
			.size / 1024
		if (size > 10000) {
			e.reply("本机预设文件过大，无法导出，最高支持10MB预设文件\n当前预设文件大小为" + size.toFixed(2) + "KB")
			return true
		}
		e.reply(`正在导出${count}个预设，共${size.toFixed(2)}KB`)
		try { var res = await Upload(file_path) } catch (err) { return e.reply('上传失败，可能服务器暂时脱机，请稍后重试') }
		if (!res) {
			return e.reply(text)
		}
		let code = res.split("/")
			.pop()
			.split(".")[0]
		e.reply("本机预设文件已导出，共" + count + "个预设\n取件码：" + code)
		return true
	}
	async Import_Presets(e) {
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
					if (val.type == "text") {
						e.msg = [val.text];
						e.msg = e.msg[0]
						break;
					}
				}
			}
		}
		e.msg = e.msg.replace(/#?导入预设/, "");
		e.msg = e.msg.match(/[a-zA-Z0-9]{4}/g);
		if (e.msg) {
			e.msg = e.msg[0];
		}
		if (e.msg == "") {
			e.reply("请输入云端预设文件取件码");
			return true;
		}
		e.reply("正在判断云端预设文件大小与合法性，请稍后")
		// try{var size = await GetSize(e.msg)}catch(err){return e.reply('下载失败，可能服务器暂时脱机，请稍后重试')}
		// if (!size) { return e.reply(text) }
		// size = size.toFixed(2)
		// if (size > 10000) {
		// 	e.reply("云端预设文件大小为" + size + "KB，超过10MB，无法导入")
		// 	return true
		// }
		try { var res = await Download(e.msg) } catch (err) { return e.reply('下载失败，可能服务器暂时脱机，请稍后重试') }
		if (!res) {
			return e.reply(text)
		}
		let data = await Config.getPresets()
		let res_data = JSON.parse(res)
		for (let val in res_data) {
			if (!res_data[val].keywords) {
				e.reply("远程预设文件第" + (val + 1) + "个数据keywords参数错误，无法导入")
				console.log(res_data[val])
				return true
			} else if (!res_data[val].tags && res_data[val].tags != "") {
				e.reply("远程预设文件第" + (val + 1) + "个数据tags参数错误，无法导入")
				console.log(res_data[val])
				return true
			}
		}
		let count = 0
		let merge = 0
		let splicelist = []
		for (let val in res_data) {
			for (let val2 in data) {
				if (JSON.stringify(res_data[val]) == JSON.stringify(data[val2])) {
					splicelist.push(val)
					count++
					break
				}
				if (res_data[val].pt == data[val2].pt && JSON.stringify(res_data[val].param) == JSON.stringify(data[val2].param) && res_data[val].tags == data[val2].tags && res_data[val].ntags == data[val2].ntags) {
					let keywords = res_data[val].keywords.concat(data[val2].keywords)
					keywords = [...new Set(keywords)]
					data[val].keywords = keywords
					splicelist.push(val)
					merge++
					break
				}
			}
		}
		for (let i = splicelist.length - 1; i >= 0; i--) {
			res_data.splice(splicelist[i], 1)
		}
		data = data.concat(res_data)
		await Config.setpreSets(data)
		e.reply("导入成功，已导入" + Object.keys(res_data).length + "个预设，已跳过" + count + "个重复预设，合并" + merge + "个重复关键词")
		return true
	}
}
async function Upload(filename) {
	try {
		var request = require("request");
	} catch (err) { return false }
	return new Promise((resolve, reject) => {
		request.post('https://0x0.st', function (err, resp, body) {
			if (err) {
				reject(err);
			} else {
				resolve(body);
			}
		})
			.form()
			.append('file', fs.createReadStream(filename));
	});
}
async function Download(code) {
	try {
		var request = require("request");
	} catch (err) { return false }
	return new Promise((resolve, reject) => {
		request('https://0x0.st/' + code + '.json', function (err, resp, body) {
			if (err) {
				reject(err);
			} else {
				resolve(body);
			}
		});
	});
}
// async function GetSize(code) {
// 	try {
// 		var request = require("request");
// 	} catch (err) { return false }
// 	return new Promise((resolve, reject) => {
// 		request('https://0x0.st/' + code + '.json', function (err, resp, body) {
// 			if (err) {
// 				reject(err);
// 			} else {
// 				resolve(resp.headers['content-length'] / 1024);
// 			}
// 		});
// 	});
// }
