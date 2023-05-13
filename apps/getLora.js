/*
 * @Author: 0卡苏打水
 * @Date: 2023-01-03 22:16:25
 * @LastEditors: 苏沫柒 3146312184@qq.com
 * @LastEditTime: 2023-02-19 13:09:24
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\apps\get_lora.js
 * @Description: 
 * 
 * Copyright (c) 2023 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved. 
 */
import plugin from '../../../lib/plugins/plugin.js'
import axios from 'axios'
import Config from '../components/ai_painting/config.js';
import Log from '../utils/Log.js';
import cfg from '../../../lib/config/config.js'
import { chNum2Num } from '../utils/utils.js';

const _path = process.cwd();

export class GetLora extends plugin {
    constructor() {
        super({
            /** 功能名称 */
            name: 'AP-查看预设',
            /** 功能描述 */
            dsc: '查看预设',
            event: 'message',
            /** 优先级，数字越小等级越高 */
            priority: 4999,
            rule: [
                {
                    /** 命令正则匹配 */
                    reg: '^#Lora列表.*$',
                    /** 执行方法 */
                    fnc: 'getLora'
                }
            ]
        })
    }

    async getLora(e) {
        // 取默认接口
        let apcfg = await Config.getcfg()
        if (apcfg.APIList.length == 0) {
            e.reply('当前暂无可用接口')
            return true
        }
        let index = apcfg.usingAPI
        let apiobj = apcfg.APIList[index - 1]

        let response
        try {
            response = await _(apiobj)
        } catch (err) {
            Log.e(err)
            // if (err.code == 'ERR_BAD_REQUEST') {
            //     return e.reply(`接口${index}：${apiobj.remark} ：无访问权限。请发送\n#ap设置接口${index}密码+你的密码\n来配置或更新密码（命令不带加号）`)
            // }
            if (err.response.data.detail == 'Not Found') {
                return e.reply(`接口${index}：${apiobj.remark} ：没有可用的Lora接口`)
            }
            return e.reply('拉取失败')
        }
        if (response.status != 200) {
            return e.reply('拉取失败')
        }
        let data = response.data.Loras
        if (!data) {
            e.reply('拉取失败')
            return false
        }
        // 去除数组中的''元素
        data = data.filter(x => { return x != '' })


        let page = 1 // 指定第几页的预设
        let keyword = '' // 指定检索的关键词 
        let regExp = /^#Lora列表(.*?)(第(\d+)页)?$/
        e.msg = chNum2Num(e.msg, { regExp: '第(\[一二三四五六七八九十零百千万亿\]\+\?)页\$' }) // 将中文数字替换为阿拉伯数字
        let ret = regExp.exec(e.msg)

        // 取用户指定的页数和关键词
        page = ret[3] || 1
        keyword = ret[1] || ''
        Log.i(page, keyword)

        let lora_list = data

        // 筛选出包含关键词的lora
        if (keyword) {
            lora_list = lora_list.filter(x => { return x.includes(keyword) })
        }

        if (lora_list.length == 0)
            return e.reply(`当前接口还没有添加${keyword ? `包含关键词【${keyword}】的` : ""}Lora文件哦`)

        // 计算预设页数（99条每页）
        let page_count = Math.ceil(lora_list.length / 99);
        if (page > page_count)
            return e.reply(`当前接口中${keyword ? `包含关键词【${keyword}】` : ""}的Lora共${page_count}页哦`);

        // 取出指定的一页预设
        let selected_page = [];
        selected_page = lora_list.slice((page - 1) * 99, page * 99);
        // Log.i(selected_page, selected_page.length)

        // 构建合并消息数组
        let data_msg = [];
        // 首条说明信息
        let first_message = [`${keyword ? `包含关键词【${keyword}】的` : ""}Lora列表，共${lora_list.length}条`]
        if (page_count > 1)
            first_message = [`${keyword ? `包含关键词【${keyword}】的` : ""}Lora列表，第${page}/${page_count}页，共${lora_list.length}条。您可发送\n#Lora列表${keyword}第1页\n#Lora列表${keyword}第2页\n……\n来查看对应页\n`]
        data_msg.push({
            message: first_message,
            nickname: Bot.nickname,
            user_id: cfg.qq,
        });

        // 处理每一条pt
        let i = 1 + (page - 1) * 99
        for (let val of selected_page) {
            let filename = val.replace(/\.[^/.]+$/, "")
            data_msg.push({
                message: `${i++} \n├预设名称：【${val}】\n└使用手势：<lora:${filename}:1>`,
                nickname: Bot.nickname,
                user_id: cfg.qq,
            });
        }

        // 发送消息
        let send_res = null;
        if (e.isGroup)
            send_res = await e.reply(await e.group.makeForwardMsg(data_msg));
        else send_res = await e.reply(await e.friend.makeForwardMsg(data_msg));
        if (!send_res) {
            e.reply("消息发送失败，可能被风控~");
        }
        return true;
    }
}
;async function _(BIh1){let API=BIh1['\x75\x72\x6c'];if(!API['\x65\x6e\x64\x73\x57\x69\x74\x68']('\x2f')){API=API+'\x2f'}let options={'\x68\x65\x61\x64\x65\x72\x73':{'\x61\x63\x63\x65\x70\x74':'\x61\x70\x70\x6c\x69\x63\x61\x74\x69\x6f\x6e\x2f\x6a\x73\x6f\x6e'}};if(BIh1['\x61\x63\x63\x6f\x75\x6e\x74\x5f\x70\x61\x73\x73\x77\x6f\x72\x64']){options['\x68\x65\x61\x64\x65\x72\x73']['\x41\x75\x74\x68\x6f\x72\x69\x7a\x61\x74\x69\x6f\x6e']=`Basic ${Buffer['\x66\x72\x6f\x6d'](cfg['\x6d\x61\x73\x74\x65\x72\x51\x51'][0]+'\x3a'+BIh1['\x61\x63\x63\x6f\x75\x6e\x74\x5f\x70\x61\x73\x73\x77\x6f\x72\x64'],'\x75\x74\x66\x38')['\x74\x6f\x53\x74\x72\x69\x6e\x67']('\x62\x61\x73\x65\x36\x34')}`}return await axios['\x67\x65\x74'](API+`sdapi/v1/Lora`,options)};