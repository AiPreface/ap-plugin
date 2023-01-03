/*
 * @Author: 渔火Arcadia  https://github.com/yhArcadia
 * @Date: 2022-12-23 14:27:36
 * @LastEditors: 渔火Arcadia
 * @LastEditTime: 2023-01-03 19:35:52
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\apps\anime_me.js
 * @Description: 二次元的我
 * 
 * Copyright (c) 2022 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved. 
 */
import { getuserName } from "../utils/utils.js";
import { Draw, Parse, CD } from "../components/apidx.js";
import Log from "../utils/Log.js";
import { Pictools } from "../utils/utidx.js";
import { getdsc } from "../components/anime_me/getdes.js";
import { segment } from "oicq";
import { requestAppreciate } from './appreciate.js'
import cfg from '../../../lib/config/config.js'
import moment from "moment";
import NsfwCheck from "../components/ai_painting/nsfwcheck.js";
export class Anime_me extends plugin {
    constructor() {
        super({
            name: '二次元的我',
            dsc: '二次元的我',
            event: 'message',
            priority: 4999,
            rule: [
                {
                    reg: "^(#|%|/)?二次元的我?$", //匹配消息正则，命令正则
                    fnc: 'ercy',
                }
            ]
        })
        this.qq = NaN
    }

    async ercy(e) {
        // 获取本群策略
        let gpolicy = await Parse.parsecfg(e)
        // 判断功能是否开启
        if (!e.isMaster && gpolicy.apMaster.indexOf(e.user_id) == -1)
            if (!gpolicy.enable) return await e.reply("aiPainting功能未开启", false, { recallMsg: 15 });
        // 判断是否禁用用户
        if (gpolicy.isBan)
            if (gpolicy.prohibitedUserList.indexOf(e.user_id) != -1)
                return await e.reply(["你的账号因违规使用屏蔽词绘图已被封禁"], true);
        // 判断cd
        let cdCheck = await CD.checkCD(e, gpolicy)
        if (cdCheck)
            return await e.reply(cdCheck, true, { recallMsg: 15 });


        this.qq = e.at || e.user_id
        // 二次元的@bot
        if (e.atBot && !e.msg.includes("我")) this.qq = cfg.qq
        // 优先取redis中的缓存数据
        let dsc = await JSON.parse(await redis.get(`Yunzai:aiPainting:ercydata:${this.qq}`));
        if (!dsc) {
            // 没有缓存时，获取新的描述，写入redis缓存，当日0点到期
            dsc = getdsc(this.qq)
            let time = moment(Date.now()).add(1, "days").format("YYYY-MM-DD 00:00:00");
            let exTime = Math.round((new Date(time).getTime() - new Date().getTime()) / 1000);
            redis.set(`Yunzai:aiPainting:ercydata:${this.qq}`, JSON.stringify(dsc), { EX: exTime });
        }
        // 用户名
        let name = await getuserName(e, this.qq)


        // 构造绘图参数
        let paramdata = await this.construct_param(dsc)
        Log.i("二次元的", `${name}：`, (e.msg.startsWith('%') || e.msg.startsWith('/')) ? paramdata.param.tags : dsc);
        // 根据描述获取图片
        let res = await Draw.get_a_pic(paramdata)
        if (res.code) {
            CD.clearCD(e)
            e.reply(res.description, true)
            return true
        }
        if (res.isnsfw) {
            e.reply('图片不合规，不予展示', true)
            return true
        }
        // 发送图片 
        return await e.reply([this.e.msg.startsWith('/') ? "" : `${dsc.ch.replace("_name_", name)}`, segment.image(`base64://${res.base64}`)], true)
    }


    /**根据描述构造绘图的参数
     * @param {*} dsc
     * @return {*}
     */
    async construct_param(dsc) {
        // 以#开头时，使用图生图
        let base64 = null
        let txdsc = null
        let JH = false
        if (this.e.msg.startsWith('#')) {
            let res = await Pictools.getPicInfo(`https://q1.qlogo.cn/g?b=qq&s=0&nk=${this.qq}`)
            if (res.ok)
                base64 = res.base64
        }
        else if (this.e.msg.startsWith('%')) {
            let res = await Pictools.getPicInfo(`https://q1.qlogo.cn/g?b=qq&s=0&nk=${this.qq}`)
            if (res.ok) {
                base64 = res.base64
                txdsc = await requestAppreciate(base64)
                JH = true
            }
        }
        else if (this.e.msg.startsWith('/')) {
            let res = await Pictools.getPicInfo(`https://q1.qlogo.cn/g?b=qq&s=0&nk=${this.qq}`)
            if (res.ok) {
                base64 = res.base64
                txdsc = await requestAppreciate(base64)
                base64 = null
                JH = true
            }
        }
        let paramdata = {
            param: {
                sampler: 'Euler a',
                strength: 0.6,
                seed: -1,
                scale: 11,
                steps: 18,
                width: txdsc ? 384 : base64 ? 512 : 384,
                height: 512,
                tags: txdsc ? txdsc + ',' + (this.e.msg.startsWith('/') ? "" : dsc.en) : dsc.en,
                ntags: "默认",
                base64: txdsc ? null : base64,
            },
            num: 1,
            rawtag: {
                tags: dsc.en,
                ntags: "默认"
            },
            specifyAPI: NaN,
            user: Number(this.qq),
            code: 0,
            JH: JH,
            message: "二次元的我",
        }
        return paramdata
    }
}