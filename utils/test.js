/*
 * @Author: 渔火Arcadia  https://github.com/yhArcadia
 * @Date: 2022-12-20 00:16:35
 * @LastEditors: 渔火Arcadia
 * @LastEditTime: 2022-12-22 23:53:31
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

// Policy.banUser(66666)

let bs64 = 'dgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyjdgztrxhdrtyjhndtyjtyj'
// console.log(bs64Size(bs64, false, 3));

// Pictools.base64_to_imgurl(bs64)
let presets = await YAML.parse(
    fs.readFileSync(path.join(process.cwd(), 'plugins/ap-plugin/config/config/preset.yaml'), "utf8")
);
// console.log(presets);
let newpst = []
for (let key in presets) {
    console.log(key)
    let value = presets[key]
    let scale = /(自由度|&?scale=)((\d{1,2})(.(\d{1,5}))?)/i.test(value) ? /(自由度|&?scale=)((\d{1,2})(.(\d{1,5}))?)/i.exec(value)[2] : NaN
    value = value.replace(/(自由度|&?scale=)((\d{1,2})(.(\d{1,5}))?)/i, "")
    let txtparam = await Parse.parsetxt(value)
    let param = {}
    if (scale) param = { scale: scale }
    let pst = {
        "keywords": [key],
        "pt": "",
        "param": param,
        "tags": txtparam.param.tags,
        "ntags": txtparam.param.ntags == "默认" ? "" : txtparam.param.ntags
    }
    newpst.push(pst)
}
fs.writeFileSync(path.join(process.cwd(), 'plugins/ap-plugin/config/config/preset.json'), JSON.stringify(newpst, null, "\t"), "utf8");


