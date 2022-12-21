/*
 * @Author: 渔火Arcadia  https://github.com/yhArcadia
 * @Date: 2022-12-19 22:18:54
 * @LastEditors: 渔火Arcadia
 * @LastEditTime: 2022-12-19 22:20:12
 * @FilePath: \Yunzai-Bot\plugins\aipainting\apps\set.js
 * @Description: 
 * 
 * Copyright (c) 2022 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved. 
 */







// 设置是否保存图片


export class set extends plugin {
    constructor() {
        super({
            name: "AiPainting设置",
            dsc: "更改AiPainting设置",
            event: "message",
            priority: 5000,
            rule: [
            ],
        });
    }
}