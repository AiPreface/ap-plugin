/*
 * @Author: Su
 * @Date: 2022-12-23 22:19:02
 * @LastEditors: 渔火Arcadia
 * @LastEditTime: 2022-12-24 01:12:07
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\apps\appreciate.js
 * @Description: 鉴赏图片获取tags
 */
import plugin from '../../../lib/plugins/plugin.js'
import fetch from 'node-fetch'
import axios from 'axios'
import { segment } from "oicq";
import Config from '../components/ap/config.js';

let apcfg = await Config.getcfg()
const api = apcfg.appreciate
let FiguretypeUser = {}
let getImagetime = {}

export class appreciate extends plugin {
    constructor() {
        super({
            /** 功能名称 */
            name: '鉴赏图片',
            /** 功能描述 */
            dsc: '鉴赏图片',
            /** https://oicqjs.github.io/oicq/#events */
            event: 'message',
            /** 优先级，数字越小等级越高 */
            priority: 5000,
            rule: [
                {
                    /** 命令正则匹配 */
                    reg: '^鉴赏$',
                    /** 执行方法 */
                    fnc: 'appreciate'
                },
                {
                    /** 命令正则匹配 */
                    reg: '^.*$',
                    /** 执行方法 */
                    fnc: 'getImage'
                }
            ]
        })
    }

    async appreciate(e) {
        if (!api)
            return await e.reply("请先配置鉴赏图片所需api，配置教程：https://www.wolai.com/jRW3wLMn53vpf9wc9JCo6T")
        await AppreciatePictures(e)
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
        await AppreciatePictures(e);
    }
}


async function AppreciatePictures(e) {
    let start = new Date()
        .getTime();
    if (FiguretypeUser[e.user_id]) {
        e.reply('当前你有任务在列表中排排坐啦，请不要重复发送喵~（๑>؂<๑）')
        return true
    }
    if (e.source) {
        let reply;
        if (e.isGroup) {
            reply = (await e.group.getChatHistory(e.source.seq, 1)).pop()?.message;
        } else {
            reply = (await e.friend.getChatHistory(e.source.time, 1)).pop()?.message;
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
    if (e.img) {
        FiguretypeUser[e.user_id] = setTimeout(() => {
            if (FiguretypeUser[e.user_id]) {
                delete FiguretypeUser[e.user_id];
            }
        }, 60000);
        await e.reply([segment.at(e.user_id), '少女鉴赏中~（*/∇＼*）', true])
        let img = await axios.get(e.img[0], {
            responseType: 'arraybuffer'
        });
        let base64 = Buffer.from(img.data, 'binary')
            .toString('base64');
        await fetch(api, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                data: [
                    "data:image/png;base64," + base64,
                    0.3,
                ]
            })
        })
            .then(res => res.json())
            .then(async res => {
                let tags = res.data[2].confidences;
                console.log(tags)
                let tags_str = '';
                for (let i = 0; i < tags.length; i++) {
                    if (tags[i].confidence > 0.98) {
                        tags_str += `{{{${tags[i].label}}}},`;
                    } else if (tags[i].confidence > 0.95 && tags[i].confidence < 0.98) {
                        tags_str += `{{${tags[i].label}}},`;
                    } else if (tags[i].confidence > 0.9 && tags[i].confidence < 0.95) {
                        tags_str += `{${tags[i].label}},`;
                    } else {
                        tags_str += `${tags[i].label},`;
                    }
                }
                let end = new Date().getTime();
                let time = ((end - start) / 1000).toFixed(2);
                let msg = `{{masterpiece}},{{best quality}},{{official art}},{{extremely detailed CG unity 8k wallpaper}},` + tags_str
                await e.reply([segment.at(e.user_id), `鉴赏用时：${time}秒`, true])
                await e.reply(msg, true)
                if (FiguretypeUser[e.user_id]) {
                    delete FiguretypeUser[e.user_id];
                }
            })
    } else {
        e.reply('请在60s内发送图片喵~（๑>؂<๑）')
        getImagetime[e.user_id] = setTimeout(() => {
            if (getImagetime[e.user_id]) {
                e.reply('鉴赏已超时，请再次发送命令喵~', true);
                delete getImagetime[e.user_id];
            }
        }, 60000);
        return false;
    }
}

