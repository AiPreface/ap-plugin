/*
 * @Author: 苏沫柒 3146312184@qq.com
 * @Date: 2023-03-10 21:39:55
 * @LastEditors: 苏沫柒 3146312184@qq.com
 * @LastEditTime: 2023-03-10 22:20:52
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\apps\associate.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */

import plugin from '../../../lib/plugins/plugin.js'
import _ from 'lodash'
import axios from 'axios'
import Log from '../utils/Log.js';

export class associate extends plugin {
	constructor() {
		super({
			/** 功能名称 */
			name: 'AP-联想',
			/** 功能描述 */
			dsc: 'Tags联想',
			/** https://oicqjs.github.io/oicq/#events */
			event: 'message',
			/** 优先级，数字越小等级越高 */
			priority: 1000,
			rule: [{
				/** 命令正则匹配 */
				reg: '^#联想.*$',
				/** 执行方法 */
				fnc: 'associate'
			}]
		})
	}
	async associate(e) {
		let msg = e.msg.replace(/^#联想/, '')
		try {
			const response = await axios.get(`https://tags.ap-plugin.com/index/listTags?chineseTags=${msg}`, {
				timeout: 10000
			});
            const data = response.data;
			let str = ''
			let num = 1
			let data_msg = []
            let ForwardMsg
			for (let i in data) {
				str += '╓ 结果' + num + '\n';
				str += '╟ 中文：' + i + '\n';
				str += '╙ Tag：【' + data[i] + '】';
				num++
				data_msg.push({
					message: str,
					nickname: Bot.nickname,
					user_id: Bot.uin
				});
				str = ''
			}
			if (data_msg.length == 0) {
				e.reply('没有找到相关联想词汇', true);
				return false
			}
			ForwardMsg = e.isGroup ? await e.group.makeForwardMsg(data_msg) : await e.friend.makeForwardMsg(data_msg);
			e.reply(ForwardMsg)
		} catch (error) {
			Log.e(error)
			e.reply('出错了，可能是无法连接官方服务器\n error:' + error, true);
		}
	}
}