/*
 * @Author: 渔火Arcadia  https://github.com/yhArcadia
 * @Date: 2022-12-22 15:04:19
 * @LastEditors: 渔火Arcadia
 * @LastEditTime: 2022-12-23 21:53:46
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\utils\pic_tools.js
 * @Description: 图片工具
 * 
 * Copyright (c) 2022 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved. 
 */
import sizeOf from "image-size"
import path from 'path';
import axios from "axios";
import moment from 'moment/moment.js';
import fetch from "node-fetch";
import fs from 'fs';
import { promisify } from "util";
import { pipeline } from "stream";
import plugin from '../../../lib/plugins/plugin.js'
import md5 from "md5";
import { bs64Size } from "./utils.js";
import * as cheerio from 'cheerio';
import FormData from 'form-data'
import QRCode from 'qrcode'


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
        if (param.startsWith('gchat.qpic.cn')) {
            param = `https://${param}`
        }
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
        if (isbs64 || param.startsWith('http'))
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
        Bot.pickUser(Bot.uin).sendMsg([segment.image(`base64://${base64}`), false, { recallMsg: 20 }]);
        let picinfo = await this.getPicInfo(base64, true)
        let md5 = picinfo.md5
        return `https://c2cpicdw.qpic.cn/offpic_new/0//0000000000-0000000000-${md5}/0?term=2`
    }



    /**用图片url直接获取base64
     * @author Su
     * @param {string} url 图片地址
     * @return {string} base64
     */
    async url_to_base64(url) {
        let img = await axios.get(url, {
            responseType: 'arraybuffer'
        });
        let base64 = Buffer.from(img.data, 'binary')
            .toString('base64');
        return base64
    }



    /**将文本转为二维码，返回二维码的base64或url
     * @param {string} text 要转换成二维码的文本
     * @param {boolean} isurl 是否返回url，默认false
     * @return {string} 二维码的base64或url
     */
    async text_to_qrcode(text, isurl = true) {
        let base64 = await QRCode.toDataURL(text)
        if (isurl)
            return base64
        else
            return this.base64_to_imgurl(base64)
    }

    /**将图片提交进QQ图床，返回图片url
     * @param {string} base64 图片的base64
     * @return {string} 图片url
     */
    async upload_image(base64) {
        return (await Bot.pickFriend(Bot.uin)._preprocess(segment.image(`base64://${base64}`))).imgs[0];
    }



    /**将图片提交进图床，返回图片url
     * @param {string} content 图片的二进制内容
     * @return {string} 图片url
     */
    async upload(content) {
        // 访问主页获取 token
        const response = await axios.get('https://postimages.org/');
        if (response.status !== 200) {
            return false;
        }
        const $ = cheerio.load(response.data);
        let token = $('input[name="token"]').val();
        if (!token) {
            // 获取 token 失败，启用备用方案，转为字符串，然后正则匹配
            token = response.data.toString().match(/"token","(.*?)"/)[1];
            if (!token)
                return false;
        }
        // 上传图片
        const form = new FormData();
        form.append('file', content, { filename: 'image.png' });
        form.append('token', token);
        form.append('upload_session', [...Array(32)].map(i => (~~(Math.random() * 36)).toString(36)).join(''));
        form.append('numfiles', 1);
        form.append('ui', JSON.stringify(['', '', '', true, '', '', new Date().toISOString()]));
        form.append('optsize', '');
        form.append('session_upload', Date.now());
        form.append('gallery', '');
        form.append('expire', 0);

        const config = {
            headers: {
                ...form.getHeaders(),
            },
        };

        const response2 = await axios.post('https://postimages.org/json/rr', form, config);
        if (response2.status !== 200) {
            return false;
        }
        const data = response2.data;
        const web_url = data.url;
        if (!web_url) {
            return '_set_error fail. cannot find image URL';
        }
        // 获取图片链接
        const response3 = await axios.get(web_url);
        if (response3.status !== 200) {
            return false;
        }
        const html = response3.data;
        const $2 = cheerio.load(html);
        const imageUrl = $2('meta[property="og:url"]').attr('content');
        if (!imageUrl) {
            return false;
        }
        return imageUrl;
    }
}

export default new Pictools
