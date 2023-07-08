/*
 * @Author: 渔火Arcadia  https://github.com/yhArcadia
 * @Date: 2022-12-23 14:27:36
 * @LastEditors: 苏沫柒 3146312184@qq.com
 * @LastEditTime: 2023-05-07 12:09:10
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\apps\anime_me.js
 * @Description: 二次元的我
 * 
 * Copyright (c) 2022 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved. 
 */
import { getuserName } from "../utils/utils.js";
import Config from '../components/ai_painting/config.js';
import { Draw, Parse, CD } from "../components/apidx.js";
import Log from "../utils/Log.js";
import { Pictools } from "../utils/utidx.js";
import { getdsc } from "../components/anime_me/getdes.js";
import { requestAppreciate } from './appreciation.js'
import moment from "moment";
import puppeteer from '../../../lib/puppeteer/puppeteer.js'

export class Anime_me extends plugin {
    constructor() {
        super({
            name: 'AP-二次元的我',
            dsc: '二次元的我',
            event: 'message',
            priority: 1009,
            rule: [
                {
                    reg: "^(#|%|/)?二次元的我?$", //匹配消息正则，命令正则
                    fnc: 'ercy',
                },
                {
                    reg: "^#?(全局)?刷新二次元的我$", //匹配消息正则，命令正则
                    fnc: 'refreshErcy',
                    permission: "master",
                },
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

        e.reply("正在生成您的二次元形象，马上就好...", true)
        this.qq = e.at || e.user_id
        // 二次元的@bot
        if (e.atBot && !e.msg.includes("我")) this.qq = Bot.uin
        // 优先取redis中的缓存数据
        let dsc = await JSON.parse(await redis.get(`Yz:AiPainting:ercydata:${this.qq}`));
        if (!dsc) {
            // 没有缓存时，获取新的描述，写入redis缓存，当日0点到期
            dsc = getdsc(this.qq)
            let time = moment(Date.now()).add(1, "days").format("YYYY-MM-DD 00:00:00");
            let exTime = Math.round((new Date(time).getTime() - new Date().getTime()) / 1000);
            redis.set(`Yz:AiPainting:ercydata:${this.qq}`, JSON.stringify(dsc), { EX: exTime });
        }
        // 用户名
        let name = await getuserName(e, this.qq)


        // 构造绘图参数
        let paramdata = await this.construct_param(dsc)
        let logMessage = (e.msg.startsWith('%') || e.msg.startsWith('/'))
            ? "\n英文提示词：" + paramdata.param.tags
            : "\n中文关键词：" + dsc.ch + "\n英文提示词：" + dsc.en;
        Log.i(logMessage);
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
        let setting = await Config.getSetting()
        if (!setting.anime_me_card) {
            return await e.reply([this.e.msg.startsWith('/') ? "" : `${dsc.ch.replace("_name_", name)}`, segment.image(`base64://${res.base64}`)], true)
        } else {
            let data = {
                quality: 90,
                tplFile: `./plugins/ap-plugin/resources/animeme/animeMe.html`,
                imgBase64: res.base64,
                text: this.e.msg.startsWith('/') ? "" : dsc.ch.replace("_name_", name)
            }
            let img = await puppeteer.screenshot('animeMe', data)
            e.reply(img, true)
        }
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
        // 获取本群策略
        let current_group_policy = await Parse.parsecfg(this.e)
        if (!current_group_policy.JH) {
            JH = false
        } else {
            JH = true
        }
        let paramdata = {
            param: {
                enable_hr: true,
                hr_scale: 1.5,
                hr_upscaler: 'Latent (nearest-exact)',
                sampler: 'DPM++ 2M Karras',
                strength: 0.5,
                seed: -1,
                scale: 11,
                steps: 20,
                width: txdsc ? 768 : base64 ? 640 : 768,
                height: txdsc ? 512 : base64 ? 640 : 512,
                tags: txdsc ? txdsc + ',' + (this.e.msg.startsWith('/') ? "" : dsc.en) : dsc.en + "(upper body: 1.8), (solo: 1.5)",
                ntags: "",
                base64: txdsc ? null : base64,
            },
            num: 1,
            rawtag: {
                tags: dsc.en + "(upper body: 1.8), (solo: 1.5)",
                ntags: "EasyNegative, nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry"
            },
            specifyAPI: NaN,
            user: Number(this.qq),
            code: 0,
            JH: JH,
            message: "二次元的我",
        }
        return paramdata
    }


    /**刷新“二次元的我”属性
     * @param {*} e
     * @return {*}
     */
    async refreshErcy(e) {
        let is_all_refresh = false
        if (e.msg.match(/全局/)) { is_all_refresh = true }
        // Log.i(is_all_refresh)

        let all_list = await redis.keys('Yz:AiPainting:ercydata:*')
        // Log.i(all_list)

        if (e.atBot) { e['at'] = Bot.uin }

        if (is_all_refresh) {
            for (let val of all_list) {
                redis.del(val)
            }
            e.reply('已刷新全部用户的属性')
        }
        else if (e.at) {
            redis.del(`Yz:AiPainting:ercydata:${e.at}`)
            e.reply(`已刷新${await getuserName(e, e.at)}(${e.at})的属性`)
        }
        else {
            e.reply('命令格式：\n#刷新二次元的我@用户\n或\n#全局刷新二次元的我')
        }
        return true
    }
}