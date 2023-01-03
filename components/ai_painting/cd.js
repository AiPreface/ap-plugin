/*
 * @Author: 渔火Arcadia  https://github.com/yhArcadia
 * @Date: 2022-12-19 12:20:28
 * @LastEditors: 渔火Arcadia
 * @LastEditTime: 2022-12-21 22:48:18
 * @FilePath: \Yunzai-Bot\plugins\aipainting\components\cd.js
 * @Description: 处理绘图CD
 * 
 * Copyright (c) 2022 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved. 
 */
import moment from "moment";

class CD {

    /**
     * 检查请求绘图的用户是否在cd ，若未cd则为其设置cd 
     * @param {*} e OICQ事件参数e
     * @param {Object} gpolicy 该群的ap策略
     * @return {String} cd提醒文案
     * @return false 当未处于CD中
     */
    async checkCD(e, gpolicy) {
        // 判断cd--------------------------------------------------------------
        let currentTime = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
        // 个人使用一次生成多张图功能后的CD------------
        let multiPicInfo = JSON.parse(
            await redis.get(`Yz:AiPainting:multiPic:${e.user_id}`)
        );
        if (
            multiPicInfo &&
            !e.isMaster &&
            gpolicy.apMaster.indexOf(e.user_id) == -1
        ) {
            let lastTime = multiPicInfo.time;
            let seconds = moment(currentTime).diff(moment(lastTime), "seconds");
            return `${gpolicy.pcd}×${multiPicInfo.count}秒个人cd（您刚刚批量绘制了${multiPicInfo.count}张图），请等待${gpolicy.pcd * multiPicInfo.count - seconds}秒后再使用`
        }
        // 个人CD--------------
        let lastTime = await redis.get(`Yz:AiPainting:${e.group_id}:${e.user_id}`);
        if (lastTime && !e.isMaster && gpolicy.apMaster.indexOf(e.user_id) == -1) {
            let seconds = moment(currentTime).diff(moment(lastTime), "seconds");
            return `${gpolicy.pcd}秒个人cd，请等待${gpolicy.pcd - seconds}秒后再使用`
        }
        // 群组CD--------------
        lastTime = await redis.get(`Yz:AiPainting:${e.group_id}`);
        if (lastTime && !e.isMaster && gpolicy.apMaster.indexOf(e.user_id) == -1) {
            let seconds = moment(currentTime).diff(moment(lastTime), "seconds");
            return `本群${gpolicy.gcd}秒共享cd，请等待${gpolicy.gcd - seconds}秒后再使用`
        }
        // 全局CD--------------
        lastTime = await redis.get(`Yz:AiPainting`);
        if (lastTime && !e.isMaster && gpolicy.apMaster.indexOf(e.user_id) == -1) {
            let seconds = moment(currentTime).diff(moment(lastTime), "seconds");
            return `${gpolicy.cd}秒全局cd，请等待${gpolicy.cd - seconds}秒后再使用`
        }

        // 写入cd---------------------------------------------------------
        currentTime = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
        redis.set(`Yz:AiPainting`, currentTime, { EX: gpolicy.cd });
        redis.set(`Yz:AiPainting:${e.group_id}`, currentTime, {
            EX: gpolicy.gcd,
        });
        redis.set(`Yz:AiPainting:${e.group_id}:${e.user_id}`, currentTime, {
            EX: gpolicy.pcd,
        });
        return false;
    }


    /**
     * 清除指定用户的cd
     * @param {*} e OICQ事件参数e
     * @return {*} 
     */
    async clearCD(e) {
        await redis.del(`Yz:AiPainting`);
        await redis.del(`Yz:AiPainting:${e.group_id}`);
        await redis.del(`Yz:AiPainting:${e.group_id}:${e.user_id}`);
        await redis.del(`Yz:AiPainting:multiPic:${e.user_id}`);
        return true;
    }


    /**设置批量绘图的CD
     * @param {*} e OICQ事件参数e
     * @param {*} num 批量绘制了num张图
     * @param {*} gpolicy 该群ap策略
     * @return {*}
     */
    async batchCD(e, num, gpolicy) {
        let currentTime = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
        let multiPicInfo = {
            time: currentTime,
            count: num,
        };
        redis.set(
            `Yz:AiPainting:multiPic:${e.user_id}`,
            JSON.stringify(multiPicInfo),
            { EX: gpolicy.pcd * num }
        );
    }

}

export default new CD()