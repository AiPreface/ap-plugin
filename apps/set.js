/*
 * @Author: 渔火Arcadia  https://github.com/yhArcadia
 * @Date: 2022-12-19 22:18:54
 * @LastEditors: 渔火Arcadia
 * @LastEditTime: 2022-12-25 00:43:09
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\apps\set.js
 * @Description: 设置
 * 
 * Copyright (c) 2022 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved. 
 */
import plugin from '../../../lib/plugins/plugin.js';
import Config from '../components/ap/config.js'
import { getuserName } from '../utils/utils.js';

// 设置是否保存图片 
export class set extends plugin {
    constructor() {
        super({
            name: "AiPainting设置",
            dsc: "更改AiPainting设置",
            event: "message",
            priority: 5000,
            rule: [
                {
                    reg: "^#ap(添加|新增|录入)接口",
                    fnc: "addapi",
                    permission: "master",
                },
                {
                    reg: "^#ap设置接口(\\d{1,3})$",
                    fnc: "setapi",
                    permission: "master",
                },
                {
                    reg: "^#ap删除接口(\\d{1,3})$",
                    fnc: "delapi",
                    permission: "master",
                },
                {
                    reg: "^#ap接口列表$",
                    fnc: "apilist",
                    // permission: "master",
                },
                {
                    reg: "^#ap设置$",
                    fnc: "config",
                    // permission: "master",
                },
            ],
        });
    }
    async addapi(e) {
        let regExp = /^#ap(添加|新增|录入)接口((http|localhost).+)备注(.+)$/
        let regp = regExp.exec(e.msg)

        if (!regp) {
            e.reply("命令格式：#ap添加接口[接口地址]备注[接口备注]\n例如:\n     #ap添加接口http://example.com:7860备注V100")
            return true
        }

        let api = regp[2].trim()
        let remark = regp[4].trim()

        if (api.endsWith('/'))
            api = api.replace(/\/$/, "").trim()

        let apcfg = await Config.getcfg()

        for (let val of apcfg.APIList) {
            if (Object.keys(val).includes(api))
                return await e.reply(`已存在该接口[${remark}]`)
        }

        let obj = {}
        obj[api] = remark
        apcfg.APIList.push(obj)
        Config.setcfg(apcfg)

        e.reply(`新增接口成功：\n${api}  [${remark}]`)
        return true
    }

    async setapi(e) {
        let num = e.msg.replace('#ap设置接口', "")
        console.log(num)
        let apcfg = await Config.getcfg()
        if (num > apcfg.APIList.length || num < 1) {
            let li = []
            let i = 1
            for (let val of apcfg.APIList) {
                li.push(`${i}：${Object.values(val)[0]}${i == apcfg.usingAPI ? ' [当前]' : ''}`)
                i++
            }
            e.reply(`接口${num}不存在,当前可选接口为：\n${li.join('\n')}`)
            return true
        }
        apcfg.usingAPI = Number(num)
        Config.setcfg(apcfg)
        e.reply(`默认接口已设置为${num}：${Object.values(apcfg.APIList[num - 1])[0]}`)
        return true
    }

    async delapi(e) {
        let num = e.msg.replace('#ap删除接口', "")
        console.log(num)
        let apcfg = await Config.getcfg()
        if (num > apcfg.APIList.length || num < 1) {
            let li = []
            let i = 1
            for (let val of apcfg.APIList) {
                li.push(`${i}：${Object.values(val)[0]}`)
                i++
            }
            e.reply(`接口${num}不存在,当前可选接口为：\n${li.join('\n')}`)
            return true
        }

        let target = apcfg.APIList[num - 1]
        let ischange = num == apcfg.usingAPI

        if (num <= apcfg.usingAPI && apcfg.usingAPI > 1)
            apcfg.usingAPI--

        apcfg.APIList.splice(num - 1, 1)
        console.log(apcfg.APIList)

        Config.setcfg(apcfg)

        let msg = [
            `成功删除接口${num}：${Object.values(target)[0]}`,
            apcfg.APIList.length == 0 ? '\n当前接口列表为空' : ischange ? `\n默认接口已更改为${apcfg.usingAPI}：${Object.values(apcfg.APIList[apcfg.usingAPI - 1])[0]}` : ''
        ]

        e.reply(msg)
        return true
    }

    async apilist(e) {
        let apcfg = await Config.getcfg()
        let li = []
        let i = 1
        for (let val of apcfg.APIList) {
            li.push(`${i}：${Object.values(val)[0]}${i == apcfg.usingAPI ? ' [默认]' : ''}` + (e.isPrivate && e.isMaster ? `\n   ${Object.keys(val)[0]}` : ''))
            i++
        }
        e.reply(li.join('\n'))
        return true
    }


    async config(e) {
        let policy = await Config.getPolicy()
        let gp = policy.gp


        let apMaster = [];
        let i = 1
        for (let val of policy.apMaster) {
            apMaster.push(`      ${i}.${await getuserName(e, val)}` + (e.isPrivate && e.isMaster ? `(${val})` : ''));
            i++
        }

        let msg = [
            `全局CD：${policy.cd}秒\n`,
            `本地检索图片最大${policy.localNum}张\n`,
            `apAdministrator：\n`,
            apMaster.join('\n'),

            `\n\n=========ap策略=========\n`,

            `\n[全局]：`,
            `\n      启用ap：${gp.global.enable ? '是' : '否'}`,
            `\n      每日用量限制：` + (gp.global.usageLimit ? `${gp.global.usageLimit}张` : '不限'),
            `\n      启用图片审核：${gp.global.JH ? '是' : '否'}`,
            `\n      群聊内共享CD：${gp.global.gcd}秒`,
            `\n      个人CD：${gp.global.pcd}秒`,
            `\n      自动撤回图片：${gp.global.isRecall ? '是' : '否'}`,
            `\n      自动撤回延时：${gp.global.recallDelay}秒`,
            `\n      封禁使用屏蔽词绘图的用户：${gp.global.isBan ? '是' : '否'}`,
        ]

        let msg_ = []
        for (let gid in gp) {
            if (gid != 'global') {
                let gname = '未知群聊'
                try {
                    let ginfo = await Bot.getGroupInfo(gid)
                    console.log(ginfo)
                    gname = ginfo ? ginfo.group_name : '未知群聊'
                } catch (err) { }
                msg_.push(`\n\n[${gname}]` + (e.isPrivate && e.isMaster ? `(${gid})` : '') + '：')
                for (let val of Object.keys(gp[gid])) {
                    let opt = val == 'enable' ? "\n      启用ap："
                        : val == 'JH' ? "\n      启用图片审核："
                            : val == 'isRecall' ? "\n      自动撤回图片："
                                : val == 'isBan' ? "\n      封禁使用屏蔽词绘图的用户："
                                    : ''
                    if (opt) {
                        msg_.push(opt + `${gp[gid][val] ? '是' : '否'}`)
                        continue
                    }

                    opt = val == 'gcd' ? "\n      群聊内共享CD："
                        : val == 'pcd' ? "\n      个人CD："
                            : val == 'recallDelay' ? "\n      自动撤回延时："
                                : ''
                    if (opt) {
                        msg_.push(opt + `${gp[gid][val]}秒`)
                        continue
                    }
                    msg_.push(`\n      每日用量限制：` + (gp[gid][val] ? `${gp[gid][val]}张` : '不限'))
                }
            }
        }
        if (msg_) msg = msg.concat(msg_)
        e.reply(msg.join(''))
        return true
    }
}