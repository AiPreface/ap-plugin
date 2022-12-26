/*
 * @Author: 渔火Arcadia  https://github.com/yhArcadia
 * @Date: 2022-12-18 23:34:10
 * @LastEditors: 渔火Arcadia
 * @LastEditTime: 2022-12-26 20:47:52
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\apps\ap.js
 * @Description: #绘图
 * 
 * Copyright (c) 2022 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved. 
 */
import moment from 'moment';
import { segment } from "oicq";
import cfg from '../../../lib/config/config.js'
import { getuserName } from '../utils/utils.js'
import Pictools from '../utils/pic_tools.js';
import Log from '../utils/Log.js'
import { Parse, CD, Policy, Draw } from '../components/apidx.js';


// 批量绘图的剩余张数
let multiTask = 0;

export class ap extends plugin {
  constructor() {
    super({
      name: "AiPainting",
      dsc: "根据输入的文案AI作画",
      event: "message",
      priority: 5000,
      rule: [
        {
          reg: "^#绘图([\\s\\S]*)$",
          fnc: "AiPainting",
        },
      ],
    });
  }

  async AiPainting(e) {

    // 获取本群策略
    let gpolicy = await Parse.parsecfg(e)
    // console.log('【aiPainting】本群ap策略：\n',gpolicy)                    /*  */  


    // 判断功能是否开启
    if (!e.isMaster && gpolicy.apMaster.indexOf(e.user_id) == -1)
      if (!gpolicy.enable) return await e.reply("aiPainting功能未开启", false, { recallMsg: 15 });


    // 判断是否禁用用户
    if (gpolicy.isBan)
      if (gpolicy.prohibitedUserList.indexOf(e.user_id) != -1)
        return await e.reply(["你的账号因违规使用屏蔽词绘图已被封禁"], true);


    // 判断cd
    let cdCheck = await CD.checkCD(e, gpolicy)
    if (cdCheck)
      return await e.reply(cdCheck, true, { recallMsg: 15 });


    // 取绘图参数
    let paramdata = await Parse.mergeParam(e)
    if (paramdata.code) {
      CD.clearCD(e)
      return await e.reply(paramdata.msg, true, { recallMsg: 15 })
    }
    // console.log('【aiPainting】绘图参数：\n', paramdata)                       /*  */


    // 禁止重复发起批量绘图
    if (paramdata.num > 1 && multiTask) {
      CD.clearCD(e);
      return await e.reply(`当前已有批量绘图任务进行中，剩余${multiTask}张图，请稍候`, true);
    }


    // 判断次数限制
    let usageLimit = e.isMaster || gpolicy.apMaster.indexOf(e.user_id) > -1 ? 0 : gpolicy.usageLimit;
    let used = await redis.get(`Yz:AiPainting:Usage:${e.user_id}`) || 0;
    Log.i(`用户 ${await getuserName(e)}(${e.user_id}) 发起绘图。今日已使用${used}次。`)
    let remainingTimes = usageLimit - used;//今日剩余次数
    if (remainingTimes < 0) remainingTimes = 0;
    if (usageLimit) {
      // 剩余可用次数
      if (remainingTimes == 0)
        return await e.reply(`你今天已经绘制过${used}张图片了，请明天再来~`);
      // 请求张数大于剩余次数
      if (paramdata.num > remainingTimes) {
        CD.clearCD(e);
        return await e.reply(["今日剩余可用次数不足，剩余次数：", `${remainingTimes}`, "次"], true, { recallMsg: 15 });
      }
    }


    // 翻译中文
    let chReg = /(?:[\u3400-\u4DB5\u4E00-\u9FEA\uFA0E\uFA0F\uFA11\uFA13\uFA14\uFA1F\uFA21\uFA23\uFA24\uFA27-\uFA29]|[\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0])+/
    if (chReg.test(paramdata.rawtag.tags + paramdata.rawtag.ntags.replace("默认"))) {
      e.reply('翻译中，请稍候', true, { recallMsg: 15 })
      paramdata = await Parse.transtag(paramdata)
      if (paramdata.param.tags == '寄' || paramdata.param.ntags == '寄') {
        CD.clearCD(e)
        return await e.reply("翻译接口寄了，请尝试避免使用中文字符")
      }
    }


    // 检测屏蔽词
    let prohibitedWords = []
    if (!e.isMaster && gpolicy.apMaster.indexOf(e.user_id) == -1) {
      [prohibitedWords, paramdata] = await Parse.checkWords(paramdata)
      if (prohibitedWords.length && gpolicy.isBan) {
        Policy.banUser(e.user_id)// 封禁用户
        return await e.reply(`tags中包含屏蔽词：${prohibitedWords.join('、')}\n您的账号已被禁止使用绘图功能。如属误封，请截图您的此条消息，然后联系机器人主人解封~`, true)
      }
    }


    e.reply([
      prohibitedWords.length ? "已去除关键词中包含的屏蔽词，正在" : "",
      paramdata.param.base64 ? "以图生图" : "绘制", "中，请稍候。",
      paramdata.num > 1 ? "绘制多张图片所需时间较长，请耐心等待" : "",
      multiTask ? "\n\n※当前有进行中的批量绘图任务，您可能需要等待较长时间，请见谅" : "",
    ], false, { at: true, recallMsg: 20 });



    // 绘图
    // logger.warn('【aiPainting】绘图参数：\n', paramdata);             /* */

    if (paramdata.num == 1) {// 单张
      let res = await Draw.get_a_pic(paramdata)

      if (res.code) {// 收到报错蚂，清除CD，发送报错信息
        CD.clearCD(e)
        return await e.reply(res.description, true)
      }

      // logger.warn(res);                                              /* */

      // 图片违规
      if (res.isnsfw) {
        // 将图片base64转换为基于QQ图床的url
        let url = await Pictools.base64_to_imgurl(res.base64)
        if (gpolicy.isTellMaster) {
          let msg = [
            "【aiPainting】不合规图片：\n",
            segment.image(`base64://${res.base64}`),
            `\n来自${e.isGroup ? `群【${(await Bot.getGroupInfo(e.group_id)).group_name}】(${e.group_id})的` : ""}用户【${await getuserName(e)}】(${e.user_id})`,
            `\n【Tags】：${paramdata.rawtag.tags}`,
            `\n【nTags】：${paramdata.rawtag.ntags}`,
          ]
          Bot.pickUser(cfg.masterQQ[0]).sendMsg(msg);
        }
        e.reply(["图片不合规，不予展示", `\n${res.md5}`], true)
        return true
      }

      // 构建消息
      let msg = [
        usageLimit ? `今日剩余${remainingTimes - 1}次\n` : "",
        segment.image(`base64://${res.base64}`),
        `\nseed=${res.seed}`,
        paramdata.param.sampler != 'Euler a' ? `\nsampler=${paramdata.param.sampler}` : '',
        paramdata.param.steps != 40 ? `\nsteps=${paramdata.param.steps}` : '',
        paramdata.param.scale != 11 ? `\nscale=${paramdata.param.scale}` : '',
        paramdata.param.strength != 0.6 ? `\nstrength=${paramdata.param.strength}` : '',
        paramdata.param.tags ? `\n${paramdata.param.tags}` : '',
        paramdata.param.ntags == '默认' ? "" : `\n\nNTAGS=${paramdata.param.ntags}`,
      ]

      // 发送消息，发送失败清除CD，发送成功记录一次使用
      let sendRes = await e.reply(msg, true, { recallMsg: gpolicy.isRecall ? gpolicy.recallDelay : 0 })
      if (!sendRes) {
        e.reply(["图片发送失败，可能被风控"], true, { recallMsg: gpolicy.isRecall ? gpolicy.recallDelay : 0 })
        CD.clearCD(e)
      } else {
        this.addUsage(e.user_id, 1);
      }
    }
    // 多张
    else {
      multiTask = paramdata.num > 10 ? 10 : paramdata.num;
      CD.batchCD(e, multiTask, gpolicy)

      let blocked = 0;  //  标记合并消息中屏蔽了几张图
      let failedCount = 0; //  标记有几张图请求失败
      var data_msg = [];

      for (let i = 0; i < paramdata.num; i++) {
        if (i >= 10) {
          data_msg.push({
            message: "一次最多10张图哦~",
            nickname: Bot.nickname,
            user_id: cfg.qq,
          });
          break;
        }

        // 获取一张图片
        let res = await Draw.get_a_pic(paramdata)

        // 图片损坏或审核超时或响应超时
        if (res.code == 21 || res.code == 32 || res.code == 504) {
          failedCount++;
          multiTask--;
          continue
        }
        // 严重错误，清除CD，发送报错信息 
        else if (res.code) {
          CD.clearCD(e)
          multiTask = 0
          return await e.reply(res.description, true)
        }

        // 图片违规时，通知主人
        if (res.isnsfw) {
          if (gpolicy.isTellMaster) {
            let msg = [
              "【aiPainting】不合规图片：\n",
              segment.image(`base64://${res.base64}`),
              `\n来自${e.isGroup ? `群【${(await Bot.getGroupInfo(e.group_id)).group_name}】(${e.group_id})的` : ""}用户【${await getuserName(e)}】(${e.user_id})`,
              `\n【Tags】：${paramdata.rawtag.tags}`,
              `\n【nTags】：${paramdata.rawtag.ntags}`,
            ]
            Bot.pickUser(cfg.masterQQ[0]).sendMsg(msg);
          }
          data_msg.push({
            message: [res.md5],
            nickname: Bot.nickname,
            user_id: cfg.qq,
          });
          blocked++;
          multiTask--;
          continue;
        }

        // 存入合并消息等待发送
        data_msg.push({
          message: [segment.image(`base64://${res.base64}`), paramdata.param.seed == -1 ? `\nseed=${res.seed}` : ''],
          nickname: Bot.nickname,
          user_id: cfg.qq,
        });

        multiTask--;
      }

      // 在合并消息中加入图片信息 
      data_msg.push({
        message: [
          paramdata.param.seed == -1 ? '' : `seed=${paramdata.param.seed}\n`,
          `sampler=${paramdata.param.sampler}\n`,
          `steps=${paramdata.param.steps}\n`,
          `scale=${paramdata.param.scale}\n`,
          `strength=${paramdata.param.strength}\n`,
          paramdata.param.tags ? `${paramdata.param.tags}` : '',
          paramdata.param.ntags == '默认' ? "" : `\nNTAGS=${paramdata.param.ntags}`,
        ],
        nickname: Bot.nickname,
        user_id: cfg.qq,
      });

      //  尝试发送合并消息 
      let sendRes = null;
      if (e.isGroup)
        sendRes = await e.reply(
          await e.group.makeForwardMsg(data_msg),
          false,
          { recallMsg: gpolicy.isRecall ? gpolicy.recallDelay : 0 }
        );
      else
        sendRes = await e.reply(
          await e.friend.makeForwardMsg(data_msg),
          false,
          { recallMsg: gpolicy.isRecall ? gpolicy.recallDelay : 0 }
        );

      // 消息发送失败
      if (!sendRes) {
        e.reply(["消息发送失败，可能被风控"], true, { recallMsg: gpolicy.isRecall ? gpolicy.recallDelay : 0 });
        CD.clearCD(e);
      } else {
        // 发送成功
        let n = paramdata.num > 10 ? 10 : paramdata.num
        let successCount = n - failedCount
        this.addUsage(e.user_id, successCount);//记录使用次数 
        e.reply(
          [
            `成功绘制${successCount}张图片`,
            blocked ? `，有${blocked}张图片因不合规无法展示。` : "",
            failedCount ? `\n有${failedCount}张图片绘制失败。` : "",
            usageLimit ? `\n今日剩余${remainingTimes - successCount}次` : "",
          ],
          true,
          { recallMsg: gpolicy.isRecall ? gpolicy.recallDelay : 0 }
        );
      }

      multiTask = 0;
      return true
    }
  }


  /**指定用户使用次数加num次  
   * @param qq 用户qq号
   * @param num 数据库中用户使用记录要增加的次数
   */
  async addUsage(qq, num) {
    // logger.info(num);
    // 该用户的使用次数
    let usageData = await redis.get(`Yz:AiPainting:Usage:${qq}`);
    // 当前时间
    let time = moment(Date.now()).add(1, "days").format("YYYY-MM-DD 00:00:00");
    // 到明日零点的剩余秒数
    let exTime = Math.round(
      (new Date(time).getTime() - new Date().getTime()) / 1000
    );
    if (!usageData) {
      await redis.set(`Yz:AiPainting:Usage:${qq}`, num * 1, { EX: exTime });
    } else {
      await redis.set(`Yz:AiPainting:Usage:${qq}`, usageData * 1 + num, {
        EX: exTime,
      });
    }
    return true;
  }
}