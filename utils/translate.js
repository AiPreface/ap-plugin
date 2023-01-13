/*
 * @Author: 渔火Arcadia  https://github.com/yhArcadia
 * @Date: 2023-01-14 01:47:29
 * @LastEditors: 渔火Arcadia
 * @LastEditTime: 2023-01-14 02:15:54
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\utils\translate.js
 * @Description: 聚合翻译
 * 
 * Copyright (c) 2023 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved. 
 */


import fetch from 'node-fetch'
import crypto from 'crypto'



class Translate {

    /**聚合翻译
     * @param {string} text 原文
     * @return {string}  翻译
     */
    async t(text) {
        try {
            return await this.ovooa(text)
        } catch (err) {
            logger.error('【aiPainting】独角兽翻译报错：\n', err)
        }
        return '翻译接口寄了'
    }

    /**独角兽翻译
     * @param {string} text 待翻译文本 
     * @return {string} 翻译后的文本 
     */
    async ovooa(text) {
        let result = ''
        let res = await fetch(`http://ovooa.com/API/qqfy/api.php?msg=${encodeURI(text)}`)
        // Log.i(res)
        res = await res.text()
        // Log.i(res)
        // Log.i(/翻译内容：(.+)$/.exec(res))
        let en = /翻译内容：(.+)$/.exec(res)[1]
        // logger.warn(res);

        // res = await res.json()
        // result = res.data
        result = en.toLowerCase()
        return result
    }


    /**椰奶有道翻译 */
    async yenai_youdao(text) {
        // 翻译结果为空的提示
        const API_ERROR = "出了点小问题，待会再试试吧";
        const RESULT_ERROR = "找不到翻译结果";
        // API 请求错误提示
        const qs = (obj) => {
            let res = "";
            for (const [k, v] of Object.entries(obj))
                res += `${k}=${encodeURIComponent(v)}&`;
            return res.slice(0, res.length - 1);
        };
        const appVersion = "5.0 (Windows NT 10.0; Win64; x64) Chrome/98.0.4750.0";
        const payload = {
            from: "AUTO",
            to: "AUTO",
            bv: md5(appVersion),
            client: "fanyideskweb",
            doctype: "json",
            version: "2.1",
            keyfrom: "fanyi.web",
            action: "FY_BY_DEFAULT",
            smartresult: "dict"
        };
        const headers = {
            Host: "fanyi.youdao.com",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/98.0.4758.102",
            Referer: "https://fanyi.youdao.com/",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            Cookie: `OUTFOX_SEARCH_USER_ID_NCOO=133190305.98519628; OUTFOX_SEARCH_USER_ID="2081065877@10.169.0.102";`
        };
        const api = "https://fanyi.youdao.com/translate_o?smartresult=dict&smartresult=rule";
        const key = "Ygy_4c=r#e#4EX^NUGUc5";

        const i = text; // 翻译的内容
        const lts = "" + new Date().getTime();
        const salt = lts + parseInt(String(10 * Math.random()), 10);
        const sign = md5(payload.client + i + salt + key);
        const postData = qs(Object.assign({ i, lts, sign, salt }, payload))
        try {
            let { errorCode, translateResult } = await fetch(api, {
                method: "POST",
                body: postData,
                headers
            }).then(res => res.json()).catch(err => console.error(err));
            if (errorCode != 0) return API_ERROR;
            translateResult = lodash.flattenDeep(translateResult)?.map(item => item.tgt).join("\n");
            if (!translateResult) return RESULT_ERROR
            return translateResult
        } catch (e) {
            console.log(e);
            return API_ERROR
        }
    }



    async Translate(e) {
        let BDAPPID = `20200908000561381`
        let BDAPPKEY = `92mTwzOHsFgLgyCxu5mQ`
        let YDAPPID = `4523a49ea362ec0c`
        let YDAPPKEY = `TplRPttIx0dF65xqMBkITM0k9vh7YFUB`
        let msg = e.msg.replace(/^#(百度|有道)翻译/, '')
        let res = false
        if (e.msg.match(/^#百度翻译/)) {
            res = await BaiduTranslate(msg, BDAPPID, BDAPPKEY)
        } else if (e.msg.match(/^#有道翻译/)) {
            res = await YoudaoTranslate(msg, YDAPPID, YDAPPKEY)

        } else {
            return false
        }
        if (res) {
            e.reply(res)
        }
    }


    async BaiduTranslate(msg, BDAPPID, BDAPPKEY) {
        let TranslateAPI = `http://api.fanyi.baidu.com/api/trans/vip/translate`
        let salt = Math.random().toString(36).substr(2)
        let sign = crypto.createHash('md5').update(BDAPPID + msg + salt + BDAPPKEY).digest('hex')
        let url = `${TranslateAPI}?q=${msg}&from=zh&to=en&appid=${BDAPPID}&salt=${salt}&sign=${sign}`
        let res = await fetch(url)
        let json = await res.json()
        if (json.error_code) {
            return false
        } else {
            return json.trans_result[0].dst
        }
    }

    async YoudaoTranslate(msg, YDAPPID, YDAPPKEY) {
        let TranslateAPI = `https://openapi.youdao.com/api`;
        var len = msg.length;
        if (len > 20) {
            var input = msg.substring(0, 10) + len + msg.substring(len - 10, len);
        } else {
            var input = msg
        }
        var salt = (new Date).getTime();
        var curtime = Math.round(new Date().getTime() / 1000);
        let sign = crypto.createHash('sha256').update(YDAPPID + input + salt + curtime + YDAPPKEY).digest('hex');
        let url = `${TranslateAPI}?appKey=${YDAPPID}&q=${msg}&from=auto&to=en&salt=${salt}&sign=${sign}&signType=v3&curtime=${curtime}`
        let res = await fetch(url)
        let json = await res.json()
        return json.translation[0]
    }


}


export default new Translate()

