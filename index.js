/*
 * @Author: 渔火Arcadia  https://github.com/yhArcadia
 * @Date: 2022-12-18 23:08:51
 * @LastEditors: 渔火Arcadia
 * @LastEditTime: 2022-12-22 01:07:32
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\index.js
 * @Description: 
 * 
 * Copyright (c) 2022 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved. 
 */
import fs from 'node:fs' 
const files = fs.readdirSync('./plugins/ap-plugin/apps').filter(file => file.endsWith('.js'))

let ret = []

logger.info('---------------')
logger.info(`aiPainting初始化`)
// logger.info('---------------')


files.forEach((file) => {
    ret.push(import(`./apps/${file}`))
})

ret = await Promise.allSettled(ret)

let apps = {}
for (let i in files) {
    let name = files[i].replace('.js', '')

    if (ret[i].status != 'fulfilled') {
        logger.error(`载入插件错误：${logger.red(name)}`)
        logger.error(ret[i].reason)
        continue
    }
    apps[name] = ret[i].value[Object.keys(ret[i].value)[0]]
}
export { apps }

// logger.info('---------------')
logger.info(`aiPainting载入完成`)
logger.info('---------------')