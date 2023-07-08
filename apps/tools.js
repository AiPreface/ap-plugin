/*
 * @Author: 渔火Arcadia  https://github.com/yhArcadia
 * @Date: 2023-01-04 20:22:48
 * @LastEditors: 渔火Arcadia
 * @LastEditTime: 2023-01-12 21:16:40
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\apps\tools.js
 * @Description: 一些小工具
 *
 * Copyright (c) 2023 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved.
 */

import plugin from "../../../lib/plugins/plugin.js";
import { parseImg } from "../utils/utils.js";
import cfg from "../../../lib/config/config.js";
import puppeteer from "../../../lib/puppeteer/puppeteer.js";
import Config from "../components/ai_painting/config.js";
import axios from "axios";

const _path = process.cwd();

export class Tools extends plugin {
  constructor() {
    super({
      name: "AP-小工具",
      dsc: "ap-plugin提供的一些小工具",
      event: "message",
      priority: 1009,
      rule: [
        {
          reg: "^#?看?看头像$",
          fnc: "ktx",
        },
        {
          reg: "^#?取图链$",
          fnc: "getImgUrl",
        },
        {
          reg: "^#?图链模板$",
          fnc: "image_template",
        },
        {
          reg: "^#?撤回$",
          fnc: "WithDraw",
        },
        {
          reg: "^#?ap文档$",
          fnc: "apDoc",
        },
        {
          reg: "^#?ap(全局|本群|我的)词云$",
          fnc: "apWordCloud",
        },
        {
          reg: "^#?ap接口状态$",
          fnc: "apStatus",
        },
        {
          reg: "^#?(取消|停止)(绘图|咏唱|绘画|绘世|绘制).*$",
          fnc: "apCancel",
        },
      ],
    });
  }

  async ktx(e) {
    let qq = e.user_id;
    if (e.at) qq = e.at;
    if (e.atBot) qq = Bot.uin;
    e.reply(segment.image(`https://q1.qlogo.cn/g?b=qq&s=0&nk=${qq}`));
    return true;
  }

  async getImgUrl(e) {
    e = await parseImg(e);
    if (e.img) {
      e.reply(e.img[0]);
    } else {
      e.reply("请附带图片，或对图片回复");
    }
    return true;
  }

  async image_template(e) {
    e.reply(
      "https://gchat.qpic.cn/gchatpic_new/0/0-0-替换/0?term=3&is_origin=0",
    );
    return true;
  }

  async WithDraw(e) {
    // 没引用则放行指令
    if (!e.source) return false;
    // 如果是撤回机器人的消息,则不做权限判断
    if (e.source.user_id == Bot.uin) {
      await this.withdrawFn(e);
      return true;
    }
    const { botIs, senderIs, victim, victimIs } = await this.getPermissions(e);
    // 权限不够
    if (botIs <= victimIs) {
      // e.reply生草图片
      return true;
    }
    // 主人可命令撤回任何权限内消息
    if (cfg.masterQQ.includes(e.user_id)) {
      await this.withdrawFn(e);
      return true;
    }
    // 机器人无法撤回发起者的消息时;平民没有权限;要撤回主人的消息时
    if (
      botIs <= senderIs ||
      senderIs == 1 ||
      cfg.masterQQ.includes(e.source.user_id)
    ) {
      e.reply(
        segment.image(
          "https://gchat.qpic.cn/gchatpic_new/1761869682/2077086404-3170617512-116FDFF74709D345FAF0EACD13357D61/0?term=3&is_origin=0",
        ),
      );
      return true;
    }
    await this.withdrawFn(e);
    return true;
  }

  /** 判断权限等级 */
  async getPermissions(e) {
    const botIs = e.group.is_owner ? 3 : e.group.is_admin ? 2 : 1;
    const sender = await e.group.pickMember(e.sender.user_id);
    const senderIs =
      // e.isMaster      ? 4      :
      sender.is_owner ? 3 : sender.is_admin ? 2 : 1;
    // let target = await e.group.pickMember(e.source.user_id?e.source.user_id:e.at);
    const victim = await e.group.pickMember(e.at);
    const victimIs = victim.is_owner ? 3 : victim.is_admin ? 2 : 1;
    return {
      botIs,
      sender,
      senderIs,
      victim,
      victimIs,
    };
  }

  async withdrawFn(e) {
    try {
      e.group.recallMsg(e.source.seq, e.source.rand);
      e.group.recallMsg(e.message_id);
    } catch (err) {}
  }

