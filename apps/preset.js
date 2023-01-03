/*
 * @Author: 渔火Arcadia  https://github.com/yhArcadia
 * @Date: 2023-01-01 18:31:22
 * @LastEditors: 渔火Arcadia
 * @LastEditTime: 2023-01-03 21:03:46
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\apps\preset.js
 * @Description: 管理预设
 * 
 * Copyright (c) 2023 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved. 
 */

import plugin from '../../../lib/plugins/plugin.js';
import Config from '../components/ai_painting/config.js'
import Log from '../utils/Log.js';
import { isEqual } from '../utils/utils.js';
import cfg from '../../../lib/config/config.js'
import { segment } from 'oicq';
import Parse from '../components/ai_painting/parse.js'


export class setpolicy extends plugin {
    constructor() {
        super({
            name: "AiPainting策略",
            dsc: "更改AiPainting策略",
            event: "message",
            priority: 5000,
            rule: [
                {
                    reg: "^#ap添加预设([\\s\\S]+)$",
                    fnc: "addPreset",
                    permission: "master",
                },
                {
                    reg: "^#ap删除预设.*$",
                    fnc: "delPreset",
                    permission: "master",
                },
                {
                    reg: "^#ap预设列表.*$",
                    fnc: "presetList",
                    // permission: "master",
                },
            ],
        });
    }
    /**添加预设     */
    async addPreset(e) {

        let raw_preset = await this.parsePreset(e.msg)
        Log.i(raw_preset)
        if (!raw_preset) {
            e.reply('格式：\n#ap添加预设预设名=>预设内容\n例如：#ap添加预设栗子=>🌰\n\n进阶用法：预设内容可包含scale、正面tag、负面tag，格式与#绘图的格式相同，将自动解析参数。')
            return true
        }
        let presets = await Config.getPresets()
        for (let i = 0; i < presets.length; i++) {
            // 如果预设的值相同
            if (
                presets[i].pt == raw_preset.pt &&
                presets[i].tags == raw_preset.tags &&
                presets[i].ntags == raw_preset.ntags &&
                isEqual(presets[i].param, raw_preset.param)
            ) {
                if (presets[i].keywords.includes(raw_preset.keywords[0])) // 预设名也相同
                    return e.reply('已存在该预设', true)
                else {
                    presets[i].keywords.push(raw_preset.keywords[0]) // 预设名不同
                    await Config.setpreSets(presets)
                    e.reply(['添加成功：\n' + this.stringifyPreset(presets[i])])
                    return true
                }
            }
            // 仅预设名相同时
            else if (presets[i].keywords.includes(raw_preset.keywords[0])) {
                e.reply(`已包含名为【${raw_preset.keywords[0]}】的预设：\n${this.stringifyPreset(presets[i])}\n\n请更换预设名，或先删除同名预设再添加`)
                return true
            }
        }
        // 未匹配到重复值，则直接新添加一条预设
        presets.push(raw_preset)
        await Config.setpreSets(presets)
        e.reply(['添加成功：\n' + this.stringifyPreset(raw_preset)])
        return true
    }
    /* 处理消息，解析为ap标准预设格式 */
    async parsePreset(msg) {

        let regExp = /^#ap添加预设([\s\S]+)=>([\s\S]+)$/
        let reg_result = regExp.exec(msg)
        if (!reg_result)
            return false

        let kword = reg_result[1] // 提取预设的key
        kword = kword.trim()

        // 解析预设的value
        let res = await Parse.parsetxt(reg_result[2], false)
        // Log.i(res)
        if (res.param.tags + res.param.ntags == '') {
            return false
        }

        let raw_preset = {
            "keywords": [
                kword
            ],
            "pt": "",
            "param": {},
            "tags": res.param.tags,
            "ntags": res.param.ntags == '默认' ? '' : res.param.ntags
        }
        if (res.param.scale)
            raw_preset.param['scale'] = res.param.scale
        return raw_preset
    }
    /**删除预设     */
    async delPreset(e) {
        let kword = e.msg.replace(/^#ap删除预设/, '')
        kword = kword.trim()
        if (!kword) {
            e.reply('请在命令后附带要删除的预设名')
            return true
        }
        let presets = await Config.getPresets()
        for (let i = 0; i < presets.length; i++) {
            let index = presets[i].keywords.indexOf(kword)
            if (index > -1) {
                presets[i].keywords.splice(index, 1)
                if (presets[i].keywords.length == 0) {
                    presets.splice(i, 1)
                }
                await Config.setpreSets(presets)
                e.reply([`成功删除名为【${kword}】的预设`])
                return true
            }
        }
        e.reply(`未检索到名为【${kword}】的预设`)
        return true
    }

    /**查看预设     */
    async presetList(e) {
        let presets = []
        presets = await Config.getPresets() // -> array

        let page = 1 // 指定第几页的预设
        let keyword = '' // 指定检索的关键词 
        let regExp = /^#ap预设列表(.*?)(第(\d+)页)?$/

        let ret = regExp.exec(e.msg)
        // 取用户指定的页数和关键词
        page = ret[3] || 1
        keyword = ret[1] || ''
        Log.i(page, keyword)

        // 筛选出包含关键词的预设
        if (keyword) {
            presets = presets.filter(x => { return x.keywords.join('').includes(keyword) })
        }

        if (presets.length == 0)
            return e.reply(`当前还没有${keyword ? `包含关键词【${keyword}】的` : ""}预设哦`)

        // 计算预设页数（50条每页）
        let page_count = Math.ceil(presets.length / 50);
        if (page > page_count)
            return e.reply(`${keyword ? `包含关键词【${keyword}】的` : ""}预设共${page_count}页哦`);

        // 取出指定的一页预设
        let selected_page = [];
        selected_page = presets.slice((page - 1) * 50, page * 50);

        // 构建合并消息数组
        let data_msg = [];
        // 首条说明信息
        let first_message = [`${keyword ? `包含关键词【${keyword}】的` : ""}ap预设列表，共${presets.length}条`]
        if (page_count > 1)
            first_message = [`${keyword ? `包含关键词【${keyword}】的` : ""}ap预设列表，第${page}页，共${presets.length}条、${page_count}页，您可发送“#ap预设列表${keyword}第1页，#ap预设列表${keyword}第2页……”来查看对应页`]
        data_msg.push({
            message: first_message,
            nickname: Bot.nickname,
            user_id: cfg.qq,
        });
        // 处理每一条预设
        for (let val of selected_page) {
            data_msg.push({
                message: this.stringifyPreset(val),
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
    /** 将一条预设转为适宜阅读的文本形式 */
    stringifyPreset(preset) {
        let param = []
        if (preset.param) {
            for (let key in preset.param)
                param.push(`${key}=${preset.param[key]}`)
        }
        let message = [
            `●${preset.keywords.join('、')}\n`,
            preset.pt ? `●对应pt：${preset.pt}\n` : '',
            param.length ? `${param.join('\n')}\n\n` : '',
            `◎  ${preset.tags}`,
            preset.ntags ? `\n\n◉  ${preset.ntags}` : ''
        ]
        return message.join('')
    }

    /* 批量导入预设 */
    async importPreset(e) {

    }
}