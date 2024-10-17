/*
 * @Author: 渔火Arcadia  https://github.com/yhArcadia
 * @Date: 2022-12-20 23:54:08
 * @LastEditors: 渔火Arcadia
 * @LastEditTime: 2022-12-25 23:47:44
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\components\ap\nsfwcheck.js
 * @Description: 百度鉴黄服务
 * 
 * Copyright (c) 2022 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved. 
 */
import Config from "./config.js"
import { Pictools, Log } from "../../utils/utidx.js"
import { createRequire } from "module";
const apcfg = await Config.getcfg()
class NsfwCheck {
    constructor() {
        this.appid = apcfg.baidu_appid
        this.apikey = apcfg.baidu_apikey
        this.secretkey = apcfg.baidu_secretkey
    }


    /**使用图片的base64鉴黄
     * @param {string} base64
     * @return {*}
     */
    async check(base64) {
        // 未配置apikey
        if (this.appid == "" || this.apikey == '' || this.secretkey == "") {
            return {
                message: "百度图片审核服务调用失败，请先配置百度图片审核接口 \n\n您也可以发送“#ap全局设置审核关闭”以关闭图片审核功能，关闭后绘制的图片将直接发送，不再进行审核"
            }
        }
        // 鉴黄
        let res = await this.bdjh(this.appid, this.apikey, this.secretkey, base64)

        if (res.message) {
            return { message: res.message }
        }

        return {
            isnsfw: res.isnsfw,
            message: ''
        }
    }


    /**使用百度鉴黄服务对图片进行鉴黄
     * @param {number} appid 
     * @param {string} apikey
     * @param {string} secretkey
     * @param {string} pic 图片参数（base64 或 url 或 本地路径）
     * @param {number} type 图片参数的形式：0:base64； 1:图片url或本地路径；默认0
     * @return {object} 百度图片审核返回结果
    */
    async bdjh(appid, apikey, secretkey, pic, type = 0) {
        // 取图片base64
        let base64 = pic
        if (type) {
            let picinfo = await Pictools.getPicInfo(pic)
            if (!picinfo.ok)
                return {
                    message: '百度图片审核失败：获取图片信息失败'
                }
            base64 = picinfo.base64
        }
        // 鉴黄
        // 创建百度图像识别client
        try {
            const require = createRequire(import.meta.url);
            var AipContentCensorClient = require("baidu-aip-sdk").contentCensor;
            var baiduJianhuangClient = new AipContentCensorClient(appid, apikey, secretkey);
        } catch (err) {
            return {
                message: '百度图像审核服务调用失败，请确认你已安装所需依赖。依赖安装方法：在云崽根目录执行\npnpm add baidu-aip-sdk -w\n或\ncnpm i baidu-aip-sdk\n\n※注意，有部分用户反馈安装此依赖会掉其他依赖，请谨慎安装。\n如遇掉依赖，请按照控制台相关提醒依次重新安装依赖\n\n※若无需使用鉴黄功能，您也可以发送“ap全局设置鉴黄关闭”以停用鉴黄，绘制的图片将直接发送，不再审核。',
                err: err
            }
        }
        // 发起请求
        let data = {}
        try {
            data = await baiduJianhuangClient.imageCensorUserDefined(base64, "base64")
        } catch (err) {
            if (err.code == "ESOCKETTIMEDOUT")
                return { message: "【AP-Plugin图片审核】本次百度图片审核超时" }
            else if (err.code == "ENOENT")
                return { message: "【AP-Plugin图片审核】图片获取失败" }
            else {
                Log.e('【百度图片审核报错】:', err.message)
                Log.e('【百度图片审核报错】:', err)
                return { message: '【AP-Plugin图片审核】遇到未知错误，建议查看控制台报错，向开发者反馈' }
            }
        }
        // 处理结果
        if (data.error_code == 14) {
            return { message: "百度鉴黄服务调用失败，请先配置百度鉴黄接口 \n\n您也可以发送“ap全局设置鉴黄关闭”以关闭鉴黄功能" }
        } else if (data.error_code == 18) {
            return { message: "触发百度图像审核服务QPS限制。可能是请求频率过高，或你没有在百度云控制台开通“内容审核-图像”资源，或开通时间过短（小于15分钟）" }
        } else if (data.error_code == 216201 || data.conclusion == "审核失败") {
            return { message: "图片损坏，请重试" }
        }
        let result = {
            isnsfw: data.conclusionType == 1 ? false : true,
            message: '',
            data: data
        }
        // logger.info("【aiPainting鉴黄返回结果】", result);   /*                   */
        if (result.isnsfw) Log.w('图片不合规')
        else Log.m('图片合规')

        return result
    }
}
export default new NsfwCheck