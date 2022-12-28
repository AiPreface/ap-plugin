/*
 * @Author: 渔火Arcadia  https://github.com/yhArcadia
 * @Date: 2022-12-19 22:18:54
 * @LastEditors: 渔火Arcadia
 * @LastEditTime: 2022-12-28 15:19:52
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\apps\set.js
 * @Description: 设置
 * 
 * Copyright (c) 2022 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved. 
 */
import plugin from '../../../lib/plugins/plugin.js';
import Config from '../components/ap/config.js'
import Log from '../utils/Log.js';
import { getuserName } from '../utils/utils.js';
import { segment } from 'oicq';
import cfg from '../../../lib/config/config.js'
import axios from 'axios';
import common from '../../../lib/common/common.js'
import e from 'express';

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
                    reg: "^#ap设置(百度|鉴赏接口|大清晰术接口).+",
                    fnc: "setother",
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
                    permission: "master",
                },
                {
                    reg: "^#ap封禁(列表|名单)$",
                    fnc: "banlist",
                    // permission: "master",
                },
                // {
                //     reg: "^#ap管理员(列表|名单)$",
                //     fnc: "masterlist",
                //     // permission: "master",
                // },
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
                return await e.reply(`已存在该接口:${api}  [${val[api]}]`)
        }
        // 检测接口连通性
        if (!await this.testapi(api, '绘图')) { return false }

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
        if (apcfg.APIList.length == 0) {
            e.reply("当前无可用接口，请先添加接口\n命令：#ap添加接口\n参考文档：https://www.wolai.com/k6qBiSdjzRmGZRk6cygNCk")
        }
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
            `保存图片至本地：${policy.isDownload ? '是' : '否'}\n`,
            `有人绘制违规图片时通知主人：${policy.isTellMaster ? '是' : '否'}\n`,
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
                if (gid == 'private') {
                    msg_.push(`\n\n[私聊]：`)
                } else {
                    let gname = '未知群聊'
                    try {
                        let ginfo = await Bot.getGroupInfo(Number(gid))
                        console.log(ginfo)
                        gname = ginfo ? ginfo.group_name : '未知群聊'
                    } catch (err) { }
                    msg_.push(`\n\n[${gname}]` + (e.isPrivate && e.isMaster ? `(${gid})` : '') + '：')
                }
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

    async setother(e) {
        let bdappidReg = /^#ap设置百度appid ?(\d{8})$/
        let bdkeyReg = /^#ap设置百度apikey ?([A-Za-z0-9]+)$/
        let bdskReg = /^#ap设置百度secretkey ?([A-Za-z0-9]+)$/
        let jianshangReg = /^#ap设置鉴赏接口 ?(http.+)$/
        let RCReg = /^#ap设置大清晰术接口 ?(http.+)$/

        let bdappid = bdappidReg.exec(e.msg)
        if (bdappid) { return this.writecfg(bdappid, 'baidu_appid') }

        let bdkey = bdkeyReg.exec(e.msg)
        if (bdkey) { return this.writecfg(bdkey, 'baidu_apikey') }

        let bdsk = bdskReg.exec(e.msg)
        if (bdsk) { return this.writecfg(bdsk, 'baidu_secretkey') }

        let jianshang = jianshangReg.exec(e.msg)
        if (jianshang) { return this.writecfg(jianshang, 'appreciate') }

        let RC = RCReg.exec(e.msg)
        if (RC) { return this.writecfg(RC, 'Real_CUGAN') }

        return false
    }

    /**
     * @param {*} ret 匹配到的正则
     * @param {*} type 属性类型
     * @return {*}
     */
    async writecfg(ret, type) {
        let value = ret[1].trim()
        if (type == "baidu_appid") value = Number(value)
        if ((type == 'Real_CUGAN') && !value.endsWith('/')) value = value + '/'
        if ((type == 'appreciate') && value.endsWith('/')) value = value.replace(/\/$/, "").trim()
        console.log(value)
        console.log(type)
        // 测试接口连通性
        if (type != "baidu_appid")
            if (!await this.testapi(value, type)) { return false }

        try {
            let apcfg = await Config.getcfg()
            apcfg[type] = value
            await Config.setcfg(apcfg)
        } catch (err) {
            Log.e(err)
            Log.e(err.message)
            return this.e.reply("设置失败。请查看控制台报错", true)
        }
        this.e.reply("设置成功，若未生效请重启Bot")

        return true
    }

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
    async testapi(api, type = '') {
        if (type == '绘图') { api = api + `/sdapi/v1/txt2img` }
        this.e.reply('正在测试接口连通性，请稍候')
        let testres = await test_api(api)
        this.e.reply(testres ? `接口可用` : `接口未正确响应，您可能配置了错误的接口`, true)
        return testres
    }
}

export async function test_api(api) {
    try {
        let res = await axios.get(api, {
            timeout: 5000
        })
        res = await res.json()
        console.log(res.data);
        if (!res.data.detail == 'Method Not Allowed') { return false }
    } catch (err) {
        console.log(err.message);
        if (err.message == 'Request failed with status code 405')
            return true
        else
            return false
    }
    return false
}