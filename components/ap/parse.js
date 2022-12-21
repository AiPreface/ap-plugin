/*
 * @Author: 渔火Arcadia  https://github.com/yhArcadia
 * @Date: 2022-12-19 12:02:16
 * @LastEditors: 渔火Arcadia
 * @LastEditTime: 2022-12-22 01:03:43
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\components\ap\parse.js
 * @Description: 解析整合特定内容
 * 
 * Copyright (c) 2022 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved. 
 */

import Config from './config.js'
import { parseImg, getPicInfo, translate } from '../../utils/utils.js'

class Parse {
    constructor() {
    }

    /**获取指定群的ap策略
     * @param {*} e OICQ事件参数e
     * @return {object} gpolicy：此群的ap策略
     */
    async parsecfg(e) {
        let policy = await Config.getPolicy()
        let gpolicy = {
            cd: policy.cd,
            localNum: policy.localNum,
            prohibitedUserList: policy.prohibitedUserList,
            apMaster: policy.apMaster,
            enable: e.group_id in policy.gp && "enable" in policy.gp[e.group_id] ? policy.gp[e.group_id].enable : policy.gp.global.enable,
            JH: e.group_id in policy.gp && "JH" in policy.gp[e.group_id] ? policy.gp[e.group_id].JH : policy.gp.global.JH,
            gcd: e.group_id in policy.gp && "gcd" in policy.gp[e.group_id] ? policy.gp[e.group_id].gcd : policy.gp.global.gcd,
            pcd: e.group_id in policy.gp && "pcd" in policy.gp[e.group_id] ? policy.gp[e.group_id].pcd : policy.gp.global.pcd,
            isRecall: e.group_id in policy.gp && "isRecall" in policy.gp[e.group_id] ? policy.gp[e.group_id].isRecall : policy.gp.global.isRecall,
            recallDelay: e.group_id in policy.gp && "recallDelay" in policy.gp[e.group_id] ? policy.gp[e.group_id].recallDelay : policy.gp.global.recallDelay,
            isBan: e.group_id in policy.gp && "isBan" in policy.gp[e.group_id] ? policy.gp[e.group_id].isBan : policy.gp.global.isBan,
            usageLimit: e.group_id in policy.gp && "usageLimit" in policy.gp[e.group_id] ? policy.gp[e.group_id].usageLimit : policy.gp.global.usageLimit,
        }
        return gpolicy
    }


    /**整合绘图所用参数
     * @param {*} e OICQ事件参数e
     * @return {object}  paramdata 整合的参数
     */
    async mergeParam(e) {
        // 取消息中的图片、at的头像、回复的图片，放入e.img 
        e = await parseImg(e)

        let gpolicy = await this.parsecfg(e)


        let picInfo = null
        // 存在图片时，取图片信息
        if (e.img) {
            picInfo = await getPicInfo(e.img[0])
            // 若获取图片信息失败 
            if (!picInfo.ok) return { code: 1, msg: "获取图片信息失败" }
        }

        // 解析命令中的参数
        let txtparam = await this.parsetxt(e.msg)

        // 如果指定了不存在的接口
        let config = await Config.getcfg()
        if (txtparam.specifyAPI > config.APIList.length)
            return { code: 2, msg: `接口${txtparam.specifyAPI}不存在,当前有${config.APIList.length}个接口。` }
        // 有图片时，采用图片的宽高
        if (picInfo) {
            // 计算640*640像素下所对应的宽高
            let w = Math.round(Math.sqrt(640 * 640 * picInfo.width / picInfo.height))
            let h = Math.round(Math.sqrt(640 * 640 / picInfo.width * picInfo.height))
            // 置为64的整数倍
            h = h % 64 < 32 ? h - h % 64 : h + 64 - h % 64
            w = w % 64 < 32 ? w - w % 64 : w + 64 - w % 64

            txtparam.param.width = w
            txtparam.param.height = h
        }

        // 汇总参数
        let paramdata = {
            param: {
                ...txtparam.param,
                base64: picInfo ? picInfo.base64 : null,
            },
            num: txtparam.num,
            rawtag: txtparam.rawtag,
            specifyAPI: txtparam.specifyAPI,
            user: Number(e.user_id),
            code: 0,
            JH: gpolicy.JH,
            message: ""
        }

        return paramdata
    }


