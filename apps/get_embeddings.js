/*
 * @Author: Su
 * @Date: 2023-01-03 22:16:25
 * @LastEditors: 渔火Arcadia
 * @LastEditTime: 2023-01-03 22:23:41
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\apps\get_embeddings.js
 * @Description: 
 * 
 * Copyright (c) 2023 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved. 
 */
import plugin from '../../../lib/plugins/plugin.js'
import axios from 'axios'
import Config from '../components/ai_painting/config.js';

const _path = process.cwd();
const API = `https://x0y.cc/`

export class GetEmbeddings extends plugin {
    constructor() {
        super({
            /** 功能名称 */
            name: '查看预设',
            /** 功能描述 */
            dsc: '查看预设',
            /** https://oicqjs.github.io/oicq/#events */
            event: 'message',
            /** 优先级，数字越小等级越高 */
            priority: 5000,
            rule: [
                {
                    /** 命令正则匹配 */
                    reg: '^#查看预设$',
                    /** 执行方法 */
                    fnc: 'getEmbeddings'
                }
            ]
        })
    }

    async getEmbeddings(e) {
        // 取默认接口
        let apcfg = await Config.getcfg()
        if (apcfg.APIList.length == 0) {
            e.reply('当前暂无可用接口')
            return true
        }
        let index = apcfg.usingAPI
        let apiobj = apcfg.APIList[index - 1]
        let API = Object.keys(apiobj)[0]      //接口
        let remark = Object.values(apiobj)[0] //接口备注 

        let data = await getEmbeddings(API)
        if (data) {
            let ForwardMsg;
            let data_msg = [];
            let num = 0
            for (var i in data.loaded) {
                num++
                data_msg.push({
                    message: `${num} \n├预设名称：${i}\n└训练步数：${data.loaded[i].step}`,
                    nickname: Bot.nickname,
                    user_id: Bot.uin,
                });
            }
            if (e.isGroup) {
                ForwardMsg = await e.group.makeForwardMsg(data_msg);
            }
            else {
                ForwardMsg = await e.friend.makeForwardMsg(data_msg);
            }
            e.reply(ForwardMsg);
            return true
        } else {
            e.reply('获取失败')
            return false
        }
    }
}

async function getEmbeddings(API) {
    let url = API.endsWith('/') ? API : API + '/'
    let response = await axios.get(url + `sdapi/v1/embeddings`, {
        headers: {
            'accept': 'application/json'
        }
    });
    if (response.status == 200) {
        return response.data
    } else {
        return false
    }
}