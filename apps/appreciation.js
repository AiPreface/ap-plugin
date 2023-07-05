/*
 * @Author: 0卡苏打水
 * @Date: 2022-12-23 22:19:02
 * @LastEditors: 苏沫柒 3146312184@qq.com
 * @LastEditTime: 2023-05-07 16:47:41
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\apps\appreciate.js
 * @Description: 鉴赏图片获取tags
 */
import plugin from '../../../lib/plugins/plugin.js'
import fetch from 'node-fetch'
import axios from 'axios'
import Config from '../components/ai_painting/config.js';
import Log from '../utils/Log.js';
import { parseImg } from '../utils/utils.js';
import pic_tools from '../utils/pic_tools.js';
import { segment } from 'icqq';

let ap_cfg = await Config.getcfg()
const API = ap_cfg.appreciate
let figure_type_user = {}
let get_image_time = {}

export class appreciate extends plugin {
    constructor() {
        super({
            /** 功能名称 */
            name: 'AP-鉴赏图片',
            /** 功能描述 */
            dsc: '鉴赏图片',
            event: 'message',
            /** 优先级，数字越小等级越高 */
            priority: 1009,
            rule: [
                {
                    /** 命令正则匹配 */
                    reg: '^#?鉴赏$',
                    /** 执行方法 */
                    fnc: 'appreciate'
                },
                {
                    /** 命令正则匹配 */
                    reg: '^#?解析$',
                    /** 执行方法 */
                    fnc: 'interpretation',
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

    async interpretation(e) {
        e = await parseImg(e)
        if (!e.img) {
            e.reply("未获取到图片");
            return false;
        }
        let img = await axios.get(e.img[0], {
            responseType: 'arraybuffer'
        });
        let base64 = Buffer.from(img.data, 'binary')
            .toString('base64');
        const config = await Config.getcfg();
        const { APIList, usingAPI } = config;
        if (APIList.length === 0) {
            e.reply("请先配置绘图API");
        }
        const { url, account_id, account_password } = APIList[usingAPI];
        const headers = {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(account_id && account_password && {
                Authorization: `Basic ${Buffer.from(
                    `${account_id}:${account_password}`
                ).toString("base64")}`,
            }),
        };
        const res = await axios.post(`${url}/sdapi/v1/png-info`, {
            image: "data:image/png;base64," + base64,
        }, {
            headers
        });
        if (res.status === 200) {
            if (res.data.info === "") {
                e.reply("该图片无解析信息，请确保图片为Stable Diffusion的输出图片，并发送的是原图");
                return false;
            } else {
                let data_msg = [];
                data_msg.push({
                    message: segment.image(e.img[0]),
                    nickname: Bot.nickname,
                    user_id: Bot.uin,
                });
                data_msg.push({
                    message: res.data.info,
                    nickname: Bot.nickname,
                    user_id: Bot.uin,
                });
                let send_res = null;
                if (e.isGroup)
                    send_res = await e.reply(await e.group.makeForwardMsg(data_msg));
                else send_res = await e.reply(await e.friend.makeForwardMsg(data_msg));
                if (!send_res) {
                    e.reply("消息发送失败，可能被风控~");
                }
                return true;
            }
        } else {
            Log.e(`无法获取该图片的解析信息，后端异常：${res.status}`);
            return false;
        }
    }

    async appreciate(e) {
        let setting = await Config.getSetting()
        if (!setting.appreciation.useSD) {
            if (!API)
                return await e.reply("请先配置鉴赏图片所需API，配置教程：https://ap-plugin.com/Config/docs4")
            await AppreciatePictures(e)
        } else {
            await AppreciatePictures(e)
        }
    }
    async getImage(e) {
        if (!this.e.img) {
            return false;
        }
        if (get_image_time[e.user_id]) {
            clearTimeout(get_image_time[e.user_id]);
            delete get_image_time[e.user_id];
        } else {
            return false;
        }
        await AppreciatePictures(e);
    }
}


async function AppreciatePictures(e) {
    let start = new Date().getTime();

    if (figure_type_user[e.user_id]) {
        e.reply('当前你有任务在列表中排排坐啦，请不要重复发送喵~（๑>؂<๑）')
        return true
    }

    e = await parseImg(e)

    if (e.img) {
        figure_type_user[e.user_id] = setTimeout(() => {
            if (figure_type_user[e.user_id]) {
                delete figure_type_user[e.user_id];
            }
        }, 60000);

        let base64 = await pic_tools.url_to_base64(e.img[0])
        let setting = await Config.getSetting()
        let model = setting.appreciation.model
        if (setting.appreciation.useSD) {
            await e.reply([segment.at(e.user_id), `少女使用标签器${model}鉴赏中~（*/∇＼*）`, true])
            var msg = await requestAppreciateSD(base64)
        } else {
            await e.reply([segment.at(e.user_id), '少女使用DeepDanbooru鉴赏中~（*/∇＼*）', true])
            var msg = await requestAppreciate(base64)
        }
        if (!msg) {
            e.reply("鉴赏出错，请查看控制台报错")
            return true
        }

        let end = new Date().getTime();
        let time = ((end - start) / 1000).toFixed(2);

        await e.reply([segment.at(e.user_id), `鉴赏用时：${time}秒`, true])
        e.reply(msg, true)
        if (figure_type_user[e.user_id]) {
            delete figure_type_user[e.user_id];
        }

    } else {
        e.reply('请在60s内发送图片喵~（๑>؂<๑）')
        get_image_time[e.user_id] = setTimeout(() => {
            if (get_image_time[e.user_id]) {
                e.reply('鉴赏已超时，请再次发送命令喵~', true);
                delete get_image_time[e.user_id];
            }
        }, 60000);
        return false;
    }
}

/**使用图片base64来逆向解析tags，返回整理后的tags
 * @param {*} base64 图片base64
 * @return {*}  解析的tags
 */
export async function requestAppreciate(base64) {
    if (!API) return false
    Log.i('解析图片tags')
    try {
        let res = await fetch(API, {
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
        res = await res.json()
        let tags = res.data[2].confidences;
        let tags_str = '';
        for (let i = 0; i < tags.length; i++) {
            if (tags[i].confidence > 0.98) {
                tags_str += `(${tags[i].label}: 1.2), `;
            } else if (tags[i].confidence > 0.95 && tags[i].confidence < 0.98) {
                tags_str += `(${tags[i].label}: 1.1), `;
            } else if (tags[i].confidence > 0.9 && tags[i].confidence < 0.95) {
                tags_str += `(${tags[i].label}), `;
            } else {
                tags_str += `${tags[i].label}, `;
            }
        }
        Log.i('解析成功')
        return tags_str
    } catch (err) {
        Log.e(err)
        Log.e('解析失败')
        return false
    }
}

/**使用图片base64来逆向解析tags，返回整理后的tags
 * @param {*} base64 图片base64
 * @return {*}  解析的tags
 */
export async function requestAppreciateSD(base64) {
    let setting = await Config.getSetting()
    let config = await Config.getcfg()
    let apiobj = config.APIList[config.usingAPI - 1]
    let url = apiobj.url + '/tagger/v1/interrogate';
    const headers = {
        "Content-Type": "application/json"
    };
    if (apiobj.account_password) {
        headers.Authorization = `Basic ${Buffer.from(apiobj.account_id + ':' + apiobj.account_password, 'utf8').toString('base64')} `
    }
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                "image": "data:image/png;base64," + base64,
                "model": setting.appreciation.model,
                "threshold": 0.3,
            })
        });
        const json = await response.json();
        let tags_str = '';
        for (let i in json.caption) {
            if (json.caption[i] > 0.98) {
                tags_str += `(${i}: 1.2), `;
            } else if (json.caption[i] > 0.95 && json.caption[i] < 0.98) {
                tags_str += `(${i}: 1.1), `;
            } else if (json.caption[i] > 0.9 && json.caption[i] < 0.95) {
                tags_str += `(${i}), `;
            } else {
                tags_str += `${i}, `;
            }
        }
        Log.i('解析成功')
        return tags_str
    } catch (err) {
        Log.e(err)
        Log.e('解析失败')
        return false
    }
}