/*
 * @Author: 渔火Arcadia  https://github.com/yhArcadia
 * @Date: 2022-12-25 16:57:47
 * @LastEditors: 渔火Arcadia
 * @LastEditTime: 2022-12-25 22:56:39
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\apps\setpolicy.js
 * @Description: 设置ap策略
 * 
 * Copyright (c) 2022 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved. 
 */

import e from 'express';
import plugin from '../../../lib/plugins/plugin.js';
import Config from '../components/ap/config.js'
import Log from '../utils/Log.js';
import { getuserName } from '../utils/utils.js';

export class setpolicy extends plugin {
    constructor() {
        super({
            name: "AiPainting策略",
            dsc: "更改AiPainting策略",
            event: "message",
            priority: 5000,
            rule: [
                {
                    reg: "^#ap设置全局(cd|CD)(\\d{1,5})$",
                    fnc: "setcd",
                    permission: "master",
                },
                {
                    reg: "^#ap设置本地(\\d{1,5})$",
                    fnc: "setlocalNum",
                    permission: "master",
                },
                {
                    reg: "^#ap设置存本地(开启|关闭)$",
                    fnc: "setisDownload",
                    permission: "master",
                },
                {
                    reg: "^#ap设置通知主人(开启|关闭)$",
                    fnc: "setisTellMaster",
                    permission: "master",
                },
                {
                    reg: "^#ap(设置|解除)管理权限(\\d{5,11})?$",
                    fnc: "setapMaster",
                    permission: "master",
                },
                {
                    reg: "^#ap(封禁|解封)(\\d{5,11})?$",
                    fnc: "setpbuser",
                    // permission: "master",
                },
                {
                    reg: "^#ap(全局)?设置(\\d{5,11}|私聊)?(((审核|撤回|封禁)?(开启|关闭))|((((群聊|个人)(cd|CD))|撤回时间|次数)(\\d{1,5}|无限)))$",
                    fnc: "setgp",
                    // permission: "master",
                },

            ],
        });
    }
    async setcd(e) {
        let regExp = /^#ap设置全局cd(\d{1,5})$/i
        let ret = regExp.exec(e.msg)
        if (!ret) return false
        let num = Number((ret[1].trim()))
        let policy = await Config.getPolicy()
        policy.cd = num
        try {
            await Config.setPolicy(policy)
        } catch (err) {
            Log.e(err)
            Log.e(err.message)
            return this.e.reply("设置失败。请查看控制台报错", true)
        }
        e.reply("设置成功")
        return true
    }
    async setlocalNum(e) {
        let regExp = /^#ap设置本地(\d{1,5})$/
        let ret = regExp.exec(e.msg)
        if (!ret) return false
        let num = Number((ret[1].trim()))
        let policy = await Config.getPolicy()
        policy.localNum = num
        try {
            await Config.setPolicy(policy)
        } catch (err) {
            Log.e(err)
            Log.e(err.message)
            return this.e.reply("设置失败。请查看控制台报错", true)
        }
        e.reply("设置成功")
        return true
    }
    async setisDownload(e) {
        let isOpen = true
        if (e.msg.includes('关闭'))
            isOpen = false

        let policy = await Config.getPolicy()
        policy.isDownload = isOpen
        try {
            await Config.setPolicy(policy)
        } catch (err) {
            Log.e(err)
            Log.e(err.message)
            return this.e.reply("设置失败。请查看控制台报错", true)
        }
        e.reply("设置成功")
        return true
    }
    async setisTellMaster(e) {
        let isOpen = true
        if (e.msg.includes('关闭'))
            isOpen = false

        let policy = await Config.getPolicy()
        policy.isTellMaster = isOpen
        try {
            await Config.setPolicy(policy)
        } catch (err) {
            Log.e(err)
            Log.e(err.message)
            return this.e.reply("设置失败。请查看控制台报错", true)
        }
        e.reply("设置成功")
        return true
    }
    async setapMaster(e) {
        let qq = NaN
        let isgive = true
        if (e.msg.includes("解除")) { isgive = false }

        let regExp = /^#ap(设置|解除)管理权限(\d{5,11})$/
        let ret = regExp.exec(e.msg)
        if (ret) { qq = Number(ret[2]) }
        qq = qq || Number(e.at)
        if (!qq) {
            e.reply('请艾特该用户，或者在命令后带上QQ号')
            return true
        }

        let policy = await Config.getPolicy()
        if (policy.apMaster.includes(qq) && isgive) {
            e.reply('该用户已经是ap管理员')
            return true
        }
        if (!(policy.apMaster.includes(qq) || isgive)) {
            e.reply('该用户不是ap管理员')
            return true
        }
        if (isgive) {
            policy.apMaster.push(qq)
        } else {
            let index = policy.apMaster.indexOf(qq)
            policy.apMaster.splice(index, 1)
        }

        try {
            await Config.setPolicy(policy)
        } catch (err) {
            Log.e(err)
            Log.e(err.message)
            return this.e.reply("设置失败。请查看控制台报错", true)
        }
        e.reply(`${isgive ? "授权" : "解除"}成功`, true)
        return true
    }
    async setpbuser(e) {
        let policy = await Config.getPolicy()
        if (!(e.isMaster || policy.apMaster.includes(e.user_id))) {
            e.reply('暂无权限，只有主人或ap管理员才能操作')
            return true
        }
        let qq = NaN
        let isban = true
        if (e.msg.includes("解封")) { isban = false }

        let regExp = /^#ap(封禁|解封)(\d{5,11})$/
        let ret = regExp.exec(e.msg)
        if (ret) { qq = Number(ret[2]) }
        qq = qq || Number(e.at)
        if (!qq) {
            e.reply('请艾特该用户，或者在命令后带上QQ号')
            return true
        }

        if (policy.prohibitedUserList.includes(qq) && isban) {
            e.reply('该用户已在封禁列表中')
            return true
        }
        if (!(policy.prohibitedUserList.includes(qq) || isban)) {
            e.reply('该用户未被封禁')
            return true
        }
        if (isban) {
            policy.prohibitedUserList.push(qq)
        } else {
            let index = policy.prohibitedUserList.indexOf(qq)
            policy.prohibitedUserList.splice(index, 1)
        }

        try {
            await Config.setPolicy(policy)
        } catch (err) {
            Log.e(err)
            Log.e(err.message)
            return this.e.reply("设置失败。请查看控制台报错", true)
        }
        e.reply(`${isban ? "封禁" : "解封"}成功`, true)
        return true
    }
    async setgp(e) {
        let gid = null
        if (e.isPrivate) { gid = 'private' }

        let regenable = /#ap(全局)?设置(\d{5,11}|私聊)?(开启|关闭)$/
        let regJH = /#ap(全局)?设置(\d{5,11}|私聊)?审核(开启|关闭)$/
        let regisRecall = /#ap(全局)?设置(\d{5,11}|私聊)?撤回(开启|关闭)$/
        let regisBan = /#ap(全局)?设置(\d{5,11}|私聊)?封禁(开启|关闭)$/
        let reggcd = /#ap(全局)?设置(\d{5,11}|私聊)?群聊cd(\d{1,5})$/i
        let regpcd = /#ap(全局)?设置(\d{5,11}|私聊)?个人cd(\d{1,5})$/i
        let regrecallDelay = /#ap(全局)?设置(\d{5,11}|私聊)?撤回时间(\d{1,5})$/
        let regusageLimit = /#ap(全局)?设置(\d{5,11}|私聊)?次数(\d{1,5}|无限)$/

        let [enable, JH, gcd, pcd, isRecall, recallDelay, isBan, usageLimit] = [
            regenable.exec(e.msg),
            regJH.exec(e.msg),
            reggcd.exec(e.msg),
            regpcd.exec(e.msg),
            regisRecall.exec(e.msg),
            regrecallDelay.exec(e.msg),
            regisBan.exec(e.msg),
            regusageLimit.exec(e.msg),
        ]

        if (enable) {
            gid = enable[2] || gid || e.group_id
            if (enable[1] == '全局') gid = 'global'
            let isopen = true
            if (enable[3] == '关闭') isopen = false
            this.gp_Property(gid, 'enable', isopen)
        }
        else if (JH) {
            gid = JH[2] || gid || e.group_id
            if (JH[1] == '全局') gid = 'global'
            let isopen = true
            if (JH[3] == '关闭') isopen = false
            this.gp_Property(gid, 'JH', isopen)
        }
        else if (isRecall) {
            gid = isRecall[2] || gid || e.group_id
            if (isRecall[1] == '全局') gid = 'global'
            let isopen = true
            if (isRecall[3] == '关闭') isopen = false
            this.gp_Property(gid, 'isRecall', isopen)
        }
        else if (isBan) {
            gid = isBan[2] || gid || e.group_id
            if (isBan[1] == '全局') gid = 'global'
            let isopen = true
            if (isBan[3] == '关闭') isopen = false
            this.gp_Property(gid, 'isBan', isopen)
        }

        else if (gcd) {
            gid = gcd[2] || gid || e.group_id
            if (gcd[1] == '全局') gid = 'global'
            let num = Number(gcd[3]) || 1
            this.gp_Property(gid, 'gcd', num)
        }
        else if (pcd) {
            gid = pcd[2] || gid || e.group_id
            if (pcd[1] == '全局') gid = 'global'
            let num = Number(pcd[3]) || 1
            this.gp_Property(gid, 'pcd', num)
        }
        else if (recallDelay) {
            gid = recallDelay[2] || gid || e.group_id
            if (recallDelay[1] == '全局') gid = 'global'
            let num = Number(recallDelay[3]) || 1
            if (num > 120) {
                e.reply('不能超过120')
                return true
            }
            this.gp_Property(gid, 'recallDelay', num)
        }
        else if (usageLimit) {
            gid = usageLimit[2] || gid || e.group_id
            if (usageLimit[1] == '全局') gid = 'global'
            let num = Number(usageLimit[3])
            if (usageLimit[3] == '无限') num = 0
            this.gp_Property(gid, 'usageLimit', num)
        }
        else { return false }

        return true
    }

