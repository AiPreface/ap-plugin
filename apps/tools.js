/*
 * @Author: 渔火Arcadia  https://github.com/yhArcadia
 * @Date: 2023-01-04 20:22:48
 * @LastEditors: 渔火Arcadia
 * @LastEditTime: 2023-01-05 17:22:26
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\apps\tools.js
 * @Description: 一些小工具
 * 
 * Copyright (c) 2023 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved. 
 */

import plugin from '../../../lib/plugins/plugin.js'
import { segment } from "oicq";
import { parseImg } from '../utils/utils.js';

export class Tools extends plugin {
    constructor() {
        super({
            name: 'ap_tools',
            dsc: 'ap-plugin提供的一些小工具',
            event: 'message',
            priority: 4000,
            rule: [
                {
                    reg: '^#?看?看头像$',
                    fnc: 'ktx'
                },
                {
                    reg: '^#?取图链$',
                    fnc: 'getImgUrl'
                },
                {
                    reg: '^#?图链模板$',
                    fnc: 'image_template'
                },
            ]
        })
    }

    async ktx(e) {
        let qq = e.user_id
        if (e.at) qq = e.at
        if (e.atBot) qq = Bot.uin
        e.reply(segment.image(`https://q1.qlogo.cn/g?b=qq&s=0&nk=${qq}`))
        return true;
    }

    async getImgUrl(e) {
        e = await parseImg(e)
        if (e.img)
            e.reply(e.img[0])
        else
            e.reply('请附带图片，或对图片回复')
        return true
    }

    async image_template(e) {
        e.reply('https://gchat.qpic.cn/gchatpic_new/0000000000/0000000000-0000000000-替换/0?term=3&is_origin=0')
        return true
    }
}
