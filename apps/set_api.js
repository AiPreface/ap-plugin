/*
 * @Author: 渔火Arcadia  https://github.com/yhArcadia
 * @Date: 2022-12-19 22:18:54
 * @LastEditors: 渔火Arcadia
 * @LastEditTime: 2023-01-05 04:07:25
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\apps\set_api.js
 * @Description: 设置接口
 * 
 * Copyright (c) 2022 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved. 
 */
import plugin from '../../../lib/plugins/plugin.js';
import Config from '../components/ai_painting/config.js'
import Log from '../utils/Log.js';
import axios from 'axios';
import common from '../../../lib/common/common.js'
import fetch from 'node-fetch';

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
                    fnc: "selectapi",
                    permission: "master",
                },
                {
                    reg: "^#ap设置接口(\\d{1,3})密码(.+)$",
                    fnc: "set_sd_info",
                    permission: "master",
                },
                {
                    reg: "^#ap删除接口(\\d{1,3})$",
                    fnc: "delapi",
                    permission: "master",
                },
                {
                    reg: "^#ap设置(百度|鉴赏接口|大清晰术接口|检查ai接口|去背景接口|动漫化接口).+",
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
                    reg: "^#ap采样器列表$",
                    fnc: "samplerlist",
                    // permission: "master",
                },

            ],
        });
    }
    /**添加绘图接口 */
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

        if (/hf.space/.test(api))
            return e.reply("大清晰术和鉴赏的接口无法用于绘图哦，详见https://www.wolai.com/tiamcvmiaLJLePhTr4LAJE")

        let apcfg = await Config.getcfg()

        for (let val of apcfg.APIList) {
            if (val.url == api)
                return await e.reply(`已存在该接口:${api}  [${val.remark}]`)
        }
        // 检测接口连通性
        if (!await this.testapi(api, '绘图')) { return false }

        let obj = {
            url: api,
            remark: remark,
            account_id: '',
            account_password: '',
            token: ''
        }
        apcfg.APIList.push(obj)
        Config.setcfg(apcfg)

        e.reply(`新增接口成功：\n${api}  [${remark}]`)
        return true
    }

    /**选择默认接口 */
    async selectapi(e) {
        let num = e.msg.replace('#ap设置接口', "")
        console.log(num)
        let apcfg = await Config.getcfg()
        if (num > apcfg.APIList.length || num < 1) {
            let li = []
            let i = 1
            for (let val of apcfg.APIList) {
                li.push(`${i}：${val.remark}${i == apcfg.usingAPI ? ' [当前]' : ''}${e.isPrivate && e.isMaster ? `\n  ${val.url}` : ''}`)
                i++
            }
            e.reply(`接口${num}不存在,当前可选接口为：\n${li.join('\n')}`)
            return true
        }
        apcfg.usingAPI = Number(num)
        Config.setcfg(apcfg)
        e.reply(`默认接口已设置为${num}：${apcfg.APIList[num - 1].remark}${e.isPrivate && e.isMaster ? `\n  ${apcfg.APIList[num - 1].url}` : ''}`)
        return true
    }

    /**设置接口密码 */
    async set_sd_info(e) {
        let ret = /^#ap设置接口(\d{1,3})密码(.+)$/.exec(e.msg)
        let num = ret[1]
        let account_password = ret[2]
        Log.w(num, account_password)
        let apcfg = await Config.getcfg()
        if (num > apcfg.APIList.length || num < 1) {
            let li = []
            let i = 1
            for (let val of apcfg.APIList) {
                li.push(`${i}：${val.remark}${i == apcfg.usingAPI ? ' [当前]' : ''}${e.isPrivate && e.isMaster ? `\n  ${val.url}` : ''}`)
                i++
            }
            e.reply(`接口${num}不存在,当前可选接口为：\n${li.join('\n')}`)
            return true
        }
        apcfg.APIList[num - 1].account_password = account_password
        Config.setcfg(apcfg)
        e.reply(`接口${num}：${apcfg.APIList[num - 1].remark}${e.isPrivate && e.isMaster ? `\n  ${apcfg.APIList[num - 1].url}` : ''}\n密码已设置为：${account_password}`)
        return true
    }

    /**删除指定绘图接口  */
    async delapi(e) {
        let num = e.msg.replace('#ap删除接口', "")
        console.log(num)
        let apcfg = await Config.getcfg()
        if (num > apcfg.APIList.length || num < 1) {
            let li = []
            let i = 1
            for (let val of apcfg.APIList) {
                li.push(`${i}：${val.remark}${i == apcfg.usingAPI ? ' [当前]' : ''}${e.isPrivate && e.isMaster ? `\n  ${val.url}` : ''}`)
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
        // console.log(apcfg.APIList)

        Config.setcfg(apcfg)

        let msg = [
            `成功删除接口${num}：${apcfg.APIList[num - 1].remark}${e.isPrivate && e.isMaster ? `\n  ${apcfg.APIList[num - 1].url}` : ''}`,
            apcfg.APIList.length == 0 ? '\n当前接口列表为空' : ischange ? `\n默认接口已更改为${apcfg.usingAPI}：${apcfg.APIList[apcfg.usingAPI - 1].remark}${e.isPrivate && e.isMaster ? `\n  ${apcfg.APIList[num - 1].url}` : ''}` : ''
        ]

        e.reply(msg)
        return true
    }

    /**查看接口列表     */
    async apilist(e) {
        let apcfg = await Config.getcfg()
        let li = []
        let i = 1
        if (apcfg.APIList.length == 0) {
            return e.reply("当前无可用接口，请先添加接口\n命令：#ap添加接口\n参考文档：https://www.wolai.com/k6qBiSdjzRmGZRk6cygNCk")
        }
        for (let val of apcfg.APIList) {
            li.push(`${i}：${val.remark}${i == apcfg.usingAPI ? ' [默认]' : ''}` + (e.isPrivate && e.isMaster ? `\n   ${val.url}` : ''))
            i++
        }
        e.reply(li.join('\n'))
        return true
    }

    /* 查看当前ap设置 */
    async config(e) {
        let policy = await Config.getPolicy()
        let gp = policy.gp

        let msg = [
            `全局CD：${policy.cd}秒\n`,
            `本地检索图片最大${policy.localNum}张\n`,
            `保存图片至本地：${policy.isDownload ? '是' : '否'}\n`,
            `有人绘制违规图片时通知主人：${policy.isTellMaster ? '是' : '否'}\n`,


            `\n=========ap策略=========\n`,

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
            if (gid == 'global')
                continue
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
        if (msg_) msg = msg.concat(msg_)
        e.reply(msg.join(''))
        return true
    }

    async setother(e) {
        let baidu_appid_reg = /^#ap设置百度appid ?(\d{8})$/
        let baidu_ak_reg = /^#ap设置百度apikey ?([A-Za-z0-9]+)$/
        let baidu_sk_reg = /^#ap设置百度secretkey ?([A-Za-z0-9]+)$/
        let jianshang_reg = /^#ap设置鉴赏接口 ?(http.+)$/
        let super_resolution_reg = /^#ap设置大清晰术接口 ?(http.+)$/
        let ai_detect_reg = /^#ap设置检查ai接口 ?(http.+)$/
        let remove_bg_reg = /^#ap设置去背景接口 ?(http.+)$/
        let cartoonization_reg = /^#ap设置动漫化接口 ?(http.+)$/

        let bdappid = baidu_appid_reg.exec(e.msg)
        if (bdappid) { return this.writecfg(bdappid, 'baidu_appid') }

        let bdkey = baidu_ak_reg.exec(e.msg)
        if (bdkey) { return this.writecfg(bdkey, 'baidu_apikey') }

        let bdsk = baidu_sk_reg.exec(e.msg)
        if (bdsk) { return this.writecfg(bdsk, 'baidu_secretkey') }

        let jianshang = jianshang_reg.exec(e.msg)
        if (jianshang) { return this.writecfg(jianshang, 'appreciate') }

        let RC = super_resolution_reg.exec(e.msg)
        if (RC) { return this.writecfg(RC, 'Real_CUGAN') }

        let ai_detect = ai_detect_reg.exec(e.msg)
        if (ai_detect) { return this.writecfg(ai_detect, 'ai_detect') }

        let remove_bg = remove_bg_reg.exec(e.msg)
        if (remove_bg) { return this.writecfg(remove_bg, 'remove_bg') }

        let cartoonization = cartoonization_reg.exec(e.msg)
        if (cartoonization) { return this.writecfg(cartoonization, 'cartoonization') }

        return false
    }

    /**写入配置
     * @param {*} ret 匹配到的正则
     * @param {*} type 属性类型
     * @return {*}
     */
    async writecfg(ret, type) {
        let value = ret[1].trim()
        if (type == "baidu_appid") value = Number(value)
        if ((type == 'Real_CUGAN') && !value.endsWith('/')) value = value + '/'
        if ((type == 'appreciate' || type == 'ai_detect' || type == 'remove_bg') && value.endsWith('/')) value = value.replace(/\/$/, "").trim()
        if (type == "cartoonization") value = value.replace('/+/', '/').replace(/\/$/, "")

        console.log(type)
        console.log(value)
        // if (type == 'appreciate' || type == 'ai_detect')
        //     if (!value.endsWith('predict'))
        //         return this.e.reply('鉴赏接口和检查ai接口应当以“predict”结尾')

        // 测试接口连通性
        if (type != 'remove_bg')
            if (type != "baidu_appid" && type != "baidu_apikey" && type != "baidu_secretkey") {
                if (!await this.testapi(value, type)) { return false }
            }

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


    /**检测接口的连通性
     * @param {*} api 接口地址
     * @param {*} type 接口类型：绘图 or ""
     * @return {*}
     */
    async testapi(api, type = '') {
        if (type == '绘图') { api = api + `/sdapi/v1/txt2img` }
        this.e.reply('正在测试接口连通性，请稍候')
        let testres = await test_api(api)
        this.e.reply(testres ? `接口可用` : `接口未正确响应，您可能配置了错误的接口`, true)
        return testres
    }

    /**查看当前接口支持的采样器列表 */
    async samplerlist(e) {
        // 取默认接口
        let apcfg = await Config.getcfg()
        if (apcfg.APIList.length == 0) {
            e.reply('当前暂无可用接口')
            return true
        }
        let index = apcfg.usingAPI
        let apiobj = apcfg.APIList[index - 1]
        let api = apiobj.url     //接口
        let remark = apiobj.remark //接口备注
        try {
            let res = await fetch(api + `/sdapi/v1/samplers`)
            if (res.status == 404) {
                return e.reply('拉取列表失败')
            }
            res = await res.json()
            let samplerList = []
            for (let val of res)
                samplerList.push(val.name)
            e.reply(`当前接口[${remark}]支持如下采样器：\n` + samplerList.join('\n'))
        } catch (err) {
            console.log(err)
            return e.reply('拉取列表失败')
        }
        return true

    }
}

/**请求接口，判断是否收到了正确的响应
 * @param {*} api 接口地址
 */
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