    async gp_Property(gid, key, value) {
        console.log(gid, key, value)
        let policy = await Config.getPolicy()
        if (key != 'enable' && !this.e.isMaster) {
            this.e.reply('暂无权限，只有主人才能操作')
            return true
        }
        if (!(this.e.isMaster || policy.apMaster.includes(e.user_id))) {
            this.e.reply('暂无权限，只有主人或ap管理员才能操作')
            return true
        }

        if (!(gid in policy.gp))
            policy.gp[gid] = {}
        for (let keys in policy.gp) {
            if (gid != 'global') {
                policy.gp[gid][key] = value
                break
            } else {
                policy.gp[keys][key] = value
            }

        }

        policy.gp = this.integrateProperty(policy.gp)
        try {
            await Config.setPolicy(policy)
        } catch (err) {
            Log.e(err)
            Log.e(err.message)
            return this.e.reply("设置失败。请查看控制台报错", true)
        }

        let gname = '未知群聊'
        try {
            let ginfo = await Bot.getGroupInfo(Number(gid))
            gname = ginfo ? ginfo.group_name : '未知群聊'
        } catch (err) { }

        let msg = [
            gid == 'global' ? "全部群" : gid == 'private' ? "私聊的" : gid == this.e.group_id ? "本群的" : `群[${gname}](${gid})的`,
            key == 'enable' ? "ap"
                : key == 'JH' ? "图片审核"
                    : key == 'isRecall' ? "自动撤回"
                        : key == 'recallDelay' ? "撤回延迟"
                            : key == 'pcd' ? "个人cd"
                                : key == 'gcd' ? "共享cd"
                                    : key == 'isBan' ? "封禁"
                                        : key == 'usageLimit' ? "每日用量限制"
                                            : '???',
            `已设为`,
            (key == 'enable' || key == 'JH' || key == 'isRecall' || key == 'isBan') ? (value ? '开启' : '关闭')
                : (key == 'gcd' || key == 'pcd' || key == 'recallDelay') ? `${value}秒`
                    : key == 'usageLimit' ? (value ? `${value}张` : '无限制')
                        : '???'
        ]
        this.e.reply(msg, true)
        return true
    }

    integrateProperty(gp) {
        for (let each in gp) {
            if (each == 'global')
                continue
            for (let key in gp[each]) {
                if (gp[each][key] == gp.global[key])
                    delete gp[each][key]
            }
            if (JSON.stringify(gp[each]) === '{}')
                delete gp[each]
        }
        return gp
    }


}