/*
 * @Author: 渔火Arcadia  https://github.com/yhArcadia
 * @Date: 2023-01-05 15:05:51
 * @LastEditors: 渔火Arcadia
 * @LastEditTime: 2023-01-05 15:18:32
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\apps\intercept.js
 * @Description: 用于拦截特定指令
 *
 *
 * Copyright (c) 2023 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved. 
 */

import Log from "../utils/Log.js";


export class Intercept extends plugin {
    constructor() {
        super({
            name: "AP-拦截指令",
            dsc: "拦截特定指令",
            event: "message",
            priority: 1009,
            rule: [
                {
                    reg: "^https://gchat.qpic.cn/gchatpic_new.+",
                    fnc: "interceptQpic",
                },
                {
                    reg: "^https://postimg.cc/.+",
                    fnc: "interceptQpic",
                }
            ],
        });
    }
    interceptQpic(e) {
        Log.w(`监测到危险图链，已拦截指令，以避免图片被网页截图捕获\n${e.msg}`)
        return true
    }
}