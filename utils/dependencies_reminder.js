/*
 * @Author: 渔火Arcadia  https://github.com/yhArcadia
 * @Date: 2022-12-26 14:14:46
 * @LastEditors: 苏沫柒 3146312184@qq.com
 * @LastEditTime: 2023-03-11 03:20:52
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\utils\dependencies_reminder.js
 * @Description: 缺少依赖时的提醒
 * 
 * Copyright (c) 2022 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved. 
 */
import cfg from '../../../lib/config/config.js'
import fs from 'node:fs'
let packageList = JSON.parse(fs.readFileSync("./plugins/ap-plugin/package.json")).dependencies
export const needPackage = [...Object.keys(packageList)]
let list = []
export async function checkPackage() {
    for (let pkgName of needPackage) {
        try {
            await import(pkgName)
        } catch (e) {
            list.push(pkgName)
            logger.error(`🟨缺少依赖：${pkgName}`)
        }
    }
    if (list.length > 0) {
        packageTips()
    }
    return true
}

export function packageTips(e) {
    Bot.pickUser(cfg.masterQQ[0]).sendMsg(`[AP-Plugin自检]发现缺少依赖：${list.join('/')}，将会导致部分功能无法使用，请使用【#ap安装依赖】进行一键安装`)
}