/*
 * @Author: 渔火Arcadia  https://github.com/yhArcadia
 * @Date: 2023-01-07 15:15:11
 * @LastEditors: 渔火Arcadia
 * @LastEditTime: 2023-01-10 23:56:33
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\apps\withdraw.js
 * @Description: 撤回机器人消息
 * 
 * Copyright (c) 2023 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved. 
 */
import plugin from "../../../lib/plugins/plugin.js";
import cfg from "../../../lib/config/config.js";
import { segment } from "oicq";

export class Withdraw extends plugin {
    constructor() {
        super({
            name: "withdraw",
            dsc: "撤回机器人消息",
            event: "message.group",
            priority: 5000,
            rule: [
                {
                    reg: "^#?撤回$",
                    fnc: "WithDraw",
                },
            ],
        });
    }

    async WithDraw(e) {
        // 没引用则放行指令
        if (!e.source) return false;
        // 如果是撤回机器人的消息,则不做权限判断
        if (e.source.user_id == cfg.qq) {
            await this.withdrawFn(e);
            return true;
        }
        let { botIs, senderIs, victim, victimIs } = await this.getPermissions(e);
        // 权限不够
        if (botIs <= victimIs) {
            // e.reply生草图片
            return true;
        }
        // 主人可命令撤回任何权限内消息
        if (cfg.masterQQ.includes(e.user_id)) {
            await this.withdrawFn(e);
            return true;
        }
        // 机器人无法撤回发起者的消息时;平民没有权限;要撤回主人的消息时
        if (
            botIs <= senderIs ||
            senderIs == 1 ||
            cfg.masterQQ.includes(e.source.user_id)
        ) {
            e.reply(segment.image('https://gchat.qpic.cn/gchatpic_new/1761869682/2077086404-3170617512-116FDFF74709D345FAF0EACD13357D61/0?term=3&is_origin=0'))
            return true;
        }
        await this.withdrawFn(e);
        return true;
    }

    /**判断权限等级*/
    async getPermissions(e) {
        let botIs = e.group.is_owner ? 3 : e.group.is_admin ? 2 : 1;
        let sender = await e.group.pickMember(e.sender.user_id);
        let senderIs =
            // e.isMaster      ? 4      :
            sender.is_owner ? 3 : sender.is_admin ? 2 : 1;
        // let target = await e.group.pickMember(e.source.user_id?e.source.user_id:e.at);
        let victim = await e.group.pickMember(e.at);
        let victimIs = victim.is_owner ? 3 : victim.is_admin ? 2 : 1;
        return {
            botIs: botIs,
            sender: sender,
            senderIs: senderIs,
            victim: victim,
            victimIs: victimIs,
        };
    }
    async withdrawFn(e) {
        e.group.recallMsg(e.source.seq, e.source.rand);
        e.group.recallMsg(e.message_id);
    }
}

