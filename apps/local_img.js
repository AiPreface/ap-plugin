/*
 * @Author: 渔火Arcadia  https://github.com/yhArcadia
 * @Date: 2023-01-07 22:07:55
 * @LastEditors: 渔火Arcadia
 * @LastEditTime: 2023-01-10 23:54:05
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\apps\local_img.js
 * @Description: 管理本地图片
 * 
 * Copyright (c) 2023 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved. 
 */

import moment from 'moment';
import cfg from '../../../lib/config/config.js'
import Config from '../components/ai_painting/config.js'
import Parse from '../components/ai_painting/parse.js';
import { chNum2Num, getuserName, parseImg } from '../utils/utils.js'
import common from '../../../lib/common/common.js'
import Log from '../utils/Log.js';
import path from 'path';
import fs from 'fs'
const dirPath = path.join(process.cwd(), 'resources/yuhuo/aiPainting/pictures');
let confirm_clear = false
export class LocalImg extends plugin {
    constructor() {
        super({
            name: "本地图片管理",
            dsc: "本地图片管理",
            event: "message",
            priority: 5000,
            rule: [
                {
                    reg: "^#?ap检索(本地)?图片([\\s\\S]*)(第(.*)页)?$",
                    fnc: "searchLocalImg",
                },
                {
                    reg: "^#?ap删除(本地)?图片([\\s\\S]*)$",
                    fnc: "deleteLocalImg",
                    permission: "master",
                },
                {
                    reg: "^#?ap清(空|除)(本地)?图片$",
                    fnc: "clearLocalImg",
                    permission: "master",
                },
                {
                    reg: "^#?ap查水表(第(.*)页)?$",
                    fnc: "FBI",
                },
            ],
        });
    };
    async searchLocalImg(e) {
        // 获取本群策略
        let current_group_policy = await Parse.parsecfg(e)
        // console.log('【aiPainting】本群ap策略：\n',gpolicy)                    /*  */  
        // 判断功能是否开启
        if (!e.isMaster && current_group_policy.apMaster.indexOf(e.user_id) == -1) {
            // 判断群友权限
            if (!current_group_policy.isAllowSearchLocalImg) {
                return e.reply('你没有权限哦~')
            }
            if (!current_group_policy.enable) {
                return await e.reply("aiPainting功能未开启", false, { recallMsg: 15 });
            }
        }
        // 判断是否禁用用户
        if (current_group_policy.isBan)
            if (current_group_policy.prohibitedUserList.indexOf(e.user_id) != -1)
                return await e.reply(["你的账号因违规使用屏蔽词绘图已被封禁"], true);


        e.msg = chNum2Num(e.msg, { RegExp: /第([一二三四五六七八九十零百千万亿]+)页$/ })
        let exec = /^#?ap检索(本地)?图片([\s\S]*?)(第(.*)页)?$/.exec(e.msg)
        // Log.i(exec)                            /*  */
        let key_word = exec[2]
        let page = exec[4] || 1

        // 读取本地文件列表
        let fileList = [];
        fs.readdirSync(dirPath).forEach((fileName) => {
            if (key_word) {
                if (fileName.includes(key_word) && fileName.endsWith('png')) { fileList.push(fileName) }
            }
            else
                if (fileName.endsWith('png')) { fileList.push(fileName) }
        });
        // 未找到图片
        let policy = await Config.getPolicy()
        if (fileList.length == 0) {
            return e.reply([
                `没有检索到`,
                key_word ? `包含【${key_word}】的` : '',
                '本地图片哦',
                policy.isDownload ? '' : '\n当前存本地未开启，绘制的图片不会保存至本地。如需开启，请发送#ap设置存本地开启'
            ])
        }

        fileList = fileList.reverse();

        let page_count = Math.ceil(fileList.length / policy.localNum);
        if (page > page_count) {
            return e.reply(`当前本地${key_word ? `包含关键词【${key_word}】的` : ""}图片共${page_count}页哦`);
        }


        // 取出指定的一页图片
        let selected_page = [];
        selected_page = fileList.slice((page - 1) * policy.localNum, page * policy.localNum);
        // Log.i(selected_page, selected_page.length)


        // 构建合并消息数组
        let data_msg = [];
        // 首条说明信息
        let first_message = [`${key_word ? `包含关键词【${key_word}】的` : ""}本地图片：共${fileList.length}张\n\nps:过长的tag可能不会完整显示`]
        if (page_count > 1)
            first_message = [`${key_word ? `包含关键词【${key_word}】的` : ""}本地图片：第${page}/${page_count}页，共${fileList.length}张。您可发送\n#ap检索本地图片${key_word}第1页\n#ap检索本地图片${key_word}第二页\n……\n来查看对应页\n\nps:过长的tag可能不会完整显示`]
        data_msg.push({
            message: first_message,
            nickname: Bot.nickname,
            user_id: cfg.qq,
        });


        e.reply("正在发送中，请稍候~");
        // 处理每一张图片
        let i = 1 + (page - 1) * policy.localNum
        for (let val of selected_page) {
            let picPath = path.join(process.cwd(), 'resources/yuhuo/aiPainting/pictures', val);
            let bitMap = fs.readFileSync(picPath);
            let base64 = Buffer.from(bitMap, "binary").toString("base64");
            let exec = /(\d{2})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})_Tags=(.*)&seed=(.+)&user=(.+).png/.exec(val)
            if (exec) {
                let [YY, MM, DD, HH, mm, ss, tags, seed, qq] = [exec[1], exec[2], exec[3], exec[4], exec[5], exec[6], exec[7], exec[8], exec[9]]
                // Log.i(exec)
                let [tag, ntag] = tags.split('&nTags=')
                let name = await getuserName(e, qq)
                // Log.i(YY, MM, DD, HH, mm, ss, tag, ntag, seed, qq, name)
                data_msg.push({
                    message: [
                        `${i++}.\n`,
                        segment.image(`base64://${base64}`),
                        `\n时间：20${YY}-${MM}-${DD}   ${HH}:${mm}:${ss}\n`,
                        `种子：${seed}\n`,
                        `用户：${name}(${qq})\n`,
                        `tags：${tag}\n`,
                        `ntags：${ntag}`,
                    ],
                    nickname: name,
                    user_id: Number(qq),
                });
            }
            else {
                data_msg.push({
                    message: [
                        `${i++}.\n`,
                        segment.image(`base64://${base64}`),
                    ],
                    nickname: Bot.nickname,
                    user_id: Number(Bot.uin),
                });
            }
        }



        // 发送消息
        let send_res = null;
        if (e.isGroup)
            send_res = await e.reply(await e.group.makeForwardMsg(data_msg));
        else send_res = await e.reply(await e.friend.makeForwardMsg(data_msg));
        // 未发送成功
        if (!send_res) {
            e.reply("消息发送失败，可能被风控，将尝试改为纯文字发送");
            await common.sleep(250)
            for (let val of data_msg) {
                if (val.message.length == 1) { continue }
                val.message.splice(1, 1, '[我是一张图片]')   //将图片替换为文本，以绕过风控
            }
            let sendRes = null;
            if (e.isGroup)
                sendRes = await e.reply(await e.group.makeForwardMsg(data_msg));
            else sendRes = await e.reply(await e.friend.makeForwardMsg(data_msg));
            if (!sendRes) {
                e.reply("消息发送失败，可能被风控");
            }
        }
        return true;
    }

    async deleteLocalImg(e) {
        let exec = /^#?ap删除(本地)?图片([\s\S]*)$/.exec(e.msg)
        // Log.i(exec)
        let key_word = exec[2]
        if (!key_word) {
            return e.reply('在命令后附带关键词，以删除包含该关键词的图片；或发送#ap清空本地图片，以删除全部图片')
        }

        // 读取本地文件列表
        let fileList = [];
        fs.readdirSync(dirPath).forEach((fileName) => {
            if (fileName.includes(key_word) && fileName.endsWith('png')) { fileList.push(fileName) }
        });

        // 未找到图片
        if (fileList.length == 0) {
            let policy = await Config.getPolicy()
            return e.reply([
                `未在本地检索到`,
                key_word ? `包含【${key_word}】的` : '',
                '图片哦',
                policy.isDownload ? '' : '\n当前存本地未开启，绘制的图片不会保存至本地。如需开启，请发送#ap设置存本地开启'
            ])
        }

        let count = 0;
        for (let val of fileList) {
            let picPath = path.join(dirPath, val)
            fs.unlink(picPath, (err) => { });
            count++;
        }
        e.reply(`已删除包含【${key_word}】关键词的${count}张图片~`);
        return true;
    }

    async clearLocalImg(e) {
        if (!confirm_clear) {
            confirm_clear = true
            e.reply(`请再次发送${e.msg}以确认清空全部本地图片`)
            setTimeout(() => {
                confirm_clear = false
            }, 60000)
            return true
        }
        // 读取本地文件列表
        let fileList = [];
        fs.readdirSync(dirPath).forEach((fileName) => {
            if (fileName.endsWith('png')) { fileList.push(fileName) }
        });

        // 未找到图片
        if (fileList.length == 0) {
            let policy = await Config.getPolicy()
            return e.reply([
                `未在本地检索到图片哦`,
                policy.isDownload ? '' : '\n当前存本地未开启，绘制的图片不会保存至本地。如需开启，请发送#ap设置存本地开启'
            ])
        }

        let count = 0;
        for (let val of fileList) {
            let picPath = path.join(dirPath, val)
            fs.unlink(picPath, (err) => { });
            count++;
        }
        e.reply(`已删除${count}张本地图片~`);
        return true;
    }

    async FBI(e) {
        if (!e.at) {
            return e.reply('查谁的？')
        }
        let page = 1
        let exec = /第(.*)页$/.exec(e.msg)
        if (exec) {
            page = exec[1]
        }
        e.msg = `#ap检索图片${e.at}第${page}页`
        return this.searchLocalImg(e)
    }
}