    /**
     * 提取命令中的绘图参数
     * @param {string} msg 绘图命令
     * @return {*}  txtparam 绘图参数
     */
    async parsetxt(msg) {
        const samplerList = ['Euler a', 'Euler', 'LMS', 'Heun', 'DPM2', 'DPM2 a', 'DPM fast', 'DPM adaptive', 'LMS Karras', 'DPM2 Karras', 'DPM2 a Karras', 'DDIM', 'PLMS']
        let sampler = ""

        // 张数
        let num = /(\d{1,5})张/.exec(msg) ? /(\d{1,5})张/.exec(msg)[1] : 1;
        num = num || 1

        // 取samper
        for (let val of samplerList)
            if (msg.includes(val)) {
                sampler = val
                msg = msg.replace(sampler, "")
            }

        // 置换预设词
        msg = await this.dealpreset(msg)

        // 取参数
        let reg = {
            Landscape: /(横图|(&shape=)?Landscape)/i,
            Square: /(方图|(&shape=)?Square)/i,
            steps: /(步数|&?steps=)(\d{1,2})/i,
            scale: /(自由度|&?scale=)((\d{1,2})(.(\d{1,5}))?)/i,
            seed: /(种子|&?seed=)(\d{1,10})/i,
            strength: /(强度|&?strength=)(0.(\d{1,5}))/i,
            specifyAPI: /接口(\d{1,2})/,
        }
        let shape = reg.Landscape.test(msg) ? "Landscape" : reg.Square.test(msg) ? "Square" : "";
        let steps = reg.steps.test(msg) ? reg.steps.exec(msg)[2] : NaN;
        let scale = reg.scale.test(msg) ? reg.scale.exec(msg)[2] : NaN;
        let strength = reg.strength.test(msg) ? reg.strength.exec(msg)[2] : NaN;
        let seed = reg.seed.test(msg) ? reg.seed.exec(msg)[2] : num <= 1 ? `${Math.floor(Math.random() * 2147483647)}` : NaN;
        let specifyAPI = reg.specifyAPI.test(msg) ? reg.specifyAPI.exec(msg)[1] : NaN;
        seed = Number(seed)
        if (seed > 2147483647) seed %= 2000000000;

        // 移除命令中的自定义参数
        msg = msg
            .replace(/^(＃|#)?绘图/, "")
            .replace(/(\d{1,5})张/g, "")
            .replace(/(竖图|横图|方图|(&shape=)?Landscape|(&shape=)?Square)/gi, "")
            .replace(reg.scale, "")
            .replace(reg.seed, "")
            .replace(reg.strength, "")
            .replace(reg.steps, "")
            .replace(reg.specifyAPI, "")

        // 处理特殊字符==========
        msg = msg
            .replace(/｛/g, "{")
            .replace(/｝/g, "}")
            .replace(/（/g, "(")
            .replace(/）/g, ")")
            .replace(/。/g, ".")
            .replace("==>", "")
            .replace(/#|＃|\/|\\/g, "")
            .replace(/, ,|,,/g, ",")
            .replace(
                /[\u3002\uff1f\uff01\uff0c\u3001\uff1b\uff1a\u201c\u201d\u2018\u2019\uff08\uff09\u300a\u300b\u3008\u3009\u3010\u3011\u300e\u300f\u300c\u300d\ufe43\ufe44\u3014\u3015\u2026\u2014\uff5e\ufe4f\uffe5]/g,
                ","
            )

        // // 翻译
        // msg = await translate(msg)

        // 取tag
        let ntgReg = /ntag(s?)( = |=|＝| ＝ )?(.*)/i
        let ntags = ntgReg.test(msg) ? ntgReg.exec(msg)[3].trim() : "";
        ntags = ntags.replace(/^(=|＝)/g, "").trim() || "默认"
        msg = msg.replace(/ntag(s?)( = |=|＝| ＝ )?(.*)/ig, "").trim()


        // 整合参数
        let txtparam = {
            param: {
                sampler: sampler || 'Euler a',
                strength: Number(strength) || 0.6,
                seed: seed || -1,
                scale: Number(scale) || 11,
                steps: Number(steps) || 40,
                width: shape == 'Landscape' ? 768 : shape == 'Square' ? 640 : 512,
                height: shape == 'Landscape' ? 512 : shape == 'Square' ? 640 : 768,
                tags: msg,
                ntags: ntags
            },
            num: Number(num),
            specifyAPI: Number(specifyAPI),
            rawtag: {
                tags: msg,
                ntags: ntags
            }
        }
        return txtparam
    }


    /**置换文本中的预设词
     * @param {string} msg 
     * @return {string} 置换后的msg
    */
    async dealpreset(msg) {
        const preSet = await Config.getpreSets()
        let matchedWords = ""; //匹配到的关键词
        let hasPreSet = false; //标记是否匹配到了关键词
        do {
            matchedWords = ""; //匹配到的关键词
            hasPreSet = false; //初始为false
            for (var key in preSet) {
                //便利预设词对象的key
                if (msg.includes(key) && key.length > matchedWords.length) {
                    //如果有预设词
                    hasPreSet = true; //就标记
                    matchedWords = key; //存一下匹配到的key
                }
            }
            if (matchedWords.length) {
                msg = msg.replace(matchedWords, `${preSet[matchedWords]},`);
            }
        } while (hasPreSet);
        return msg
    }


    /**翻译参数的中文
     * @param {object} paramdata
     * @return {object} paramdata
     */
    async transtag(paramdata) {
        let chReg = /(?:[\u3400-\u4DB5\u4E00-\u9FEA\uFA0E\uFA0F\uFA11\uFA13\uFA14\uFA1F\uFA21\uFA23\uFA24\uFA27-\uFA29]|[\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0])+/
        if (chReg.test(paramdata.param.tags))
            paramdata.param.tags = await translate(paramdata.param.tags)
        if (chReg.test(paramdata.param.ntags.replace('默认')))
            paramdata.param.ntags = await translate(paramdata.param.ntags)
        return paramdata
    }


    /**鉴定tags中的屏蔽词。返回提取到的屏蔽词和去除了屏蔽词之后的绘图参数
     * @param {object} paramdata
     * @return {Array} [prohibitedWords, paramdata]
     */
    async checkWords(paramdata) {
        let list = await Config.getProhibitedWords()

        let prohibitedWords = []
        for (let val of list) {
            var re = new RegExp(val, `i`);
            while (re.exec(paramdata.param.tags)) {
                prohibitedWords.push(re.exec(paramdata.param.tags)[0])
                paramdata.param.tags = await paramdata.param.tags.replace(re.exec(paramdata.param.tags)[0], "");
            }
            while (re.exec(paramdata.rawtag.tags)) {
                prohibitedWords.push(re.exec(paramdata.rawtag.tags)[0])
                paramdata.rawtag.tags = await paramdata.rawtag.tags.replace(re.exec(paramdata.rawtag.tags)[0], "");
            }
        }
        return [prohibitedWords, paramdata]
    }


}

export default new Parse()