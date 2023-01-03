/*
 * @Author: 渔火Arcadia  https://github.com/yhArcadia
 * @Date: 2022-12-20 00:16:35
 * @LastEditors: 渔火Arcadia
 * @LastEditTime: 2023-01-03 22:02:32
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\utils\test.js
 * @Description: 测试模块
 * 
 * Copyright (c) 2022 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved. 
 */
import { Parse, Policy } from '../components/apidx.js'
import { bs64Size } from './utils.js'
import Pictools from "./pic_tools.js"
import YAML from "yaml"
import fs from 'fs'
import path from 'path'
import { getdsc } from '../components/anime_me/getdes.js'
import { isEqual, chNum2Num } from './utils.js'

// console.log(await Pictools.url_to_base64('https://gchat.qpic.cn/gchatpic_new/1761869682/637615159-2678354508-E361F9DF207F178A532955E0677414AB/0'))

// Policy.banUser(66666)

// let bs64 = 'dgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyj'
// console.log(bs64Size(bs64, false, 3));

// Pictools.base64_to_imgurl(bs64)

// let presets = await YAML.parse(
//     fs.readFileSync(path.join(process.cwd(), 'plugins/ap-plugin/config/config/preset.yaml'), "utf8")
// );
// let newpst = []
// for (let key in presets) {
//     console.log(key)
//     let value = presets[key]
//     let scale = /(自由度|&?scale=)((\d{1,2})(.(\d{1,5}))?)/i.test(value) ? /(自由度|&?scale=)((\d{1,2})(.(\d{1,5}))?)/i.exec(value)[2] : NaN
//     value = value.replace(/(自由度|&?scale=)((\d{1,2})(.(\d{1,5}))?)/i, "")
//     let txtparam = await Parse.parsetxt(value)
//     let param = {}
//     if (scale) param = { scale: scale }
//     let pst = {
//         "keywords": [key],
//         "pt": "",
//         "param": param,
//         "tags": txtparam.param.tags,
//         "ntags": txtparam.param.ntags == "默认" ? "" : txtparam.param.ntags
//     }
//     newpst.push(pst)
// }
// fs.writeFileSync(path.join(process.cwd(), 'plugins/ap-plugin/config/config/preset.json'), JSON.stringify(newpst, null, "\t"), "utf8");
// console.log(chNum2Num('非人非第十八页aa','第(\[一二三四五六七八九十零百千万亿\]\+)页'))
// console.log(chNum2Num('打发十六第十八页aa', { l_text: '第' }))