  async apDoc(e) {
    e.reply("https://ap-plugin.com/Config/", true);
    return true;
  }

  async apWordCloud(e) {
    if (e.at) e.user_id = e.at;
    const type = e.msg.match(/(全局|本群|我的)/)[1];
    if (!e.group_id && type == "本群") {
      return e.reply("请在相应群聊使用本指令", true);
    }
    let tags = await redis.get(
      `Yz:AiPainting:TagsUsage:${
        type == "我的" ? e.user_id : type == "本群" ? e.group_id : "Global"
      }`,
    );
    if (!tags) return e.reply("暂无数据", true);
    tags = JSON.parse(tags);
    const tagCloud = [];
    for (const tag in tags) {
      tagCloud.push({
        word: tag,
        weight: tags[tag],
      });
    }
    tagCloud.sort((a, b) => b.value - a.value);
    const data = {
      quality: 90,
      tplFile: "./plugins/ap-plugin/resources/textrank/textrank.html",
      pluResPath: `${_path}/plugins/ap-plugin/resources/`,
      chartData: JSON.stringify(tagCloud),
    };
    const img = await puppeteer.screenshot("textrank", data);
    e.reply(img);
    return true;
  }

  async apStatus(e) {
    const apcfg = await Config.getcfg();
    if (apcfg.APIList.length == 0) {
      e.reply("当前暂无可用接口");
      return true;
    }
    let msg = "共有" + apcfg.APIList.length + "个接口";
    const res = await Promise.all(
      apcfg.APIList.map(async (item) => {
        const res = await axios
          .get(item.url, { timeout: 5000 })
          .catch(() => {});
        return res;
      }),
    );
    for (let i = 0; i < res.length; i++) {
      if (res[i]) {
        let header = {};
        if (apcfg.APIList[i].account_id && apcfg.APIList[i].account_password) {
          header = {
            Authorization:
              "Basic " +
              Buffer.from(
                `${apcfg.APIList[i].account_id}:${apcfg.APIList[i].account_password}`,
              ).toString("base64"),
            "User-Agent": "AP-Plugin",
          };
        }
        const progress = await axios
          .get(`${apcfg.APIList[i].url}/sdapi/v1/progress`, {
            headers: header,
            timeout: 5000,
          })
          .catch(() => {});
        if (progress) {
          if (progress.data.eta_relative == "0") {
            msg += `\n✅接口${i + 1}[${res[i].status}]：${
              apcfg.APIList[i].remark
            } 服务器很寂寞...`;
          } else {
            msg += `\n✅接口${i + 1}[${res[i].status}]：${
              apcfg.APIList[i].remark
            } [${(progress.data.progress * 100).toFixed(
              0,
            )}%]预计剩余${progress.data.eta_relative.toFixed(2)}秒完成`;
          }
        } else {
          msg += `\n✅接口${i + 1}[${res[i].status}]：${
            apcfg.APIList[i].remark
          } 未能获取进度`;
        }
      } else {
        msg += `\n🚫接口${i + 1}[超时]：${apcfg.APIList[i].remark}`;
      }
    }
    e.reply(msg);
    return true;
  }

  async apCancel(e) {
    const apcfg = await Config.getcfg();
    if (apcfg.APIList.length == 0) {
      e.reply("当前暂无可用接口");
      return true;
    }
    let num = e.msg.match(/接口(\d+)/);
    if (num) {
      num = parseInt(num[1]) - 1;
      if (num > apcfg.APIList.length) return e.reply("接口不存在");
    } else {
      num = apcfg.usingAPI - 1;
    }
    const url = apcfg.APIList[num].url + "/sdapi/v1/interrupt";
    let header = {};
    if (apcfg.APIList[num].account_id && apcfg.APIList[num].account_password) {
      header = {
        Authorization:
          "Basic " +
          Buffer.from(
            `${apcfg.APIList[num].account_id}:${apcfg.APIList[num].account_password}`,
          ).toString("base64"),
        "User-Agent": "AP-Plugin",
      };
    }
    try {
      const res = await axios.post(url, { headers: header, timeout: 5000 });
      if (res) {
        e.reply(
          `接口${num + 1}：${apcfg.APIList[num].remark}已取消当前绘制任务`,
        );
      } else {
        e.reply(`接口${num + 1}：${apcfg.APIList[num].remark}取消任务失败`);
      }
    } catch (err) {
      e.reply(`接口${num + 1}：${apcfg.APIList[num].remark}取消任务失败`);
    }
    return true;
  }
}
