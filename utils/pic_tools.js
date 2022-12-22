/*
 * @Author: 渔火Arcadia  https://github.com/yhArcadia
 * @Date: 2022-12-22 15:04:19
 * @LastEditors: 渔火Arcadia
 * @LastEditTime: 2022-12-22 17:15:44
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\utils\pic_tools.js
 * @Description: 图片工具
 * 
 * Copyright (c) 2022 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved. 
 */
import sizeOf from "image-size"
import path from 'path';
import moment from 'moment/moment.js';
import fs from 'fs';
import { promisify } from "util";
import { pipeline } from "stream";
import cfg from '../../../lib/config/config.js'
import { segment } from "oicq";
import plugin from '../../../lib/plugins/plugin.js'
import md5 from "md5";
import { bs64Size } from "./utils.js";

/**图片工具 */
class Pictools extends plugin {
    constructor() {
        super({
            name: "ap图片工具",
            dsc: "处理图片",
            rule: [],
        });
    }


    /**
     * 根据 图片的网络url 或 本地路径 获取图片信息
     * @param {string} param 图片网络url或本地路径
     * @param {boolean} isbs64 提供的参数是否是图片的base64，默认false
     * @return {object}  图片长宽，图片大小，图片md5，图片base64
     */
    async getPicInfo(param, isbs64 = false) {
        // 本地路径
        let tempPic = param
        if (isbs64 || param.startsWith('http')) {
            tempPic = path.join(process.cwd(), 'resources', `aiPainting_tempPic_${moment.now()}.png`);
            // 保存base64为图片
            if (isbs64) {
                fs.writeFileSync(tempPic, param, "base64", (err) => { if (err) throw err });
            }
            // 如果是网络url则先下载
            else {
                const response = await fetch(param);
                // 没获取到
                if (!response.ok)
                    return { ok: false }
                const streamPipeline = promisify(pipeline);
                await streamPipeline(response.body, fs.createWriteStream(tempPic));
            }
        }

        // 取图片bs64 
        let base64 = param
        if (!isbs64) {
            let bitMap = fs.readFileSync(tempPic);
            base64 = Buffer.from(bitMap, "binary").toString("base64");
        }

        // 取图片md5
        let imgmd5 = md5(fs.readFileSync(tempPic))
        imgmd5 = imgmd5.toUpperCase()

        // 取图片长宽
        let wh = sizeOf(tempPic)
        let height = wh.height;
        let width = wh.width;

        // 删除下载的临时图片
        if (isbs64 || url.startsWith('http'))
            fs.unlinkSync(tempPic)

        // 计算图片大小
        let [b, imgsize, mb] = bs64Size(base64, true, 1)

        return {
            ok: true,
            height: height,
            width: width,
            size: imgsize,
            md5: imgmd5,
            base64: base64
        }
    }


    /**将图片base64转换为基于QQ图床的url
     * @param {string} base64
     * @return {string} 图片url
     */
    async base64_to_imgurl(base64) {
        Bot.pickUser(cfg.qq).sendMsg([segment.image(`base64://${base64}`), false, { recallMsg: 20 }]);
        let picinfo = await this.getPicInfo(base64, true)
        let md5 = picinfo.md5
        return `https://gchat.qpic.cn/gchatpic_new/0/000000000-000000000-${md5}/0?term=3`
    }



    /**将文本转为二维码，返回二维码的base64或url
     * @param {string} text 要转换成二维码的文本
     * @param {boolean} isurl 是否返回url，默认false
     * @return {string} 二维码的base64或url
     */
    async text_to_qrcode(text, isurl = true) {



    }

}

export default new Pictools