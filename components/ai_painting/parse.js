/*
 * @Author: 渔火Arcadia  https://github.com/yhArcadia
 * @Date: 2022-12-19 12:02:16
 * @LastEditors: 苏沫柒 3146312184@qq.com
 * @LastEditTime: 2023-05-07 10:36:53
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\components\ai_painting\parse.js
 * @Description: 解析整合特定内容
 * 
 * Copyright (c) 2022 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved. 
 */
import Config from './config.js'
import { parseImg, chNum2Num, sleep } from '../../utils/utils.js'
import { Pictools } from '../../utils/utidx.js'
import Log from '../../utils/Log.js'
import Translate from '../../utils/translate.js'

class Parse {
    constructor() {
    }

    /**获取指定群的ap策略
     * @return {object} gpolicy：此群的ap策略
     */
    async parsecfg(e) {
        let policy = await Config.getPolicy()
        let gid = 'private'
        if (e.isGroup) {
            gid = String(e.group_id)
        }
        let gpolicy = {
            cd: policy.cd,
            localNum: policy.localNum,
            prohibitedUserList: policy.prohibitedUserList,
            apMaster: policy.apMaster,
            isTellMaster: policy.isTellMaster,
            enable: gid in policy.gp && "enable" in policy.gp[gid] ? policy.gp[gid].enable : policy.gp.global.enable,
            JH: gid in policy.gp && "JH" in policy.gp[gid] ? policy.gp[gid].JH : policy.gp.global.JH,
            gcd: gid in policy.gp && "gcd" in policy.gp[gid] ? policy.gp[gid].gcd : policy.gp.global.gcd,
            pcd: gid in policy.gp && "pcd" in policy.gp[gid] ? policy.gp[gid].pcd : policy.gp.global.pcd,
            isRecall: gid in policy.gp && "isRecall" in policy.gp[gid] ? policy.gp[gid].isRecall : policy.gp.global.isRecall,
            recallDelay: gid in policy.gp && "recallDelay" in policy.gp[gid] ? policy.gp[gid].recallDelay : policy.gp.global.recallDelay,
            isBan: gid in policy.gp && "isBan" in policy.gp[gid] ? policy.gp[gid].isBan : policy.gp.global.isBan,
            usageLimit: gid in policy.gp && "usageLimit" in policy.gp[gid] ? policy.gp[gid].usageLimit : policy.gp.global.usageLimit,
            isDownload: policy.isDownload,
            isAllowSearchLocalImg: policy.isAllowSearchLocalImg
        }
        return gpolicy
    }


