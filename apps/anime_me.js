/*
 * @Author: 渔火Arcadia  https://github.com/yhArcadia
 * @Date: 2022-12-23 14:27:36
 * @LastEditors: 渔火Arcadia
 * @LastEditTime: 2022-12-24 19:21:03
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\apps\anime_me.js
 * @Description: 二次元的我
 * 
 * Copyright (c) 2022 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved. 
 */
import { getuserName } from "../utils/utils.js";
import { Draw } from "../components/apidx.js";
import Log from "../utils/Log.js";
import { Pictools } from "../utils/utidx.js";
import { getdsc } from "../components/anime_me/getdes.js";
import { segment } from "oicq";
import cfg from '../../../lib/config/config.js'
import moment from "moment";
export class Anime_me extends plugin {
    constructor() {
        super({
            name: '二次元的我',
            dsc: '二次元的我',
            event: 'message',
            priority: 4999,
            rule: [
                {
                    reg: "^#?二次元的我?$", //匹配消息正则，命令正则
                    fnc: 'ercy'
                }
            ]
        })
        this.qq = NaN
    }

    async ercy(e) {
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

        Log.i("二次元的", `${name}：`, dsc);

        // 构造绘图参数
        let paramdata = await this.construct_param(dsc)
        // 根据描述获取图片
        let res = await Draw.get_a_pic(paramdata)
        if (res.code)
            return await e.reply(res.description, true)
        // 发送图片 
        return await e.reply([`${dsc.ch.replace("_name_", name)}`, segment.image(`base64://${res.base64}`)], true)
    }


    /**根据描述构造绘图的参数
     * @param {*} dsc
     * @return {*}
     */
    async construct_param(dsc) {
        // 以#开头时，使用图生图
        let base64 = null
        if (this.e.msg.startsWith('#')) {
            let res = await Pictools.getPicInfo(`https://q1.qlogo.cn/g?b=qq&s=0&nk=${this.qq}`)
            if (res.ok)
                base64 = res.base64
        }
        let paramdata = {
            param: {
                sampler: 'Euler a',
                strength: 0.6,
                seed: -1,
                scale: 11,
                steps: 18,
                width: base64 ? 512 : 384,
                height: 512,
                tags: dsc.en,
                ntags: "默认",
                base64: base64,
            },
            num: 1,
            rawtag: {
                tags: dsc.en,
                ntags: "默认"
            },
            specifyAPI: NaN,
            user: Number(this.qq),
            code: 0,
            JH: false,
            message: "二次元的我",
        }
        return paramdata
    }
}