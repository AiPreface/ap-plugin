/*
 * @Author: 渔火Arcadia  https://github.com/yhArcadia
 * @Date: 2022-12-24 18:06:52
 * @LastEditors: 渔火Arcadia
 * @LastEditTime: 2023-01-09 19:20:58
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\apps\help.js
 * @Description: ap帮助
 * 
 * Copyright (c) 2022 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved. 
 */
import Help from "../components/help/Help.js";
import Admi_Help from "../components/help/Admi_Help.js";
import render from "../components/help/render.js";
export class help extends plugin {
    constructor() {
        super({
            name: "AiPainting帮助",
            dsc: "AiPainting帮助",
            event: "message",
            priority: 5000,
            rule: [
                {
                    reg: "^#?ap(帮助|说明书)$",
                    fnc: "help",
                },
                {
                    reg: "^#?ap管理(帮助|说明书)$",
                    fnc: "admi_help",
                },
            ],
        });
    }
    async help(e) {
        await render('help/version-info', {
            currentVersion: Help.ver,
            changelogs: Help.logs,
            elem: 'cryo'
        }, { e, scale: 2 })
        // e.reply('参考文档：https://www.wolai.com/tiamcvmiaLJLePhTr4LAJE')
        return true
    }
    async admi_help(e) {
        await render('help/version-info', {
            currentVersion: Admi_Help.ver,
            changelogs: Admi_Help.logs,
            elem: 'cryo'
        }, { e, scale: 2 })
        // e.reply('参考文档：https://www.wolai.com/tiamcvmiaLJLePhTr4LAJE')
        return true
    }
}