    /**整合绘图所用参数
     * @return {object}  paramdata 整合的参数
     */
    async mergeParam(e) {
        // 取消息中的图片、at的头像、回复的图片，放入e.img 
        e = await parseImg(e)

        let gpolicy = await this.parsecfg(e)


        let picInfo = null
        // 存在图片时，取图片信息
        if (e.img) {
            picInfo = await Pictools.getPicInfo(e.img[0])
            // 若获取图片信息失败 
            if (!picInfo.ok) return { code: 1, msg: "获取图片信息失败" }
        }

        // 解析命令中的参数
        let txtparam = await this.parsetxt(e.msg)
        // 获取用户默认参数
        let paramcfg = await Config.getParse()
        let userparam = e.user_id in paramcfg ? paramcfg[e.user_id] : paramcfg.default
        // 对于没有出现的属性，使用默认值填充
        txtparam = this.complete_txtparam(userparam ,txtparam)
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
                mask: null,
                mask_blur: NaN,
                inpainting_mask_invert: NaN,
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
     * @param {boolean} is_check_preset 是否匹配和替换预设
     * @return {*}  txtparam 绘图参数
     */
    async parsetxt(msg, is_check_preset = true) {
        const samplerList = ['Euler a', 'Euler', 'PLMS', 'LMS Karras', 'LMS', 'Heun', 'DPM fast', 'DPM adaptive', 'DPM2 Karras', 'DPM2 a Karras', 'DPM2 a', 'DPM2', 'DDIM', 'DPM++ 2S a Karras', 'DPM++ 2S a', 'DPM++ 2M Karras', 'DPM++ 2M', 'DPM++ SDE Karras', 'DPM++ SDE', 'UniPC'];

        let sampler = ""

        msg = chNum2Num(msg, { r_text: '张' })
        // 张数
        let num = /(\d{1,5})张/.exec(msg) ? /(\d{1,5})张/.exec(msg)[1] : 1;
        num = num || 1

        // 取samper
        for (let val of samplerList)
            if (msg.includes(val)) {
                sampler = val
                msg = msg.replace(sampler, "")
            }

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


        // 取tag和ntag
        let ntgReg = /ntag(s?)( = |=|＝| ＝ )?(.*)/i
        let rawnt = ntgReg.test(msg) ? ntgReg.exec(msg)[3].trim() : "";
        rawnt = rawnt.replace(/^(=|＝)/g, "").trim()
        let rawt = msg.replace(/ntag(s?)( = |=|＝| ＝ )?(.*)/ig, "").trim()

        // 置换预设词       /* 预设中提取的参数优先级应当低于命令中的参数 */
        let tags = rawt
        let ntags = rawnt
        let param = {}
        if (is_check_preset) {
            let tres = await this.dealpreset(rawt, rawnt)
            tags = tres.tags
            ntags = tres.ntags
            param = tres.param
        }

        let pt_reg = /(【.+?】|<[^<>]+?>)/
        let pt = []
        let npt = []
        while (pt_reg.test(tags)) {
            let check_pt = pt_reg.exec(tags)
            let pt_content = check_pt[0].replace(/^【|】$|<|>$/g, '').trim()
            if (check_pt[0].startsWith('【')) {
                pt.push(pt_content)
            } else {
                pt.push(`<${pt_content}>`)
            }
            tags = tags.replace(check_pt[0], '')
        }
        while (pt_reg.test(ntags)) {
            let check_pt = pt_reg.exec(ntags)
            let pt_content = check_pt[0].replace(/^【|】$|<|>$/g, '').trim()
            if (check_pt[0].startsWith('【')) {
                npt.push(pt_content)
            } else {
                npt.push(`<${pt_content}>`)
            }
            ntags = ntags.replace(check_pt[0], '')
        }
        // Log.i(pt)
        // Log.i(npt)
        // Log.i(tags)
        // Log.i(ntags)


        if ('scale' in param) scale = scale || param.scale
        if ('sampler' in param) sampler = sampler || param.sampler


        // 处理特殊字符==========
        tags = this.replacespc(tags)
        ntags = this.replacespc(ntags)
        // Log.i(tags)
        // Log.i(ntags)
        // 整合参数
        let txtparam = {
            param: {
                sampler: sampler,
                strength: Number(strength),
                seed: seed,
                scale: Number(scale),
                steps: Number(steps),
                width: shape == 'Landscape' ? 768 : shape == 'Square' ? 640 : NaN,
                height: shape == 'Landscape' ? 512 : shape == 'Square' ? 640 : NaN,
                tags: tags.trim(),
                ntags: ntags.trim(),
                pt: pt,
                npt: npt,
            },
            num: Number(num),
            specifyAPI: Number(specifyAPI),
            rawtag: {
                tags: tags.trim(),
                ntags: ntags.trim()
            }
        }
        return txtparam
    }
    /** 对于没有出现的属性，使用默认值填充 */
    complete_txtparam(userparam, txtparam) {
        txtparam.param.sampler = txtparam.param.sampler || userparam.sampler
        txtparam.param.strength = txtparam.param.strength || userparam.strength
        txtparam.param.seed = txtparam.param.seed || -1
        txtparam.param.scale = txtparam.param.scale || userparam.scale
        txtparam.param.steps = txtparam.param.steps || userparam.steps
        txtparam.param.width = userparam.width
        txtparam.param.height = userparam.height
        txtparam.param.enable_hr = userparam.enable_hr
        txtparam.param.hr_upscaler = userparam.hr_upscaler
        txtparam.param.hr_second_pass_steps = userparam.hr_second_pass_steps
        txtparam.param.hr_scale = userparam.hr_scale
        return txtparam
    }


    /**处理文本中的特殊字符
     * @param {string} text
     * @return {string}
     */
    replacespc(text) {
        return text
            .replace(/｛/g, "{")
            .replace(/｝/g, "}")
            .replace(/（/g, "(")
            .replace(/）/g, ")")
            .replace(/。/g, ".")
            .replace("==>", "")
            .replace(/#|＃|\/|\\/g, "")
            .replace(
                /[\u3002\uff1f\uff01\uff0c\u3001\uff1b\uff1a\u201c\u201d\u2018\u2019\uff08\uff09\u300a\u300b\u3008\u3009\u3010\u3011\u300e\u300f\u300c\u300d\ufe43\ufe44\u3014\u3015\u2026\u2014\uff5e\ufe4f\uffe5]/g,
                ","
            )
            .replace(/,{2,10}/g, ",")
            .replace(/,[ ],/g, ",")
            .replace(/^,+/, "")
            .replace(/,+$/, "")
    }


    /**置换文本中的预设词
     * @param {string} rawt
     * @param {string} rawnt
     * @return {object} 置换后的{ tags: tags, ntags: ntags，param: {}}
    */
    async dealpreset(rawt, rawnt) {
        // return { tags: rawt, ntags: rawnt }
        let tags = rawt
        let ntags = rawnt
        const preSet = await Config.getPresets()

        let matchedWord = ""; //匹配到的关键词
        let matchedPst = {}; //匹配到的一条预设
        let matchedWord_n = ""; //匹配到的关键词
        let matchedPst_n = {}; //匹配到的一条预设 
        let param = {}
        do {
            matchedWord = "";
            matchedPst = {}
            matchedWord_n = "";
            matchedPst_n = {}

            //便利预设词对象的key
            for (let val of preSet) {
                for (let key of val.keywords) {
                    // 如果预设key在正面tag中
                    if (rawt.includes(key) && key.length > matchedWord.length) {
                        // let regexp = new RegExp(`【\[\^【】\]\*${key}\[\^【】\]\*】`) // ==>  /【[^【】]*key[^【】]*】/   表示key两侧有【】
                        // if (regexp.test(rawt)) {
                        //     continue
                        // }
                        matchedPst = val
                        matchedWord = key; //存一下匹配到的key
                    }
                    // 如果预设key在负面tag中
                    else if (rawnt.includes(key) && key.length > matchedWord_n.length) {
                        // let regexp = new RegExp(`【\[\^【】\]\*${key}\[\^【】\]\*】`) // ==>  /【[^【】]*key[^【】]*】/   表示key两侧有【】
                        // if (regexp.test(rawnt)) {
                        //     continue
                        // }
                        matchedPst_n = val
                        matchedWord_n = key; //存一下匹配到的key
                    }
                }
            }
            // key在正面tag中，正面tag替换，负面tag加在尾部
            if (matchedWord.length) {
                rawt = rawt.replace(matchedWord, "")
                tags = tags.replace(matchedWord, matchedPst.tags ? `,${matchedPst.tags},` : '');
                ntags = matchedPst.ntags ? (ntags.replace('默认', "") + ',' + matchedPst.ntags) : ntags
                param = matchedPst.param
                // key在负面tag中，负面tag替换，正面ttag加在尾部
            } else if (matchedWord_n.length) {
                rawnt = rawnt.replace(matchedWord_n, "")
                tags = tags + matchedPst_n.tags ? `,${matchedPst_n.tags}` : ''
                ntags = ntags.replace(matchedWord_n, matchedPst_n.ntags ? `,${matchedPst_n.ntags},` : '');
                param = matchedPst.param
            }
        } while (matchedWord.length || matchedWord_n.length);

        return { tags: tags, ntags: ntags, param: param }
    }


    /**翻译参数的中文
     * @param {object} paramdata
     * @return {object} paramdata
     */
    async transtag(paramdata) {
        paramdata.param.tags = await this.trans(paramdata.param.tags)
        paramdata.param.ntags = await this.trans(paramdata.param.ntags)
        return paramdata
    }
    async trans(tg) {
        let chReg = /([\u3400-\u4DB5\u4E00-\u9FEA\uFA0E\uFA0F\uFA11\uFA13\uFA14\uFA1F\uFA21\uFA23\uFA24\uFA27-\uFA29]|[\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0])+/g
        // let CH_list = [...Object.values(tg.match(chReg))]
        let CH_list = tg.match(chReg)
        if (!CH_list || CH_list.length == 0) { return tg }
        for (let i = 0; i < CH_list.length; i++) {
            // if (i) { await sleep(1500) }
            let en = await Translate.t(CH_list[i])
            tg = tg.replace(CH_list[i], en.toLowerCase())
            // Log.i(CH_list[i], ' ==> ', en)
        }
        return tg
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
        prohibitedWords = [...new Set(prohibitedWords)] // 去重
        return [prohibitedWords, paramdata]
    }


}

export default new Parse()