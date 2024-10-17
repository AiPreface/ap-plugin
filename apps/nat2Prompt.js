/*
 * @Author: 苏沫柒 3146312184@qq.com
 * @Date: 2023-03-10 20:16:54
 * @LastEditors: 苏沫柒 3146312184@qq.com
 * @LastEditTime: 2023-03-10 23:05:14
 * @FilePath: \ap-plugin\apps\nat2pmpt.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import plugin from '../../../lib/plugins/plugin.js'
import _ from 'lodash'
import axios from 'axios'
import Config from '../components/ai_painting/config.js';
import Log from '../utils/Log.js';

let ap_cfg = await Config.getcfg()
const API = ap_cfg.openai_key

export class nat2pmpt extends plugin {
	constructor() {
		super({
			/** 功能名称 */
			name: 'AP-自然语言处理',
			/** 功能描述 */
			dsc: '自然语言转prompt',
			event: 'message',
			/** 优先级，数字越小等级越高 */
			priority: 1009,
			rule: [{
				/** 命令正则匹配 */
				reg: '^#处理.*$',
				/** 执行方法 */
				fnc: 'nat2pmpt'
			}]
		})
	}
	async nat2pmpt(e) {
		if (!API)
			return await e.reply("请先配置处理所需的OpenAI Key")
		let lang = e.msg.replace(/^#处理/, '')
		if (!lang)
			return await e.reply("请输入要处理的自然语言")
		let len = (lang.split('').length / 2).toFixed(0)
		if (len < 10) len = 10
		await e.reply("即将生成至少" + len + "个prompt，请稍后......")
		try {
			const response = await axios.post(
				'https://nat2pmpt.pages.dev/v1/chat/completions', {
				'model': 'gpt-3.5-turbo',
				'messages': [{
					'role': 'user',
					'content': '请为我的描述的图像生成不得少于' + len + '个的英文prompt，每个prompt用英文逗号分割，不用标注序号，用小括号将prompt与其权重包起来，比如(girls:1.3)，请不要输出任何中文和额外的解释，以下是我描述的图像：' + lang
				}],
				'temperature': 0.7
			}, {
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer ' + API
				}
			}
			);
			let msg = response.data.choices[0].message.content
			msg = msg.replace(/\n/g, '')
			e.reply(msg, true)
		} catch (error) {
			Log.e(error)
			e.reply('出错了，可能是AP服务器出现问题，也可能是APIKEY失效')
		}
	}
}