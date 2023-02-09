import plugin from '../../../lib/plugins/plugin.js'
import fetch from 'node-fetch';
import Config from '../components/ai_painting/config.js';

export class ServerStatus extends plugin {
	constructor() {
		super({
			/** 功能名称 */
			name: '服务器状态',
			/** 功能描述 */
			dsc: '^服务器状态',
			/** https://oicqjs.github.io/oicq/#events */
			event: 'message',
			/** 优先级，数字越小等级越高 */
			priority: 5000,
			rule: [{
				/** 命令正则匹配 */
				reg: '^#?服务器状态$',
				/** 执行方法 */
				fnc: 'serverStatus',
				/** 主人才能执行 */
				permission: "master",
			}]
		})
	}

	async serverStatus(e) {
		let apiList = await getApiList(e);
		let comprehensive = [];
		for (let i = 0; i < apiList.length; i++) {
			comprehensive[apiList[i].api] = {
				"remark": apiList[i].remark, // 备注
				"status": 0, // 0: 离线 1: 正常 2: 不支持
				"compatible": 1, // 0: 没开启WebUI或者设置了密码 1: 兼容 2： 不是最新版本，没有内存接口 3: 没开启WebUI或者设置了密码且不是最新版本，没有内存接口
				"time": 0, // 响应时间
				"python": "", // python版本
				"torch": "", // torch版本
				"xformers": "", // xformers版本
				"gradio": "", // gradio版本
				"commit": "", // commit版本
				"checkpoint": "", // checkpoint版本
				"ram": {
					"total": "", // 总内存
					"used": "", // 已用内存
					"free": "", // 空闲内存
				},
				"cuda": {
					"total": "", // 总显存
					"used": "", // 已用显存
					"free": "", // 空闲显存
				}
			}
		}
		for (let i = 0; i < apiList.length; i++) {
			let api = apiList[i].api;
			let start = new Date()
				.getTime();
			try {
				let res = await fetch(api + "/sdapi/v1/txt2img");
				let data = await res.json();
				if (data.detail == "Method Not Allowed") {
					comprehensive[api].status = 1;
				} else {
					comprehensive[api].status = 2;
				}
			} catch (error) {
				comprehensive[api].status = 0;
			}
			let end = new Date()
				.getTime();
			comprehensive[api].time = end - start;
		}
		for (let i = 0; i < apiList.length; i++) {
			let api = apiList[i].api;
			if (comprehensive[api].status == 1) {
				try {
					let res = await fetch(api + "/config");
					let data = await res.json();
					if (data.detail == "Not authenticated") {
						comprehensive[api].compatible = 0;
						continue;
					}
					for (var j in data['components']) {
						if (data['components'][j]['id'] == 1593) {
							let info = data['components'][j]['props']['value'];
							let python = info.match(/python: <span title=\".*\">(.*)<\/span>/);
							if (python) {
								comprehensive[api].python = python[1];
							}
							let torch = info.match(/torch: (.*)\n/);
							if (torch) {
								comprehensive[api].torch = torch[1];
							}
							let xformers = info.match(/xformers: (.*)\n/);
							if (xformers) {
								comprehensive[api].xformers = xformers[1];
							}
							let gradio = info.match(/gradio: (.*)\n/);
							if (gradio) {
								comprehensive[api].gradio = gradio[1];
							}
							let commit = info.match(/commit: <a href=\".*\">(.*)<\/a>/);
							if (commit) {
								comprehensive[api].commit = commit[1];
							}
							let response = await fetch(api + '/sdapi/v1/options', {
								method: 'GET',
								headers: {
									"Content-Type": "application/json"
								}
							});
							let optionsdata = await response.json();
							comprehensive[api].checkpoint = optionsdata['sd_model_checkpoint'].match(/[0-9a-f]{10}/)[0];
						}
					}
				} catch (error) {
					comprehensive[api].compatible = 0; // 没开启WebUI或者设置了密码
				}
			} else {
				comprehensive[api].compatible = 0; // 没开启WebUI或者设置了密码
			}
		}
		for (let i = 0; i < apiList.length; i++) {
			let api = apiList[i].api;
			if (comprehensive[api].status == 1) {
				try {
					let res = await fetch(api + "/sdapi/v1/memory");
					let data = await res.json();
					comprehensive[api].ram.total = (data['ram']['total'] / 1024 / 1024 / 1024)
						.toFixed(2);
					comprehensive[api].ram.used = (data['ram']['used'] / 1024 / 1024 / 1024)
						.toFixed(2);
					comprehensive[api].ram.free = (data['ram']['free'] / 1024 / 1024 / 1024)
						.toFixed(2);
					comprehensive[api].cuda.total = (data['cuda']['system']['total'] / 1024 / 1024 / 1024)
						.toFixed(2);
					comprehensive[api].cuda.used = (data['cuda']['system']['used'] / 1024 / 1024 / 1024)
						.toFixed(2);
					comprehensive[api].cuda.free = (data['cuda']['system']['free'] / 1024 / 1024 / 1024)
						.toFixed(2);
				} catch (error) {
					comprehensive[api].compatible = 2; // 不是最新版本，没有内存接口
				}
			} else if (comprehensive[api].compatible == 0) {
				comprehensive[api].compatible = 3; // 不是最新版本，没有内存接口
			}
		}
		let data_msg = []
		let ForwardMsg
		for (var i in comprehensive) {
			let msg = []
			msg.push("【备注】：" + comprehensive[i].remark)
			msg.push("\n【状态】：" + (comprehensive[i].status == 1 ? "正常" : (comprehensive[i].status == 0 ? "异常" : "不兼容")))
			msg.push("\n【相应时间】：" + comprehensive[i].time + "ms")
			if (comprehensive[i].compatible == 0) {
				msg.push("\n【Python版本】：未开启WebUI或设置了密码")
				msg.push("\n【PyTorch版本】：未开启WebUI或设置了密码")
				msg.push("\n【Xformers版本】：未开启WebUI或设置了密码")
				msg.push("\n【Gradio版本】：未开启WebUI或设置了密码")
				msg.push("\n【最新Commit】：未开启WebUI或设置了密码")
				msg.push("\n【最新Checkpoint】：未开启WebUI或设置了密码")
				msg.push("\n【内存占用】：" + comprehensive[i].ram.used + "GB/" + comprehensive[i].ram.total + "GB")
				msg.push("\n【显存占用】：" + comprehensive[i].cuda.used + "GB/" + comprehensive[i].cuda.total + "GB")
			} else if (comprehensive[i].compatible == 1) {
				msg.push("\n【Python版本】：" + comprehensive[i].python)
				msg.push("\n【PyTorch版本】：" + comprehensive[i].pytorch)
				msg.push("\n【Xformers版本】：" + comprehensive[i].xformers)
				msg.push("\n【Gradio版本】：" + comprehensive[i].gradio)
				msg.push("\n【最新Commit】：" + comprehensive[i].commit)
				msg.push("\n【最新Checkpoint】：" + comprehensive[i].checkpoint)
				msg.push("\n【内存占用】：" + comprehensive[i].ram.used + "GB/" + comprehensive[i].ram.total + "GB")
				msg.push("\n【显存占用】：" + comprehensive[i].cuda.used + "GB/" + comprehensive[i].cuda.total + "GB")
			} else if (comprehensive[i].compatible == 2) {
				msg.push("\n【Python版本】：" + comprehensive[i].python)
				msg.push("\n【PyTorch版本】：" + comprehensive[i].pytorch)
				msg.push("\n【Xformers版本】：" + comprehensive[i].xformers)
				msg.push("\n【Gradio版本】：" + comprehensive[i].gradio)
				msg.push("\n【最新Commit】：" + comprehensive[i].commit)
				msg.push("\n【最新Checkpoint】：" + comprehensive[i].checkpoint)
				msg.push("\n【内存占用】：不是最新版本，请更新")
				msg.push("\n【显存占用】：不是最新版本，请更新")
			} else {
				msg.push("\n【Python版本】：未开启WebUI或设置了密码")
				msg.push("\n【PyTorch版本】：未开启WebUI或设置了密码")
				msg.push("\n【Xformers版本】：未开启WebUI或设置了密码")
				msg.push("\n【Gradio版本】：未开启WebUI或设置了密码")
				msg.push("\n【最新Commit】：未开启WebUI或设置了密码")
				msg.push("\n【最新Checkpoint】：未开启WebUI或设置了密码")
				msg.push("\n【内存占用】：不是最新版本，请更新")
				msg.push("\n【显存占用】：不是最新版本，请更新")
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
	}
}
async function getApiList(e) {
	let config = await Config.getcfg();
	let list = []
	if (config.APIList.length == 0) {
		e.reply("当前无可用绘图接口，请先配置接口。\n配置指令： #ap添加接口\n参考文档：https://www.wolai.com/tiamcvmiaLJLePhTr4LAJE\n发送#ap说明书以查看详细说明", true);
		return true;
	} else {
		for (let i = 0; i < config.APIList.length; i++) {
			list.push({
				"api": config.APIList[i].url,
				"remark": config.APIList[i].remark,
			})
		}
	}
	return list;
}