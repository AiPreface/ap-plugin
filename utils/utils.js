/*
 * @Author: 渔火Arcadia  https://github.com/yhArcadia
 * @Date: 2022-12-19 12:56:44
 * @LastEditors: 苏沫柒 3146312184@qq.com
 * @LastEditTime: 2023-05-03 16:30:13
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\utils\utils.js
 * @Description: 一些实用小工具
 *
 * Copyright (c) 2022 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved.
 */
// import gsCfg from "../../genshin/model/gsCfg.js";
import moment from "moment";
import Config from "../components/ai_painting/config.js";

/**
 * 处理消息中的图片：当消息引用了图片，或者消息有@对象，则将对应图片放入e.img ，优先级==> e.source.img > e.img > e.at的头像 > bot头像
 * @return {*} 处理过后的e
 */
export async function parseImg(e) {
  if (e.msg && e.msg.includes("自己")) {
    e.img = [`https://q1.qlogo.cn/g?b=qq&s=0&nk=${e.user_id}`];
  }
  if (!e.img) {
    if (e.atBot) {
      const setting = await Config.getSetting();
      if (setting.shield) {
        delete e.img;
      } else {
        e.img = [];
        e.img[0] =
          e.bot.avatar || `https://q1.qlogo.cn/g?b=qq&s=0&nk=${Bot.uin}`;
      }
    }
    if (e.at) {
      try {
        e.img = [await e.group.pickMember(e.at).getAvatarUrl()];
      } catch (error) {
        e.img = [`https://q1.qlogo.cn/g?b=qq&s=0&nk=${e.at}`];
      }
    }
  }
  if (e.source) {
    let reply;
    if (e.isGroup) {
      reply = (await e.group.getChatHistory(e.source.seq, 1)).pop()?.message;
    } else {
      reply = (await e.friend.getChatHistory(e.source.time, 1)).pop()?.message;
    }
    if (reply) {
      for (const val of reply) {
        if (val.type == "image") {
          e.img = [val.url];
          break;
        }
      }
    }
  }
  if (e.reply_id) {
    let reply = (await e.getReply(e.reply_id)).message;
    for (const val of reply) {
      if (val.type === "image") {
        e.img = [val.url];
        break;
      }
    }
  }
  return e;
}

/** 获取base64的大小 返回一个数组，依次是[b,kb,mb]；
 * @param {string} base64
 * @param {boolean} isunit 是否带单位，默认false
 * @param {number} tofix 保留小数的位数,默认两位
 * @return {array}
 */
export function bs64Size(base64, isunit = false, tofix = 2) {
  const strLength = base64.length;
  const b = parseInt(strLength - (strLength / 8) * 2);
  const size = [b, b / 1000, b / 1000 / 1000];
  size.forEach((value, index) => (size[index] = Number(value.toFixed(tofix))));
  if (isunit) {
    size.forEach(
      (value, index) =>
        (size[index] = value + (index == 0 ? "b" : index == 1 ? "kb" : "mb")),
    );
  }
  return size;
}

/** 随机获取数组中的一个成员
 * @param {array} arr 原数组
 * @return {*} 随机返回数组中的一个成员
 */
