/*
 * @Author: 0卡苏打水
 * @Date: 2023-01-04 01:03:58
 * @LastEditors: 渔火Arcadia
 * @LastEditTime: 2023-01-05 16:33:08
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\apps\ai_dectect.js
 * @Description: 
 * 
 * Copyright (c) 2023 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved. 
 */
import plugin from '../../../lib/plugins/plugin.js'
import fetch from 'node-fetch'
import axios from 'axios'
import Config from '../components/ai_painting/config.js';
import { parseImg } from '../utils/utils.js';

const _path = process.cwd();
let ap_cfg = await Config.getcfg()
const API = ap_cfg.ai_detect

let FiguretypeUser = {}
let getImagetime = {}

export class AiDetect extends plugin {
    constructor() {
        super({
            /** 功能名称 */
            name: 'AP-鉴定图片',
            /** 功能描述 */
            dsc: '简单开发示例',
            event: 'message',
            /** 优先级，数字越小等级越高 */
            priority: 1009,
            rule: [
                {
                    /** 命令正则匹配 */
                    reg: '^#?(检查|鉴定)((图|画)(片|像))?$',
                    /** 执行方法 */
                    fnc: 'anime_ai_detect'
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

    async anime_ai_detect(e) {
        if (!API)
            return await e.reply("请先配置鉴定图片所需API")
        if (FiguretypeUser[e.user_id]) {
            e.reply('当前有任务在列表中排队，请不要重复发送，鉴定完成后会自动发送结果，如果长时间没有结果，请等待1分钟再试')
            return true
        }
        e = await parseImg(e)
        if (this.e.img) {
            e.reply('正在鉴定图片，请稍后...', true)
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
                .then(res => res.json())
                .then(json => {
                    if (json.data[0].confidences[0].label == "ai") {
                        var ai = json.data[0].confidences[0].confidence
                        var human = json.data[0].confidences[1].confidence
                    } else {
                        var ai = json.data[0].confidences[1].confidence
                        var human = json.data[0].confidences[0].confidence
                    }
                    ai = (ai * 100)
                        .toFixed(2)
                    human = (human * 100)
                        .toFixed(2)
                    let end = new Date()
                    let time = ((end.getTime() - start.getTime()) / 1000)
                        .toFixed(2)
                    if (human > ai) {
                        e.reply(`鉴定完成，耗时${time}秒，这张画像【不是AI制作的】，置信率概率为${human}%`, true)
                    }
                    else {
                        if (ai < 96)
                            e.reply(`鉴定完成，耗时${time}秒，这张画像【是AI制作的】，置信率概率为${ai}%\n※：这并不意味着这张画像一定是AI制作的，因为结果置信率低于96%，数据仅供参考`, true)
                        else
                            e.reply(`鉴定完成，耗时${time}秒，这张画像【是AI制作的】，置信率概率为${ai}%`, true)
                    }
                    delete FiguretypeUser[e.user_id];
                    return true
                })
        } else {
            e.reply('请在60s内发送需要鉴定的图片~', true);
            getImagetime[e.user_id] = setTimeout(() => {
                if (getImagetime[e.user_id]) {
                    e.reply('鉴定已超时，请再次发送命令~', true);
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
        let result = await this.anime_ai_detect(e);
        if (result) {
            return true;
        }
    }
}