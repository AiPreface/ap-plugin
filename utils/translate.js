/*
 * @Author: 渔火Arcadia  https://github.com/yhArcadia
 * @Date: 2023-01-14 01:47:29
 * @LastEditors: 苏沫柒 3146312184@qq.com
 * @LastEditTime: 2023-04-07 20:09:56
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\utils\translate.js
 * @Description: 聚合翻译
 *
 * Copyright (c) 2023 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved.
 */

import fetch from "node-fetch";
import crypto from "crypto";
import Log from "./Log.js";
import config from "../components/ai_painting/config.js";
import md5 from "md5";
import lodash from "lodash";
import { sleep } from "./utils.js";
import axios from "axios";

let apcfg = await config.getcfg();
const BAIDU = apcfg.baidu_translate;
const YOUDAO = apcfg.youdao_translate;

class Translate {
  /**聚合翻译
   * @param {string} text 原文
   * @return {string}  翻译
   */
  async t(text) {
    // 优先百度
    if (BAIDU.id && BAIDU.key) {
      try {
        let result = await this.BaiduTranslate(text, BAIDU.id, BAIDU.key);
        if (result) {
          Log.i("[百度翻译] ", text, " ==> ", result);
          return result;
        }
      } catch (err) {
        Log.e("【百度翻译报错】:", err);
      }
    }

    // 有道
    if (YOUDAO.id && YOUDAO.key) {
      try {
        let result = await this.YoudaoTranslate(text, YOUDAO.id, YOUDAO.key);
        if (result) {
          Log.i("[有道翻译] ", text, " ==> ", result);
          return result;
        }
      } catch (err) {
        Log.e("【有道翻译报错】:", err);
      }
    }

    // 椰奶有道
    try {
      let result = await this.yenai_youdao(text);
      if (result) {
        Log.i("[椰奶有道翻译] ", text, " ==> ", result);
        await sleep(1000);
        return result;
      }
    } catch (err) {
      Log.e("【椰奶有道翻译报错】:", err);
    }

    // Google
    try {
      let result = await this.googleTran(text);
      if (result) {
        Log.i("[Google翻译] ", text, " ==> ", result);
        await sleep(1000);
        return result;
      }
    } catch (err) {
      Log.e("【Google翻译报错】:", err);
    }

    return false;
  }

  /**Google翻译
   * @param {string} text 待翻译文本
   * @return {string} 翻译后的文本
   */
  async googleTran(text) {
    try {
      let resp = await axios({
        method: "POST",
        url: "https://mikeee-gradio-gtr.hf.space/api/predict",
        data: {
          data: [text, "zh", "en"],
        },
      });
      return resp.data.data[0];
    } catch (err) {
      Log.e("【Google翻译报错】:", err);
      return false;
    }
  }

  /**椰奶有道翻译 */
  async yenai_youdao(text) {
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
      smartresult: "dict",
    };
    const headers = {
      Host: "fanyi.youdao.com",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/98.0.4758.102",
      Referer: "https://fanyi.youdao.com/",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Cookie: `OUTFOX_SEARCH_USER_ID_NCOO=133190305.98519628; OUTFOX_SEARCH_USER_ID="2081065877@10.169.0.102";`,
    };
    const api =
      "https://fanyi.youdao.com/translate_o?smartresult=dict&smartresult=rule";
    const key = "Ygy_4c=r#e#4EX^NUGUc5";

    const i = text; // 翻译的内容
    const lts = "" + new Date().getTime();
    const salt = lts + parseInt(String(10 * Math.random()), 10);
    const sign = md5(payload.client + i + salt + key);
    const postData = qs(Object.assign({ i, lts, sign, salt }, payload));
    try {
      let { errorCode, translateResult } = await fetch(api, {
        method: "POST",
        body: postData,
        headers,
      })
        .then((res) => res.json())
        .catch((err) => Log.e(err));
      if (errorCode != 0) return false;
      translateResult = lodash
        .flattenDeep(translateResult)
        ?.map((item) => item.tgt)
        .join("\n");
      if (!translateResult) return false;
      // Log.i(translateResult)
      return translateResult;
    } catch (e) {
      Log.e("【椰奶有道翻译报错】:", e);
      return false;
    }
  }

  /**百度翻译
   * @param {string} msg 待翻译文本
   * @param {string} BDAPPID 百度翻译appid
   * @param {string} BDAPPKEY 百度翻译key
   * @return {string}
   */
  async BaiduTranslate(msg, BDAPPID, BDAPPKEY) {
    let TranslateAPI = `http://api.fanyi.baidu.com/api/trans/vip/translate`;
    let salt = Math.random().toString(36).substr(2);
    let sign = crypto
      .createHash("md5")
      .update(BDAPPID + msg + salt + BDAPPKEY)
      .digest("hex");
    let url = `${TranslateAPI}?q=${msg}&from=zh&to=en&appid=${BDAPPID}&salt=${salt}&sign=${sign}`;
    let res = await fetch(url);
    let json = await res.json();
    try {
      if (json.error_code) {
        Log.i("【百度翻译报错】:", json);
        return false;
      }
      return json.trans_result[0].dst;
    } catch (err) {
      Log.e("【百度翻译报错】:", err);
      return false;
    }
  }

  /**有道翻译
   * @param {string} msg 待翻译文本
   * @param {string} YDAPPID 有道翻译appid
   * @param {string} YDAPPKEY 有道翻译key
   * @return {string}
   */
  async YoudaoTranslate(msg, YDAPPID, YDAPPKEY) {
    let TranslateAPI = `https://openapi.youdao.com/api`;
    var len = msg.length;
    if (len > 20) {
      var input = msg.substring(0, 10) + len + msg.substring(len - 10, len);
    } else {
      var input = msg;
    }
    var salt = new Date().getTime();
    var curtime = Math.round(new Date().getTime() / 1000);
    let sign = crypto
      .createHash("sha256")
      .update(YDAPPID + input + salt + curtime + YDAPPKEY)
      .digest("hex");
    let url = `${TranslateAPI}?appKey=${YDAPPID}&q=${msg}&from=auto&to=en&salt=${salt}&sign=${sign}&signType=v3&curtime=${curtime}`;
    let res = await fetch(url);
    let json = await res.json();
    // Log.i(json)                    /*  */
    try {
      if (json.errorCode != 0) {
        Log.i("【有道翻译报错】:", json);
        return false;
      }
      return json.translation[0];
    } catch (err) {
      Log.e("【有道翻译报错】:", err);
      return false;
    }
  }
}

export default new Translate();