export function randomArrayMember(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// /**
//  * 通过角色别名获取角色原名
//  * @param {string} name 角色别称
//  * @return {string} 角色原名
//  * @return null：未匹配到角色名
//  */
// export function getgsName(name) {
//   const nameArr = gsCfg.getAllAbbr();
//   for (const rolename of Object.values(nameArr)) {
//     if (rolename.includes(name)) {
//       return rolename[0];
//     }
//   }
//   return null;
// }

/**
 * 获取指定用户的昵称。
 * 优先返回其在群内的名片，其次返回其QQ昵称，二者都空时返回QQ号
 * @param qq  指定的QQ号
 * @return {string} 获取到的昵称
 */
export async function getuserName(e, qq = null) {
  qq = qq || e.user_id;
  if (e && e.isGroup) {
    try {
      const member = await Bot.getGroupMemberInfo(e.group_id, qq);
      if (member != undefined) {
        const name = member.card || member.nickname || qq;
        return String(name);
      }
    } catch (err) {
      return (await e.group.pickMember(qq).getInfo()).nickname;
    }
  }
  let user;
  try {
    user = (await Bot.pickUser(qq).getSimpleInfo()).nickname;
  } catch (error) {
    try {
      user = (await e.bot.pickUser(qq).getInfo()).nickname;
    } catch (error) {
      user = "未知用户";
    }
  }
  return String(user || qq);
}

/** 获取当前到明天0点的剩余秒数
 *  * @return {string} 当前到明天0点的剩余秒数
 */
export async function seconds_to_tomorrow_0_Oclock() {
  // 获取明日0点的时间
  const time = moment(Date.now()).add(1, "days").format("YYYY-MM-DD 00:00:00");
  // 到明日零点的剩余秒数
  const exTime = Math.round(
    (new Date(time).getTime() - new Date().getTime()) / 1000,
  );
  return exTime;
}

/** 判断两个值是否相等，支持数组和对象
 * @param {*} p1 第一个值
 * @param {*} p2 第二个值
 * @return {boolean} 二者是否相等
 */
export function isEqual(p1, p2) {
  // 是数组的情况
  if (isArray(p1) && isArray(p2)) {
    if (p1.length != p2.length) {
      return false;
    }
    for (let i = 0; i < p1.length; i++) {
      if (p1[i] != p2[i]) {
        return false;
      }
    }
    return true;
  }
  // 判断如果传入的不是对象类型的话 就直接返回两个值的比较
  if (!isObject(p1) || !isObject(p2)) {
    return p1 === p2;
  }
  // 判断是否传入同一个对象
  if (p1 === p2) return true;
  // 判断两个对象的键是否一致
  const K1 = Object.keys(p1);
  const K2 = Object.keys(p2); // -> array
  if (!isEqual(K1, K2)) return false;

  const props1 = Object.getOwnPropertyNames(p1);
  const props2 = Object.getOwnPropertyNames(p2);
  if (props1.length != props2.length) {
    return false;
  }

  for (let i = 0; i < props1.length; i++) {
    const propName = props1[i];
    if (!isEqual(p1[propName], p2[propName])) {
      return false;
    }
  }
  return true;
}
function isObject(p) {
  return typeof p === "object" && p !== null;
}
function isArray(p) {
  return Array.isArray(p);
}

/** 将文本中的中文数字修改为阿拉伯数字
 * @param {string} text 待修改的文本
 * @param {string} data.regExp  当语句情况比较复杂时，可以根据语境手动指定正则表达式。中文数字推荐用 (\\\[一二三四五六七八九十零百千万亿\\\]\\\+) 来匹配
 * @param {string} data.l_text  数字左边的固定文本
 * @param {string} data.r_text  数字右边的固定文本。此二者可以用于更精准地定位要修改的数字，避免误伤。当指定了data.regExp时此二者无效
 * @return {string} 修改后的文本
 */
export function chNum2Num(text, data = {}) {
  if (!("l_text" in data)) {
    data.l_text = "";
  }
  if (!("r_text" in data)) {
    data.r_text = "";
  }
  if (!("regExp" in data)) {
    data.regExp = "";
  }

  let regExp;
  if (data.regExp) {
    regExp = new RegExp(data.regExp);
  } else {
    regExp = new RegExp(
      data.l_text + "([一二三四五六七八九十零百千万亿]+)" + data.r_text,
    );
  }
  const ret = regExp.exec(text);
  if (!ret) return text;
  const chNum = ret[1].trim();
  const enNum = numberDigit(chNum);
  if (enNum == -1) return text;
  return text.replace(chNum, enNum);
}
// 解析失败返回-1，成功返回转换后的数字，不支持负数
function numberDigit(chinese_number) {
  const map = {
    零: 0,

    一: 1,
    壹: 1,

    二: 2,
    贰: 2,
    两: 2,

    三: 3,
    叁: 3,

    四: 4,
    肆: 4,

    五: 5,
    伍: 5,

    六: 6,
    陆: 6,

    七: 7,
    柒: 7,

    八: 8,
    捌: 8,

    九: 9,
    玖: 9,

    十: 10,
    拾: 10,

    百: 100,
    佰: 100,

    千: 1000,
    仟: 1000,

    万: 10000,
    十万: 100000,
    百万: 1000000,
    千万: 10000000,
    亿: 100000000,
  };

  let len = chinese_number.length;
  if (len == 0) return -1;
  if (len == 1) return map[chinese_number] <= 10 ? map[chinese_number] : -1;
  let summary = 0;
  if (map[chinese_number[0]] == 10) {
    chinese_number = "一" + chinese_number;
    len++;
  }
  if (len >= 3 && map[chinese_number[len - 1]] < 10) {
    const last_second_num = map[chinese_number[len - 2]];
    if (
      last_second_num == 100 ||
      last_second_num == 1000 ||
      last_second_num == 10000 ||
      last_second_num == 100000000
    ) {
      for (const key in map) {
        if (map[key] == last_second_num / 10) {
          chinese_number += key;
          len += key.length;
          break;
        }
      }
    }
  }
  if (chinese_number.match(/亿/g) && chinese_number.match(/亿/g).length > 1) {
    return -1;
  }
  let splited = chinese_number.split("亿");
  if (splited.length == 2) {
    var rest = splited[1] == "" ? 0 : numberDigit(splited[1]);
    return summary + numberDigit(splited[0]) * 100000000 + rest;
  }
  splited = chinese_number.split("万");
  if (splited.length == 2) {
    var rest = splited[1] == "" ? 0 : numberDigit(splited[1]);
    return summary + numberDigit(splited[0]) * 10000 + rest;
  }
  let i = 0;
  while (i < len) {
    const first_char_num = map[chinese_number[i]];
    const second_char_num = map[chinese_number[i + 1]];
    if (second_char_num > 9) {
      summary += first_char_num * second_char_num;
    }
    i++;
    if (i == len) {
      summary += first_char_num <= 9 ? first_char_num : 0;
    }
  }
  return summary;
}

/**
 * 休眠函数
 * @param ms 毫秒
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
