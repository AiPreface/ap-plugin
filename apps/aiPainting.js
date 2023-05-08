/*
 * @Author: 渔火Arcadia  https://github.com/yhArcadia
 * @Date: 2022-12-18 23:34:10
 * @LastEditors: 苏沫柒 3146312184@qq.com
 * @LastEditTime: 2023-05-06 22:10:08
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\apps\ai_painting.js
 * @Description: #绘图
 * 
 * Copyright (c) 2022 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved. 
 */
import moment from 'moment';
import common from '../../../lib/common/common.js'
import cfg from '../../../lib/config/config.js'
import { getuserName } from '../utils/utils.js'
import Pictools from '../utils/pic_tools.js';
import Log from '../utils/Log.js'
import { Parse, CD, Policy, Draw } from '../components/apidx.js';
import Config from '../components/ai_painting/config.js';


// 批量绘图的剩余张数
let remaining_tasks = 0;

export class Ai_Painting extends plugin {
  constructor() {
    super({
      name: "AP-AI绘图",
      dsc: "根据输入的文案AI作画",
      event: "message",
      priority: 5000,
      rule: [
        {
          reg: "^#?绘图([\\s\\S]*)$",
          fnc: "aiPainting",
        },
      ],
    });
  }

  async aiPainting(e) {
    // 获取设置
    let setting = await Config.getSetting()

    // 获取本群策略
    let current_group_policy = await Parse.parsecfg(e)


    // 判断功能是否开启
    if (!e.isMaster && current_group_policy.apMaster.indexOf(e.user_id) == -1)
      if (!current_group_policy.enable) return await e.reply("AI绘图功能未开启", false, { recallMsg: 15 });


    // 判断是否禁用用户
    if (current_group_policy.isBan)
      if (current_group_policy.prohibitedUserList.indexOf(e.user_id) != -1)
        return await e.reply(["你的账号因违规使用屏蔽词绘图已被封禁或被管理员封禁"], true);


    // 判断cd
    let cdCheck = await CD.checkCD(e, current_group_policy)
    if (cdCheck)
      return await e.reply(cdCheck, true, { recallMsg: 15 });


    // 取绘图参数
    let paramdata = await Parse.mergeParam(e)
    if (paramdata.code) {
      CD.clearCD(e)
      return await e.reply(paramdata.msg, true, { recallMsg: 15 })
    }
    // Log.i('绘图参数：\n', paramdata)                       /*  */


    // 禁止重复发起批量绘图
    if (paramdata.num > 1 && remaining_tasks) {
      CD.clearCD(e);
      return await e.reply(`当前已有批量绘图任务进行中，剩余${remaining_tasks}张图，请稍候`, true);
    }


    // 判断次数限制
    let usageLimit = e.isMaster || current_group_policy.apMaster.indexOf(e.user_id) > -1 ? 0 : current_group_policy.usageLimit;
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
    if (chReg.test(paramdata.rawtag.tags + paramdata.rawtag.ntags)) {
      e.reply('检测到中文Prompt，进行翻译......', true, { recallMsg: 15 })
      paramdata = await Parse.transtag(paramdata)
      if (paramdata.param.tags == '寄' || paramdata.param.ntags == '寄') {
        CD.clearCD(e)
        return await e.reply("翻译接口寄了，请尝试避免使用中文字符")
      }
    }

    // 回填pt
    if (paramdata.param.pt.length)
      paramdata.param.tags = `${paramdata.param.pt.join(',')},` + paramdata.param.tags
    if (paramdata.param.npt.length)
      paramdata.param.ntags = `${paramdata.param.npt.join(',')},` + paramdata.param.ntags

    // 检测屏蔽词
    let prohibitedWords = []
    if (!e.isMaster && current_group_policy.apMaster.indexOf(e.user_id) == -1) {
      [prohibitedWords, paramdata] = await Parse.checkWords(paramdata)
      if (prohibitedWords.length && current_group_policy.isBan) {
        Policy.banUser(e.user_id)// 封禁用户
        return await e.reply(`tags中包含屏蔽词：${prohibitedWords.join('、')}\n您的账号已被禁止使用绘图功能。如属误封，请截图您的此条消息，然后联系机器人主人解封~`, true)
      }
    }


    e.reply([
      prohibitedWords.length ? `已去除关键词中包含的屏蔽词：${prohibitedWords.join('、')}\n已收到绘图请求，正在` : "已收到绘图请求，正在",
      paramdata.param.base64 ? "以图生图" : "绘制", "中，请稍候......",
      paramdata.num > 1 ? "绘制多张图片所需时间较长，请耐心等待" : "",
      remaining_tasks ? "\n\n※当前有进行中的批量绘图任务，您可能需要等待较长时间，请见谅" : "",
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
        if (current_group_policy.isTellMaster) {
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

      let concise_mode = setting.concise_mode

      // 如果简洁模式开启，则只发送图片
      if (concise_mode) {
        e.reply([segment.at(e.user_id),segment.image(`base64://${res.base64}`)])
        this.addUsage(e.user_id, 1)
        return true
      } else {
        // 构建消息
        // Log.w(paramdata.param)
        let info = [
          `seed=${res.seed}`,
          paramdata.param.sampler != 'Euler a' ? `\nsampler=${paramdata.param.sampler}` : '',
          paramdata.param.steps != 22 ? `\nsteps=${paramdata.param.steps}` : '',
          paramdata.param.scale != 11 ? `\nscale=${paramdata.param.scale}` : '',
          paramdata.param.strength != 0.6 ? `\nstrength=${paramdata.param.strength}` : '',
          paramdata.param.tags ? `\n${paramdata.param.tags}` : '',
          paramdata.param.ntags ? `\n\nNTAGS=${paramdata.param.ntags}` : "",
        ].join('')
        let msg = [
          usageLimit ? `今日剩余${remainingTimes - 1}次\n` : "",
          segment.image(`base64://${res.base64}`),
        ]
        // Log.i(info.length)                                           /*  */
        let max_fold = setting.max_fold
        if (info.length < max_fold) {
          msg.push('\n' + info);
          info = null;
        }
  
        // 发送消息，发送失败清除CD，发送成功记录一次使用
        let sendRes = await e.reply(msg, true, { recallMsg: current_group_policy.isRecall ? current_group_policy.recallDelay : 0 })
        if (!sendRes) {
          e.reply(["图片发送失败，可能被风控"], true, { recallMsg: current_group_policy.isRecall ? current_group_policy.recallDelay : 0 })
          CD.clearCD(e)
        } else {
          this.addUsage(e.user_id, 1);
          if (info) {
            await common.sleep(350)
            let data_msg = [{
              message: [info],
              nickname: Bot.nickname,
              user_id: cfg.qq,
            }]
            if (e.isGroup) {
              e.reply(
                await e.group.makeForwardMsg(data_msg),
                false,
                { recallMsg: current_group_policy.isRecall ? current_group_policy.recallDelay : 0 }
              );
            }
            else {
              e.reply(
                await e.friend.makeForwardMsg(data_msg),
                false,
                { recallMsg: current_group_policy.isRecall ? current_group_policy.recallDelay : 0 }
              );
            }
          }
        }
      }
    }
    // 多张
    else {
      remaining_tasks = paramdata.num > 10 ? 10 : paramdata.num;
      CD.batchCD(e, remaining_tasks, current_group_policy)

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
          remaining_tasks--;
          continue
        }
        // 严重错误，清除CD，发送报错信息 
        else if (res.code) {
          CD.clearCD(e)
          remaining_tasks = 0
          return await e.reply(res.description, true)
        }

        // 图片违规时，通知主人
        if (res.isnsfw) {
          if (current_group_policy.isTellMaster) {
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
          remaining_tasks--;
          continue;
        }

        // 存入合并消息等待发送
        data_msg.push({
          message: [segment.image(`base64://${res.base64}`), paramdata.param.seed == -1 ? `\nseed=${res.seed}` : ''],
          nickname: Bot.nickname,
          user_id: cfg.qq,
        });

        remaining_tasks--;
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
          paramdata.param.ntags ? `\nNTAGS=${paramdata.param.ntags}` : "",
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
          { recallMsg: current_group_policy.isRecall ? current_group_policy.recallDelay : 0 }
        );
      else
        sendRes = await e.reply(
          await e.friend.makeForwardMsg(data_msg),
          false,
          { recallMsg: current_group_policy.isRecall ? current_group_policy.recallDelay : 0 }
        );

      // 消息发送失败
      if (!sendRes) {
        e.reply(["消息发送失败，可能被风控"], true, { recallMsg: current_group_policy.isRecall ? current_group_policy.recallDelay : 0 });
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
          { recallMsg: current_group_policy.isRecall ? current_group_policy.recallDelay : 0 }
        );
      }

      remaining_tasks = 0;
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