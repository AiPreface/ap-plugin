/*
 * @Author: 渔火Arcadia  https://github.com/yhArcadia
 * @Date: 2022-12-26 14:14:46
 * @LastEditors: 渔火Arcadia
 * @LastEditTime: 2022-12-26 14:25:03
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\utils\dependencies_reminder.js
 * @Description: 缺少依赖时的提醒
 * 
 * Copyright (c) 2022 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved. 
 */
import chalk from 'chalk'
export const needPackage = [
    'axios',
    'image-size',
]

export async function checkPackage() {
    for (let pkgName of needPackage) {
        try {
            await import(pkgName)
        } catch (e) {
            packageTips(e)
            return false
        }
    }
    return true
}

export function packageTips(error) {
    logger.mark('---- ap-plugin载入失败 ----')
    let pack = error.stack.match(/'(.+?)'/g)[0].replace(/'/g, '')
    logger.mark(`缺少依赖：${chalk.red(pack)}`)
    let cmd = 'pnpm add $s -w'
    logger.mark(`请执行安装依赖命令：${chalk.red(cmd.replace('$s', pack))}`)
    logger.mark('---------------------------')
}