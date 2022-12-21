/*
 * @Author: 渔火Arcadia  https://github.com/yhArcadia
 * @Date: 2022-12-19 12:56:44
 * @LastEditors: 渔火Arcadia
 * @LastEditTime: 2022-12-22 01:03:26
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\utils\utils.js
 * @Description: 一些实用小工具
 * 
 * Copyright (c) 2022 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved. 
 */
import gsCfg from "../../genshin/model/gsCfg.js";
import path from 'path';
import moment from 'moment/moment.js';
import fs from 'fs'
import sizeOf from 'image-size'
import fetch from 'node-fetch';
import { promisify } from "util";
import { pipeline } from "stream";


/**
 * 处理消息中的图片：当消息引用了图片，或者消息有@对象，则将对应图片放入e.img 
 * @param {*} e OICQ事件参数e
 * @return {*} 处理过后的e
 */
export async function parseImg(e) {
    if (e.at && !e.source) {
        e.img = [`https://q1.qlogo.cn/g?b=qq&s=0&nk=${e.at}`];
    }
    if (e.source) {
        let reply;
        if (e.isGroup) {
            reply = (await e.group.getChatHistory(e.source.seq, 1)).pop()?.message;
        } else {
            reply = (await e.friend.getChatHistory(e.source.time, 1)).pop()
                ?.message;
        }
        if (reply) {
            for (let val of reply) {
                if (val.type == "image") {
                    e.img = [val.url];
                    break;
                }
            }
        }
    }
    return e
}


/**
 * 根据 图片的网络url 或 本地路径 获取图片信息
 * @param {string} url 图片网络url或本地路径
 * @return {object}  图片长宽，图片大小，图片base64
 */
export async function getPicInfo(url) {
    // 本地路径
    let tempPic = url
    // 如果是网络url则先下载
    if (url.startsWith('http')) {
        const response = await fetch(url);
        // 没获取到
        if (!response.ok)
            return { ok: false }

        // 下载临时图片
        const streamPipeline = promisify(pipeline);
        tempPic = path.join(process.cwd(), 'resources', `aiPainting_tempPic_${moment.now()}.png`);
        await streamPipeline(response.body, fs.createWriteStream(tempPic));
    }

    // 取图片bs64 
    let bitMap = fs.readFileSync(tempPic);
    let base64 = Buffer.from(bitMap, "binary").toString("base64");

    // 取图片长宽
    let wh = sizeOf(tempPic)
    let height = wh.height;
    let width = wh.width;

    // 删除下载的临时图片
    if (url.startsWith('http'))
        fs.unlinkSync(tempPic)

    // 计算图片大小
    let [b, imgsize, mb] = bs64Size(base64, true, 1)

    return {
        ok: true,
        height: height,
        width: width,
        size: imgsize,
        base64: base64
    }
}


/**获取base64的大小 返回一个数组，依次是[b,kb,mb]；
 * @param {string} base64 
 * @param {boolean} isunit 是否带单位，默认false
 * @param {number} tofix 保留小数的位数,默认两位
 * @return {array}
 */
export function bs64Size(base64, isunit = false, tofix = 2) {
    let strLength = base64.length;
    let b = parseInt(strLength - (strLength / 8) * 2);
    let size = [
        b,
        b / 1000,
        b / 1000 / 1000
    ]
    size.forEach((value, index) => size[index] = Number(value.toFixed(tofix)))
    if (isunit)
        size.forEach((value, index) => size[index] = value + (index == 0 ? "b" : index == 1 ? 'kb' : 'mb'))
    return size
}



/**
 * 通过角色别名获取角色原名
 * @param {string} name 角色别称
 * @return {string} 角色原名
 * @return null：未匹配到角色名
 */
export async function getgsName(name) {
    let nameArr = Runtime.gsCfg.getAllAbbr()
    for (let rolename of Object.values(nameArr))
        if (rolename.includes(name))
            return rolename[0]
    return null
}


/**
 * 获取指定用户的昵称。
 * 优先返回其在群内的名片，其次返回其QQ昵称，二者都空时返回QQ号
 * @param  e oicq传递的事件参数e
 * @param qq  指定的QQ号
 * @return {string} 获取到的昵称
 */
export async function getuserName(e, qq = null) {
    qq = qq || e.user_id
    qq = Number(qq)
    if (e && e.isGroup) {
        try {
            let member = await Bot.getGroupMemberInfo(e.group_id, qq);
            if (member != undefined) {
                let name = member.card || member.nickname || qq;
                return String(name)
            }
        } catch (err) {
            logger.error("[getuserName]", err);
        }
    }
    let user = await Bot.pickUser(qq).getSimpleInfo();
    return String(user.nickname || qq);
}


/**翻译
 * @param {string} txt 待翻译文本
 * @param {string} param 可选参数
 * @return {string} 
 */
export async function translate(txt, param = null) {
    param = 'zh2en'
    let result = ''
    try {
        let res = await fetch(`http://www.iinside.cn:7001/api_req?reqmode=nmt_mt5_jez&password=3652&text=${encodeURI(txt)}&order=${param}`)
        // logger.warn(res);

        res = await res.json()
        result = res.data
    } catch (err) {
        logger.error('【aiPainting】翻译报错：\n', err)
        result = "寄"
    }
    return result
}

/**快捷log  */
class Log {
    /**快捷执行logger.info( )  */
    i(...msg) { logger.info('【aiPainting】', ...msg); }
    /**快捷执行logger.mark( ) */
    m(...msg) { logger.mark('【aiPainting】', ...msg); }
    /**快捷执行logger.warn( ) */
    w(...msg) { logger.warn('【aiPainting】', ...msg); }
    /**快捷执行logger.error( ) */
    e(...msg) { logger.error('【aiPainting】', ...msg); }
}

export default new Log