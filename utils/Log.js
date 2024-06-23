/*
 * @Author: 渔火Arcadia  https://github.com/yhArcadia
 * @Date: 2022-12-22 14:54:18
 * @LastEditors: 苏沫柒 3146312184@qq.com
 * @LastEditTime: 2023-05-03 16:29:55
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\utils\Log.js
 * @Description: 快捷logger 
 * Copyright (c) 2022 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved. 
 */

import fs from 'fs'
import { pluginRoot } from '../model/path.js'
let currentVersion
const package_path = `${pluginRoot}/package.json`
try {
    const package_json = JSON.parse(fs.readFileSync(package_path, 'utf-8'))
    if (package_json.version) {
        currentVersion = package_json.version
    }
} catch (err) {
    console.log('读取package.json失败', err)
}

/**快捷logger：i-info m-mark w-warn e-error 
 */
class Log {
    constructor() {
        this.header = `【AP-Plugin v${currentVersion}】`
    }
    /**快捷执行logger.info( )  */
    i(...msg) { logger.info(this.header, ...msg); }
    /**快捷执行logger.mark( ) */
    m(...msg) { logger.mark(this.header, ...msg); }
    /**快捷执行logger.warn( ) */
    w(...msg) { logger.warn(this.header, ...msg); }
    /**快捷执行logger.error( ) */
    e(...msg) { logger.error(this.header, ...msg); }
    /**快捷执行console.log( ) */
    c(...msg) { console.log(this.header, ...msg); }
}
export default new Log