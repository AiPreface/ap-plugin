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
import moment from "moment";
import common from "../../../lib/common/common.js";
import cfg from "../../../lib/config/config.js";
import { getuserName, parseImg } from "../utils/utils.js";
import Log from "../utils/Log.js";
import { Parse, CD, Policy, Draw } from "../components/apidx.js";
import Config from "../components/ai_painting/config.js";
import _ from "lodash";
import Pictools from "../utils/pic_tools.js";

// 批量绘图的剩余张数
let remaining_tasks = 0;

export class Ai_Painting extends plugin {
  constructor() {
    super({
      name: "AP-AI绘图",
      dsc: "根据输入的文案AI作画",
      event: "message",
      priority: 1009,
      rule: [
        {
          reg: "^#?(绘图|咏唱|绘画|绘世)([\\s\\S]*)$",
          fnc: "aiPainting",
        },
        {
          reg: "^#?(再来一张|重画|重绘)$",
          fnc: "again",
        },
      ],
    });
  }

  async aiPainting(e) {
    e = await parseImg(e);

    const data = {
      msg: e.msg,
      img: e.img || null,
    };

    await redis.set(`Yz:AiPainting:Again:${e.user_id}`, JSON.stringify(data));

    // 获取设置
    const setting = await Config.getSetting();

    // 获取本群策略
    const current_group_policy = await Parse.parsecfg(e);

    // 判断功能是否开启
    if (!e.isMaster && current_group_policy.apMaster.indexOf(e.user_id) == -1) {
      if (!current_group_policy.enable) {
        return await e.reply("AI绘图功能未开启", false, { recallMsg: 15 });
      }
    }

    // 判断是否禁用用户
    if (current_group_policy.isBan) {
      if (current_group_policy.prohibitedUserList.indexOf(e.user_id) != -1) {
        return await e.reply(
          ["你的账号因违规使用屏蔽词绘图已被封禁或被管理员封禁"],
          true,
        );
      }
    }

    // 判断cd
    const cdCheck = await CD.checkCD(e, current_group_policy);
    if (cdCheck) {
      return await e.reply(cdCheck, true, { recallMsg: 15 });
    }

    // 取绘图参数
    let paramdata = await Parse.mergeParam(e);
    if (paramdata.code) {
      CD.clearCD(e);
      return await e.reply(paramdata.msg, true, { recallMsg: 15 });
    }
    // Log.i('绘图参数：\n', paramdata)                       /*  */

    // 禁止重复发起批量绘图
    if (paramdata.num > 1 && remaining_tasks) {
      CD.clearCD(e);
      return await e.reply(
        `当前已有批量绘图任务进行中，剩余${remaining_tasks}张图，请稍候`,
        true,
      );
    }

    // 判断次数限制
    const usageLimit =
      e.isMaster || current_group_policy.apMaster.indexOf(e.user_id) > -1
        ? 0
        : current_group_policy.usageLimit;
    const used = (await redis.get(`Yz:AiPainting:Usage:${e.user_id}`)) || 0;
    Log.i(
      `用户 ${await getuserName(e)}(${
        e.user_id
      }) 发起绘图。今日已使用${used}次。`,
    );
    let remainingTimes = usageLimit - used; // 今日剩余次数
    if (remainingTimes < 0) remainingTimes = 0;
    if (usageLimit) {
      // 剩余可用次数
      if (remainingTimes == 0) {
        return await e.reply(`你今天已经绘制过${used}张图片了，请明天再来~`);
      }
      // 请求张数大于剩余次数
      if (paramdata.num > remainingTimes) {
        CD.clearCD(e);
        return await e.reply(
          ["今日剩余可用次数不足，剩余次数：", `${remainingTimes}`, "次"],
          true,
          { recallMsg: 15 },
        );
      }
    }

    // 翻译中文
    const chReg =
      /(?:[\u3400-\u4DB5\u4E00-\u9FEA\uFA0E\uFA0F\uFA11\uFA13\uFA14\uFA1F\uFA21\uFA23\uFA24\uFA27-\uFA29]|[\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0])+/;
    if (chReg.test(paramdata.rawtag.tags + paramdata.rawtag.ntags)) {
      e.reply("检测到中文Prompt，进行翻译......", true, { recallMsg: 15 });
      paramdata = await Parse.transtag(paramdata);
      if (paramdata.param.tags == "寄" || paramdata.param.ntags == "寄") {
        CD.clearCD(e);
        return await e.reply("翻译接口寄了，请尝试避免使用中文字符");
      }
    }

    // 回填pt
    if (paramdata.param.pt.length) {
      paramdata.param.tags =
        `${paramdata.param.pt.join(",")},` + paramdata.param.tags;
    }
    if (paramdata.param.npt.length) {
      paramdata.param.ntags =
        `${paramdata.param.npt.join(",")},` + paramdata.param.ntags;
    }

    // 记录使用Tags与次数
    try {
      const userId = String(e.user_id).trim();
      const groupId = e.group_id ? String(e.group_id).trim() : null;
      const tags = paramdata.param.tags
        .replace(/[\(\)\[\]\{\}\s]|:\d(\.\d)?/g, "")
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
      const tagUsages = {
        user: (await redis.get(`Yz:AiPainting:TagsUsage:${userId}`)) || "{}",
        group: groupId
          ? (await redis.get(`Yz:AiPainting:TagsUsage:${groupId}`)) || "{}"
          : "{}",
        global: (await redis.get("Yz:AiPainting:TagsUsage:Global")) || "{}",
      };
      tagUsages.user = JSON.parse(tagUsages.user);
      tagUsages.group = JSON.parse(tagUsages.group);
      tagUsages.global = JSON.parse(tagUsages.global);
      tags.forEach((tag) => {
        tagUsages.user[tag] = (tagUsages.user[tag] || 0) + 1;
        tagUsages.group[tag] = (tagUsages.group[tag] || 0) + 1;
        tagUsages.global[tag] = (tagUsages.global[tag] || 0) + 1;
      });
      tagUsages.user = JSON.stringify(tagUsages.user);
      tagUsages.group = JSON.stringify(tagUsages.group);
      tagUsages.global = JSON.stringify(tagUsages.global);
      const multi = redis.multi();
      multi.set(`Yz:AiPainting:TagsUsage:${userId}`, tagUsages.user);
      if (groupId) {
        multi.set(`Yz:AiPainting:TagsUsage:${groupId}`, tagUsages.group);
      }
      multi.set("Yz:AiPainting:TagsUsage:Global", tagUsages.global);
      await multi.exec();
    } catch (err) {
      Log.w(err);
    }

    // 检测屏蔽词
    let prohibitedWords = [];
    if (!e.isMaster && current_group_policy.apMaster.indexOf(e.user_id) == -1) {
      [prohibitedWords, paramdata] = await Parse.checkWords(paramdata);
      if (prohibitedWords.length && current_group_policy.isBan) {
        Policy.banUser(e.user_id); // 封禁用户
        return await e.reply(
          `tags中包含屏蔽词：${prohibitedWords.join(
            "、",
          )}\n您的账号已被禁止使用绘图功能。如属误封，请截图您的此条消息，然后联系机器人主人解封~`,
          true,
        );
      }
    }

    e.reply(
      [
        prohibitedWords.length
          ? `已去除关键词中包含的屏蔽词：${prohibitedWords.join(
              "、",
            )}\n已收到绘图请求，正在`
          : "已收到绘图请求，正在",
        paramdata.param.base64 ? "以图生图" : "绘制",
        "中，请稍候......",
        paramdata.num > 1 ? "绘制多张图片所需时间较长，请耐心等待" : "",
        remaining_tasks
          ? "\n\n※当前有进行中的批量绘图任务，您可能需要等待较长时间，请见谅"
          : "",
      ],
      false,
      { at: true, recallMsg: 20 },
    );

    // 绘图
    // logger.warn('【aiPainting】绘图参数：\n', paramdata);             /* */
    const start = new Date();
    if (paramdata.num == 1) {
      // 单张
      const res = await Draw.get_a_pic(paramdata);
      const end = new Date();
      if (res.code) {
        // 收到报错蚂，清除CD，发送报错信息
        CD.clearCD(e);
        return await e.reply(res.description, true);
      }

      // logger.warn(res);                                              /* */

      // 图片违规
      if (res.isnsfw) {
        // 将图片base64转换为基于QQ图床的url
        await Pictools.upload_image(res.base64);
        if (current_group_policy.isTellMaster) {
          const msg = [
            "【aiPainting】不合规图片：\n",
            segment.image(`base64://${res.base64}`),
            `\n来自${
              e.isGroup
                ? `群【${(await Bot.getGroupInfo(e.group_id)).group_name}】(${
                    e.group_id
                  })的`
                : ""
            }用户【${await getuserName(e)}】(${e.user_id})`,
            `\n正面：${res.info.prompt}`,
            `\n反面：${res.info.negative_prompt}`,
          ];
          Bot.pickUser(cfg.masterQQ[0]).sendMsg(msg);
        }
        if (setting.nsfw_show == 1) {
          // 展示MD5
          await e.reply(["图片不合规，不予展示", `\nMD5：${res.md5}`], true);
        } else if (setting.nsfw_show == 2) {
          // 展示图链二维码
          const qrcode = await Pictools.text_to_qrcode(
            `https://c2cpicdw.qpic.cn/offpic_new/0//0000000000-0000000000-${res.md5}/0?term=2`,
          );
          await e.reply(
            [
              "图片不合规，不予展示\n",
              segment.image(
                `base64://${qrcode.replace("data:image/png;base64,", "")}`,
              ),
            ],
            true,
          );
        } else if (setting.nsfw_show == 3) {
          // 展示图床链接
          const img = Buffer.from(res.base64, "base64");
          const url = await Pictools.upload(img);
          await e.reply(["图片不合规，不予展示\n", url], true);
        } else if (setting.nsfw_show == 4) {
          // 展示卡片
          await e.reply(
            segment.share(
              `https://c2cpicdw.qpic.cn/offpic_new/0//0000000000-0000000000-${res.md5}/0?term=2`,
              "图片不合规，不予展示",
              "https://i.postimg.cc/wBSf50bC/1.png",
              "啾咪啊，这里有人涩涩啊！！！",
            ),
          );
        }
        this.addUsage(e.user_id, 1);
        return true;
      }

      const concise_mode = setting.concise_mode;
      const elapsed = (end - start) / 1000;

      // 如果简洁模式开启，则只发送图片
      if (concise_mode) {
        e.reply(
          [
            segment.at(e.user_id),
            { ...segment.image(`base64://${res.base64}`), origin: true },
            `生成总耗时${elapsed.toFixed(2)}秒`,
          ],
          false,
          {
            recallMsg: current_group_policy.isRecall
              ? current_group_policy.recallDelay
              : 0,
          },
        );
        this.addUsage(e.user_id, 1);
        return true;
      } else {
        // 构建消息
        // Log.w(paramdata.param)
        let info = [
          `迭代步数：${res.info.steps}`,
          res.info.denoising_strength
            ? `重绘幅度：${res.info.denoising_strength}`
            : "",
          `采样方法：${
            res.info.sampler_index == null
              ? res.info.sampler_name
              : res.info.sampler_index
          }`,
          `分辨率：${
            res.info.enable_hr
              ? `${res.info.width * res.info.hr_scale} x ${
                  res.info.height * res.info.hr_scale
                }`
              : `${res.info.width} x ${res.info.height}`
          }`,
          `提示词引导系数：${res.info.cfg_scale}`,
          `随机种子：${res.info.seed}`,
          res.info.enable_hr ? `高清修复算法：${res.info.hr_upscaler}` : "",
          res.info.enable_hr
            ? `高清修复步数：${res.info.hr_second_pass_steps}`
            : "",
          `正面：${res.info.prompt}`,
          `反面：${res.info.negative_prompt}`,
          `耗时：${elapsed.toFixed(2)}秒`,
        ]
          .filter(Boolean)
          .join("\n");
        const msg = [
          usageLimit ? `今日剩余${remainingTimes - 1}次\n` : "",
          { ...segment.image(`base64://${res.base64}`), origin: true },
        ];
        // Log.i(info.length)                                           /*  */
        const max_fold = setting.max_fold;
        if (info.length < max_fold) {
          msg.push("\n" + info);
          info = null;
        }

        // 发送消息，发送失败清除CD，发送成功记录一次使用
        const sendRes = await e.reply(msg, true, {
          recallMsg: current_group_policy.isRecall
            ? current_group_policy.recallDelay
            : 0,
        });
        if (!sendRes) {
          e.reply(["图片发送失败，可能被风控"], true, {
            recallMsg: current_group_policy.isRecall
              ? current_group_policy.recallDelay
              : 0,
          });
          CD.clearCD(e);
        } else {
          this.addUsage(e.user_id, 1);
          if (info) {
            await common.sleep(350);
            const data_msg = [
              {
                message: [info],
                nickname: Bot.nickname,
                user_id: Bot.uin,
              },
            ];
            if (e.isGroup) {
              e.reply(await e.group.makeForwardMsg(data_msg), false, {
                recallMsg: current_group_policy.isRecall
                  ? current_group_policy.recallDelay
                  : 0,
              });
            } else {
              e.reply(await e.friend.makeForwardMsg(data_msg), false, {
                recallMsg: current_group_policy.isRecall
                  ? current_group_policy.recallDelay
                  : 0,
              });
            }
          }
        }
      }
    }
    // 多张
    else {
      remaining_tasks = paramdata.num > 10 ? 10 : paramdata.num;
      CD.batchCD(e, remaining_tasks, current_group_policy);

      let blocked = 0; //  标记合并消息中屏蔽了几张图
      let failedCount = 0; //  标记有几张图请求失败
      const data_msg = [];

      for (let i = 0; i < paramdata.num; i++) {
        if (i >= 10) {
          data_msg.push({
            message: "一次最多10张图哦~",
            nickname: Bot.nickname,
            user_id: Bot.uin,
          });
          break;
        }

        // 获取一张图片
        var res = await Draw.get_a_pic(paramdata);

        // 图片损坏或审核超时或响应超时
        if (res.code == 21 || res.code == 32 || res.code == 504) {
          failedCount++;
          remaining_tasks--;
          continue;
        }
        // 严重错误，清除CD，发送报错信息
        else if (res.code) {
          CD.clearCD(e);
          remaining_tasks = 0;
          return await e.reply(res.description, true);
        }

        // 图片违规时，通知主人
        if (res.isnsfw) {
          if (current_group_policy.isTellMaster) {
            const msg = [
              "【aiPainting】不合规图片：\n",
              { ...segment.image(`base64://${res.base64}`), origin: true },
              `\n来自${
                e.isGroup
                  ? `群【${(await Bot.getGroupInfo(e.group_id)).group_name}】(${
                      e.group_id
                    })的`
                  : ""
              }用户【${await getuserName(e)}】(${e.user_id})`,
              `\n正面：${res.info.prompt}`,
              `\n反面：${res.info.negative_prompt}`,
            ];
            Bot.pickUser(cfg.masterQQ[0]).sendMsg(msg);
          }
          data_msg.push({
            message: [res.md5],
            nickname: Bot.nickname,
            user_id: Bot.uin,
          });
          blocked++;
          remaining_tasks--;
          continue;
        }

        // 存入合并消息等待发送
        data_msg.push({
          message: [
            { ...segment.image(`base64://${res.base64}`), origin: true },
            paramdata.param.seed == -1 ? `\n随机种子：${res.seed}` : "",
          ],
          nickname: Bot.nickname,
          user_id: Bot.uin,
        });

        remaining_tasks--;
      }
      // 在合并消息中加入图片信息
      data_msg.push({
        message: [
          `迭代步数：${res.info.steps}`,
          res.info.denoising_strength
            ? `重绘幅度：${res.info.denoising_strength}`
            : "",
          `采样方法：${
            res.info.sampler_index == null
              ? res.info.sampler_name
              : res.info.sampler_index
          }`,
          `分辨率：${
            res.info.enable_hr
              ? `${res.info.width * res.info.hr_scale} x ${
                  res.info.height * res.info.hr_scale
                }`
              : `${res.info.width} x ${res.info.height}`
          }`,
          `提示词引导系数：${res.info.cfg_scale}`,
          res.info.enable_hr ? `高清修复算法：${res.info.hr_upscaler}` : "",
          res.info.enable_hr
            ? `高清修复步数：${res.info.hr_second_pass_steps}`
            : "",
          `正面：${res.info.prompt}`,
          `反面：${res.info.negative_prompt}`,
        ].join("\n"),
        nickname: Bot.nickname,
        user_id: Bot.uin,
      });

      //  尝试发送合并消息
      let sendRes = null;
      if (e.isGroup) {
        sendRes = await e.reply(await e.group.makeForwardMsg(data_msg), false, {
          recallMsg: current_group_policy.isRecall
            ? current_group_policy.recallDelay
            : 0,
        });
      } else {
        sendRes = await e.reply(
          await e.friend.makeForwardMsg(data_msg),
          false,
          {
            recallMsg: current_group_policy.isRecall
              ? current_group_policy.recallDelay
              : 0,
          },
        );
      }

      // 消息发送失败
      if (!sendRes) {
        e.reply(["消息发送失败，可能被风控"], true, {
          recallMsg: current_group_policy.isRecall
            ? current_group_policy.recallDelay
            : 0,
        });
        CD.clearCD(e);
      } else {
        // 发送成功
        const n = paramdata.num > 10 ? 10 : paramdata.num;
        const successCount = n - failedCount;
        this.addUsage(e.user_id, successCount); // 记录使用次数
        e.reply(
          [
            `成功绘制${successCount}张图片`,
            blocked ? `，有${blocked}张图片因不合规无法展示。` : "",
            failedCount ? `\n有${failedCount}张图片绘制失败。` : "",
            usageLimit ? `\n今日剩余${remainingTimes - successCount}次` : "",
          ],
          true,
          {
            recallMsg: current_group_policy.isRecall
              ? current_group_policy.recallDelay
              : 0,
          },
        );
      }

      remaining_tasks = 0;
      return true;
    }
  }

  async again(e) {
    const usageData = await redis.get(`Yz:AiPainting:Again:${e.user_id}`);
    if (!usageData) {
      e.reply("太久远了，我也忘记上一次绘的图是什么了");
      return false;
    }
    const { msg, img } = JSON.parse(usageData);
    if (msg) e.msg = msg;
    if (img) e.img = img;
    await this.aiPainting(e);
    return true;
  }

  /** 指定用户使用次数加num次
   * @param qq 用户qq号
   * @param num 数据库中用户使用记录要增加的次数
   */
  async addUsage(qq, num) {
    // logger.info(num);
    // 该用户的使用次数
    const usageData = await redis.get(`Yz:AiPainting:Usage:${qq}`);
    // 当前时间
    const time = moment(Date.now())
      .add(1, "days")
      .format("YYYY-MM-DD 00:00:00");
    // 到明日零点的剩余秒数
    const exTime = Math.round(
      (new Date(time).getTime() - new Date().getTime()) / 1000,
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
