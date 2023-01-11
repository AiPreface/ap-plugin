/*
 * @Author: 渔火Arcadia  https://github.com/yhArcadia
 * @Date: 2022-12-25 16:57:47
 * @LastEditors: 渔火Arcadia
 * @LastEditTime: 2023-01-11 14:29:43
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\apps\set_policy.js
 * @Description: 设置ap策略
 * 
 * Copyright (c) 2022 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved. 
 */

import e from 'express';
import plugin from '../../../lib/plugins/plugin.js';
import Config from '../components/ai_painting/config.js'
import Log from '../utils/Log.js';
import { getuserName } from '../utils/utils.js';
import cfg from '../../../lib/config/config.js'
import { segment } from 'oicq';

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
                    reg: "^#ap设置查水表(开启|关闭)$",
                    fnc: "setisAllowSearchLocalImg",
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
                    reg: "^#ap封禁(列表|名单)$",
                    fnc: "banlist",
                    // permission: "master",
                },
                {
                    reg: "^#ap管理员(列表|名单)$",
                    fnc: "masterlist",
                    // permission: "master",
                },
                {
                    reg: "^#ap(全局)?设置(\\d{5,11}|私聊)?(((审核|撤回|封禁)?(开启|关闭))|((((群聊|个人)(cd|CD))|撤回时间|次数)(\\d{1,5}|无限)))$",
                    fnc: "setgp",
                    // permission: "master",
                },
                {
                    reg: "^#ap(添加|删除)屏蔽词(.*)$",
                    fnc: "changePbWord",
                    permission: "master",
                },
                {
                    reg: "^#ap屏蔽词列表$",
                    fnc: "pbWordList",
                    // permission: "master",
                },

            ],
        });
    }
    /**设置全局cd     */
    async setcd(e) {
        let regExp = /^#ap设置全局cd(\d{1,5})$/i
        let ret = regExp.exec(e.msg)
        if (!ret) return false
        let num = Number((ret[1].trim())) || 1
        let policy = await Config.getPolicy()
        policy.cd = num
        try {
            await Config.setPolicy(policy)
        } catch (err) {
            Log.e(err)
            Log.e(err.message)
            return this.e.reply("设置失败。请查看控制台报错", true)
        }
        e.reply(`全局cd已设置为${num}`)
        return true
    }
    /**设置本地检索图片张数  */
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
    /**设置是否存本地  */
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
    /**设置是否允许群员查水表  */
    async setisAllowSearchLocalImg(e) {
        let isOpen = true
        if (e.msg.includes('关闭'))
            isOpen = false

        let policy = await Config.getPolicy()
        policy.isAllowSearchLocalImg = isOpen
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
    /**设置发现有人绘制违规图片时是否通知主人 */
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
    /* 设置ap管理员 */
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
    /* 封禁指定用户 */
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
    /* 设置策略 */
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
            if (gid == '私聊') gid = 'private'
            let isopen = true
            if (enable[3] == '关闭') isopen = false
            this.gp_Property(gid, 'enable', isopen)
        }
        else if (JH) {
            gid = JH[2] || gid || e.group_id
            if (JH[1] == '全局') gid = 'global'
            if (gid == '私聊') gid = 'private'
            let isopen = true
            if (JH[3] == '关闭') isopen = false
            this.gp_Property(gid, 'JH', isopen)
        }
        else if (isRecall) {
            gid = isRecall[2] || gid || e.group_id
            if (isRecall[1] == '全局') gid = 'global'
            if (gid == '私聊') gid = 'private'
            let isopen = true
            if (isRecall[3] == '关闭') isopen = false
            this.gp_Property(gid, 'isRecall', isopen)
        }
        else if (isBan) {
            gid = isBan[2] || gid || e.group_id
            if (isBan[1] == '全局') gid = 'global'
            if (gid == '私聊') gid = 'private'
            let isopen = true
            if (isBan[3] == '关闭') isopen = false
            this.gp_Property(gid, 'isBan', isopen)
        }

        else if (gcd) {
            gid = gcd[2] || gid || e.group_id
            if (gcd[1] == '全局') gid = 'global'
            if (gid == '私聊') gid = 'private'
            let num = Number(gcd[3]) || 1
            this.gp_Property(gid, 'gcd', num)
        }
        else if (pcd) {
            gid = pcd[2] || gid || e.group_id
            if (pcd[1] == '全局') gid = 'global'
            if (gid == '私聊') gid = 'private'
            let num = Number(pcd[3]) || 1
            this.gp_Property(gid, 'pcd', num)
        }
        else if (recallDelay) {
            gid = recallDelay[2] || gid || e.group_id
            if (recallDelay[1] == '全局') gid = 'global'
            if (gid == '私聊') gid = 'private'
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
            if (gid == '私聊') gid = 'private'
            let num = Number(usageLimit[3])
            if (usageLimit[3] == '无限') num = 0
            this.gp_Property(gid, 'usageLimit', num)
        }
        else { return false }

        return true
    }
    /* 查看管理员列表 */
    async masterlist(e) {
        let policy = await Config.getPolicy()
        let apMaster = [];
        let i = 1
        for (let val of policy.apMaster) {
            apMaster.push(`${i}. ${await getuserName(e, val)}` + (e.isPrivate && e.isMaster ? `(${val})` : ''));
            i++
        }
        let msg = ['当前暂未设置ap管理员哦']
        if (apMaster.length) {
            msg = [
                '当前拥有ap管理权限的用户如下：\n',
                apMaster.join('\n'),
            ]
        }
        e.reply(msg)
        return true
    }
    /**查看封禁用户列表 */
    async banlist(e) {
        let policy = await Config.getPolicy()
        if (policy.prohibitedUserList.length == 0) {
            e.reply("当前没有封禁用户哦～");
            return true;
        }

        e.reply("发送中，请稍等");
        var data_msg = [];
        for (let val of policy.prohibitedUserList) {
            data_msg.push({
                message: [
                    segment.image(`https://q1.qlogo.cn/g?b=qq&s=0&nk=${val}`),
                    `\n${val}`,
                ],
                nickname: await getuserName(e, val),
                user_id: val * 1,
            });
        }
        data_msg = data_msg.reverse();
        data_msg.push({
            message:
                "这些群友为了造福群友，不惜舍身忘死，他们无私无畏的奉献精神值得我们每一个人尊重和铭记",
            nickname: Bot.nickname,
            user_id: cfg.qq,
        });

        let sendRes = null;
        if (e.isGroup)
            sendRes = await e.reply(await e.group.makeForwardMsg(data_msg));
        else sendRes = await e.reply(await e.friend.makeForwardMsg(data_msg));
        if (!sendRes) e.reply("消息发送失败，可能被风控");

        return true;
    }

    /**修改屏蔽词*/
    async changePbWord(e) {
        if (/^#ap(添加|删除)屏蔽词$/.test(e.msg))
            return e.reply('发送#ap添加或删除屏蔽词XXX以添加或删除屏蔽词，支持多个词，英文不需区分大小写，以逗号分隔。\n例如：#ap添加屏蔽词抬腿,掀裙子,cum\n#ap删除屏蔽词bare leg, bare foot')
        let isadd = true
        if (/^#ap删除屏蔽词/.test(e.msg)) { isadd = false }
        let rawmsg = e.msg.replace(/^#ap(添加|删除)屏蔽词/, "")
        rawmsg = rawmsg.replace('，', ',').replace('，', ',')
        let rawList = rawmsg.split(',')
        rawList.forEach((value, index) => {
            rawList[index] = value.trim()
        })
        rawList = rawList.filter(x => { return x })
        rawList = [...new Set(rawList)]
        console.log(rawList)
        let pblist = await Config.getProhibitedWords()
        let a = []
        let b = []
        if (isadd) {
            for (let val of rawList)
                if (pblist.includes(val)) {
                    b.push(val)
                } else {
                    a.push(val)
                    pblist.push(val)
                }
            e.reply([
                a.length ? `成功添加屏蔽词：\n${a.join('\n')}` : '',
                b.length ? `${a.length ? '\n\n' : ''}已存在屏蔽词：\n${b.join('\n')}` : '',
                !(a.length || b.length) ? '你要添加的屏蔽词呢？' : ''
            ])
        } else {
            for (let val of rawList)
                if (!pblist.includes(val)) {
                    b.push(val)
                } else {
                    a.push(val)
                    let index = pblist.indexOf(val)
                    pblist.splice(index, 1)
                }
            e.reply([
                a.length ? `成功删除屏蔽词：\n${a.join('\n')}` : '',
                b.length ? `${a.length ? '\n\n' : ''}不存在屏蔽词：\n${b.join('\n')}` : '',
                !(a.length || b.length) ? '你要删除的屏蔽词呢？' : ''
            ])
        }
        Config.setProhibitedWords(pblist)
        return true
    }

    /**查看屏蔽词列表 */
    async pbWordList(e) {
        let pblist = await Config.getProhibitedWords()
        if (pblist.length == 0)
            return e.reply("当前没有屏蔽词哦")
        var data_msg = [];
        let text = "";
        for (let i = 0; i < pblist.length; i++) {
            text = text + "- " + pblist[i] + "\n";
            if ((i + 1) % 50 == 0) {
                data_msg.push({
                    message: text,
                    nickname: Bot.nickname,
                    user_id: cfg.qq,
                });
                text = "";
            }
        }
        if (text.length) {
            data_msg.push({
                message: text,
                nickname: Bot.nickname,
                user_id: cfg.qq,
            });
        }

        let sendRes = null;
        if (e.isGroup)
            sendRes = await e.reply(await e.group.makeForwardMsg(data_msg));
        else sendRes = await e.reply(await e.friend.makeForwardMsg(data_msg));

        if (!sendRes) {
            e.reply("消息发送失败，可能被风控~", true);
        }
        return true;
    }

    /**写入指定群的策略
     * @param {*} gid 群号，包括global和private
     * @param {*} key 属性名
     * @param {*} value 属性值 
     */
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
                                        : key == 'usageLimit' ? "每人每日用量限制"
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

    /* 整合策略：删去其他群中与global相同的属性 */
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