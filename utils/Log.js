/*
 * @Author: 渔火Arcadia  https://github.com/yhArcadia
 * @Date: 2022-12-22 14:54:18
 * @LastEditors: 渔火Arcadia
 * @LastEditTime: 2022-12-22 15:19:22
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\utils\Log.js
 * @Description: 快捷logger
 * 
 * Copyright (c) 2022 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved. 
 */
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