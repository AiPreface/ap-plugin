/*
 * @Author: 渔火Arcadia  https://github.com/yhArcadia
 * @Date: 2022-12-20 01:22:53
 * @LastEditors: 渔火Arcadia
 * @LastEditTime: 2022-12-24 16:53:01
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\components\ap\draw.js
 * @Description: 请求接口获取图片
 * 
 * Copyright (c) 2022 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved. 
 */
import Config from "./config.js";
import NsfwCheck from "./nsfwcheck.js"
import moment from "moment";
import YAML from 'yaml'
import path from 'path';
import fs from 'fs';
import fetch from "node-fetch";
import { bs64Size } from '../../utils/utils.js';
import Log from '../../utils/Log.js'
import process from "process";
import { Pictools } from "../../utils/utidx.js";
class Draw {

    /**获取一张图片。返回base64
     * @param {object} paramdata 绘图参数
     * @return {object}  
     */
    async get_a_pic(paramdata) {
        // 读取接口地址和接口备注
        let config = await Config.getcfg()
        if (config.APIList.length == 0)
            return {
                code: 41,
                info: "未配置接口",
                msg: '',
                description: `当前无可用绘图接口，请先配置接口。参考文档：https://www.wolai.com/k6qBiSdjzRmGZRk6cygNCk`
            }
        let index = paramdata.specifyAPI || config.usingAPI
        let apiobj = config.APIList[index - 1]
        let api = Object.keys(apiobj)[0]      //接口
        let remark = Object.values(apiobj)[0] //接口备注

        // 请求图片
        let response
        try {
            response = await this.requestPic(paramdata.param, api)
        } catch (err) {
            // 处理错误
            if (err.code == "ETIMEDOUT")
                return {
                    code: 11,
                    info: "访问超时",
                    msg: err.message,
                    description: `接口${index}:${remark} 访问失败，请尝试使用其他接口`
                }
            else if (err.code == "ECONNREFUSED")
                return {
                    code: 12,
                    info: "连接被拒绝",
                    msg: err.message,
                    description: `接口${index}:${remark} 连接被服务区拒绝：ECONNREFUSED，请检查端口号或接口是否配置正确、服务器防火墙是否放行了对应端口，或尝试使用其他接口`
                }
            else {
                let msg = {
                    code: 10,
                    info: "未知错位",
                    msg: err.message,
                    description: `接口${index}:${remark} 出现未知错误，请尝试使用其他接口。\n您可前往控制台查看错误日志，并反馈给开发者。`
                }
                Log.e('【err】：', err);
                Log.e('【报错信息】：', err.message);
                Log.e(msg)
                return msg
            }
        }


        // 处理错误
        if (response.status != 200) {
            if (response.status == 503)
                return {
                    code: response.status,
                    info: "服务不可用",
                    msg: response.statusText,
                    description: `接口${index}:${remark} 服务不可用，请尝试使用其他接口。`
                }
            else {
                let msg = {
                    code: response.status,
                    info: "未知错误",
                    msg: response.statusText,
                    description: `接口${index}:${remark} 出现未知错误，请尝试使用其他接口。\n您可前往控制台查看错误日志，并反馈给开发者。`
                }
                Log.w(response)
                Log.e('【err】：' + response.status + ":" + response.statusText)
                Log.e(msg)
                return msg
            }
        }


        // 提取base64
        let res = await response.json();
        // fs.writeFileSync(path.join(process.cwd(), 'resources/aptemp.json'), JSON.stringify(res, null, "\t"), "utf8");                  /*  */
        let base64 = res.images[0].toString().replace(/data:image\/png;|base64,/g, "");
        let resparam = res.parameters
        // 图片大小太小，判断为全黑故障图片
        let [b, imagesize, mb] = bs64Size(base64)
        if (imagesize < 10) {
            Log.w("图片损坏")
            return {
                code: 21,
                info: "黑图",
                msg: '',
                description: `图片损坏，请重试。`
            }
        }

        Log.m("图片获取成功")

        // 鉴黄
        let isnsfw = false
        if (paramdata.JH) {
            let jh = await NsfwCheck.check(base64)
            if (jh.message) {
                if (jh.message == "【aiPainting图片审核】本次百度图片审核超时")
                    return {
                        code: 32,
                        info: '百度图片审核超时',
                        msg: '',
                        description: jh.message
                    }
                else
                    return {
                        code: 31,
                        info: '鉴黄故障',
                        msg: '',
                        description: jh.message
                    }
            }
            isnsfw = jh.isnsfw
        }

        // 图片信息
        let picinfo = await Pictools.getPicInfo(base64, true)


        //下载图片
        this.downLoadPic(paramdata, resparam.seed, base64)

        return {
            code: 0,
            isnsfw: isnsfw,
            seed: resparam.seed,
            size: picinfo.size,
            md5: picinfo.md5,
            base64: base64
        }
    }


    /**请求绘图接口 
     * @param {object} param 绘图的参数
     * @param {string} api 接口地址
     * @return {object}  请求结果 response
     */
    async requestPic(param, api) {
        // Log.i(param)                                 /*  */
        let ntags = "nsfw, nsfw, (nsfw:1.4), nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry"
        if (param.ntags != "默认")
            ntags = param.ntags
        let seed = param.seed
        if (seed == -1) {
            seed = Math.floor(Math.random() * 2147483647)
        }
        Log.m("尝试获取一张图片，使用接口：", api)
        let data;
        // 文生图
        if (!param.base64) {
            data = {
                "enable_hr": false,
                "denoising_strength": 0,
                "firstphase_width": 0,
                "firstphase_height": 0,
                "styles": ["string"],
                // "subseed": -1,
                // "subseed_strength": 0,
                // "seed_resize_from_h": -1,
                // "seed_resize_from_w": -1,
                "batch_size": 1,
                "n_iter": 1,
                "restore_faces": false,
                "tiling": false,
                "eta": 0,
                "s_churn": 0,
                "s_tmax": 0,
                "s_tmin": 0,
                "s_noise": 1,
                "override_settings": {},
                "prompt": param.tags,
                "seed": seed,
                "steps": param.steps,
                "cfg_scale": param.scale,
                "height": param.height,
                "width": param.width,
                "negative_prompt": ntags,
                "sampler_index": param.sampler,
            }
        }
        // 图生图
        else {
            data = {
                "init_images": ['data:image/jpeg;base64,' + param.base64],
                "sampler_index": param.sampler,
                "denoising_strength": param.strength,
                "prompt": param.tags,
                "seed": seed,
                "steps": param.steps,
                "cfg_scale": param.scale,
                "width": param.width,
                "height": param.height,
                "negative_prompt": ntags,
                "styles": ["string"],
            }
        }

        let res = await fetch(api + `/sdapi/v1/${param.base64 ? "img" : "txt"}2img`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'authorization': 'Bearer'
            },
            body: JSON.stringify(data),
        })
        return res
    }

    /**下载图片
     * @param {object} paramdata 绘图参数
     * @param {string} base64 图片bs64
     * @return {*}
     */
    async downLoadPic(paramdata, seed, base64) {
        let param = paramdata.param
        let policy = await Config.getPolicy()
        if (!policy.isDownload || paramdata.message == "二次元的我") return false

        let currentTime = moment(new Date()).format("YYMMDD_HHmmss");
        let picname = `${currentTime}_${("Tags=" + param.tags + "&nTags=" + param.ntags).substring(0, 170).trim()}&seed=${seed}&user=${paramdata.user}.png`
        let picPath = path.join(process.cwd(), 'resources/yuhuo/aiPainting', picname);
        fs.writeFile(picPath, base64, "base64", (err) => { if (err) throw err });
    }
}

export default new Draw()
