/*
 * @Author: 渔火Arcadia  https://github.com/yhArcadia
 * @Date: 2022-12-20 01:22:53
 * @LastEditors: 苏沫柒 3146312184@qq.com
 * @LastEditTime: 2023-05-07 12:15:07
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\components\ai_painting\draw.js
 * @Description: 请求接口获取图片
 *
 * Copyright (c) 2022 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved.
 */
import Config from "./config.js";
import cfg from "../../../../lib/config/config.js";
import NsfwCheck from "./nsfwcheck.js";
import moment from "moment";
import path from "path";
import fs from "fs";
import fetch from "node-fetch";
import { bs64Size } from "../../utils/utils.js";
import Log from "../../utils/Log.js";
import process from "process";
import { Pictools } from "../../utils/utidx.js";

class Draw {
  /**获取一张图片。返回base64
   * @param {object} paramdata 绘图参数
   * @return {object} 获取成功时返回 ： { code: 0,   isnsfw: 是否合规,   seed: seed,   size: 图片大小(KB),   md5:图片的md5,   base64: 图片的base64 }
   * 获取失败时code非零 ： { code: ?, info: 简要描述错误, msg: 错误信息, description: 回复给用户的消息内容 }
   */
  async get_a_pic(paramdata) {
    // 读取接口地址和接口备注
    let config = await Config.getcfg();
    if (config.APIList.length == 0)
      return {
        code: 41,
        info: "未配置接口",
        msg: "",
        description: "当前无可用绘图接口，请先配置接口。\n配置指令： #ap添加接口\n参考文档：https://www.wolai.com/tiamcvmiaLJLePhTr4LAJE\n发送#ap说明书以查看详细说明",
      };
    let index = paramdata.specifyAPI || config.usingAPI;
    let apiobj = config.APIList[index - 1];
    let api = apiobj.url; //接口
    let remark = apiobj.remark; //接口备注

    // 请求图片
    Log.m("尝试获取一张图片，使用接口：", remark);
    let response;
    try {
      response = await i(paramdata, apiobj);
    } catch (err) {
      // 处理错误
      if (err.code == "ETIMEDOUT")
        return {
          code: 11,
          info: "访问超时",
          msg: err.message,
          description: `接口${index}：${remark} 访问失败，请尝试使用其他接口`,
        };
      else if (err.code == "ECONNREFUSED")
        return {
          code: 12,
          info: "连接被拒绝",
          msg: err.message,
          description: `接口${index}：${remark} 连接被服务区拒绝：ECONNREFUSED，请检查端口号或接口是否配置正确、服务器是否开启、服务器防火墙是否放行了对应端口，或尝试使用其他接口`,
        };
      else if (err.code == "EPROTO")
        return {
          code: 13,
          info: "跨域",
          msg: err.message,
          description: `接口${index}：${remark} 协议错误：EPROTO，请检查接口是否填写正确（若服务器没有部署SSL证书，接口应当以http而不是https开头），或尝试使用其他接口`,
        };
      else if (err.code == "ERR_INVALID_URL")
        return {
          code: 14,
          info: "url不合法",
          msg: err.message,
          description: `接口${index}：${remark} url不合法：ERR_INVALID_URL\n请删除并更换接口`,
        };
      // else if (err.code.includes('Invalid character in header content'))
      //     return {
      //         code: 15,
      //         info: "开启SD鉴权的接口不支持配置token",
      //         msg: err.message,
      //         description: `接口${index}：${remark}  已开启SD鉴权，不支持配置token。请发送#ap删除接口${index}token，以删除在该接口配置的token`
      //     }
      else {
        let msg = {
          code: 10,
          info: "未知错位",
          msg: err.message,
          description: `接口${index}：${remark} 出现未知错误，请尝试使用其他接口。\n您可前往控制台查看错误日志，并反馈给开发者。`,
        };
        Log.e("【request_err】：", err);
        Log.e("【request_err_message】：", err.message);
        Log.e("【request_err_code】：", err.code);
        Log.e(msg);
        return msg;
      }
    }

    // 处理错误
    if (response.status != 200) {
      if (response.status == 401)
        return {
          code: response.status,
          info: "未授权",
          msg: response.statusText,
          description: `接口${index}：${remark} ：401 Unauthorized  \n请发送\n#ap设置接口${index}账号xxx密码xxx\n以配置账号密码`,
        };
      else if (response.status == 403)
        return {
          code: response.status,
          info: "禁止访问",
          msg: response.statusText,
          description: `接口${index}：${remark} ：403 Forbidden  \n请发送\n#ap设置接口${index}账号xxx密码xxx\n以配置账号密码`,
        };
      else if (response.status == 404)
        return {
          code: response.status,
          info: "NotFound",
          msg: response.statusText,
          description: `接口${index}：${remark} ：404 Not Found  \n请检查接口是否填写正确，或尝试使用其他接口`,
        };
      else if (response.status == 413)
        return {
          code: response.status,
          info: "请求体过大",
          msg: response.statusText,
          description: `接口${index}：${remark} ：413 Payload Too Large  \n请求实体过大，超出服务器的处理能力，请检查图片是否过大，或更改服务器端请求体大小限制`,
        };
      else if (response.status == 500)
        return {
          code: response.status,
          info: "服务器内部错误",
          msg: response.statusText,
          description: `接口${index}：${remark} ：500 Internal Server Error  \n服务器内部错误，请检查服务器是否正常运行，或尝试使用其他接口`,
        };
      else if (response.status == 502)
        return {
          code: response.status,
          info: "Bad Gateway",
          msg: response.statusText,
          description: `接口${index}：${remark} ：502 Bad Gateway  \n作为网关或代理角色的服务器，从上游服务器收到无效响应，请检查服务器是否正常运行，或尝试使用其他接口`,
        };
      else if (response.status == 503)
        return {
          code: response.status,
          info: "服务不可用",
          msg: response.statusText,
          description: `接口${index}：${remark} ：503 Service Unavailable  \n由于超载或停机维护，服务不可用，请检查服务器是否正常运行，或尝试使用其他接口`,
        };
      else if (response.status == 504)
        return {
          code: response.status,
          info: "超时",
          msg: response.statusText,
          description: `接口${index}：${remark} ：504 Gateway Timeout  \n作为网关或代理角色的服务器，未及时从上游服务器接收请求，请检查服务器是否正常运行，或尝试使用其他接口`,
        };
      else {
        let msg = {
          code: response.status,
          info: "未知错误",
          msg: response.statusText,
          description: `接口${index}：${remark} ：${response.status} ${response.statusText}  \n出现未知错误，请尝试使用其他接口。\n您可前往控制台查看错误日志，并反馈给开发者。`,
        };
        Log.e("【response_err】：", response);
        Log.e("【response_err_status】：" + response.status);
        Log.e("【response_err_statusText】：" + response.statusText);
        Log.e(msg);
        return msg;
      }
    }

    // 提取base64
    let res = await response.json();
    let base64 = res.images[0]
      .toString()
      .replace(/data:image\/png;|base64,/g, "");
    let resparam = res.parameters;
    // 图片大小太小，判断为全黑故障图片
    let [b, imagesize, mb] = bs64Size(base64);
    if (imagesize < 10) {
      Log.w("图片损坏");
      return {
        code: 21,
        info: "黑图",
        msg: "",
        description: "图片损坏，请重试。",
      };
    }

    Log.m("图片获取成功");

    // 鉴黄
    let isnsfw = false;
    if (paramdata.JH) {
      let jh = await NsfwCheck.check(base64);
      if (jh.message) {
        if (jh.message == "【AP-Plugin图片审核】本次百度图片审核超时")
          return {
            code: 32,
            info: "百度图片审核超时",
            msg: "",
            description: jh.message,
          };
        else
          return {
            code: 31,
            info: "鉴黄故障",
            msg: "",
            description: jh.message,
          };
      }
      isnsfw = jh.isnsfw;
    }

    // 图片信息
    let picinfo = await Pictools.getPicInfo(base64, true);

    //下载图片
    if (!isnsfw) {
      this.downLoadPic(paramdata, resparam.seed, base64);
    }
    return {
      code: 0,
      isnsfw: isnsfw,
      seed: resparam.seed,
      size: picinfo.size,
      md5: picinfo.md5,
      base64: base64,
      info: res.parameters,
    };
  }

  /**下载图片
   * @param {object} paramdata 绘图参数
   * @param {string} base64 图片bs64
   * @return {*}
   */
  async downLoadPic(paramdata, seed, base64) {
    let param = paramdata.param;
    let policy = await Config.getPolicy();
    if (!policy.isDownload || paramdata.message == "二次元的我") return false;

    let currentTime = moment(new Date()).format("YYMMDD_HHmmss");
    let picname = `${currentTime}_${(
      "Tags=" +
      param.tags +
      "&nTags=" +
      param.ntags
    )
      .substring(0, 170)
      .trim()}&seed=${seed}&user=${paramdata.user}.png`
      .replace("\n", "")
      .replace("\r", "")
      .replace("/", "／")
      .replace("\\", "＼")
      .replace("|", "｜")
      .replace(":", "：")
      .replace(":", "：")
      .replace("*", "＊")
      .replace("?", "？")
      .replace("<", "＜")
      .replace(">", "＞");
    let picPath = path.join(
      process.cwd(),
      "resources/yuhuo/aiPainting/pictures",
      picname
    );
    fs.writeFile(picPath, base64, "base64", (err) => {
      if (err) {
        Log.w("下载图片失败：");
        Log.w(err);
      }
    });
  }
}
async function i(paramdata, apiobj) {
  const PLUGINPATH = `${process.cwd()}/plugins/ap-plugin`,
    READMEPATH = `${PLUGINPATH}/README.md`;
  try {
    var currentVersion = /版本：(.*)/.exec(
      fs.readFileSync(READMEPATH, "utf8")
    )[1];
  } catch (err) {}
  const options = await constructRequestOption(paramdata.param, apiobj);
  if (apiobj.account_password) {
    options.headers["Authorization"] = `Basic ${Buffer.from(
      `${apiobj.account_id}:${apiobj.account_password}`,
      "utf8"
    ).toString("base64")}`;
  }
  options.headers["User-Agent"] = `AP-Plugin/@${currentVersion}`;
  options.headers[
    "Caller"
  ] = `Master:${cfg.masterQQ[0].toString()}|Bot:${Bot.uin.toString()}|User:${paramdata.user.toString()}`;
  return fetch(
    `${apiobj.url}/sdapi/v1/${paramdata.param.base64 ? "img" : "txt"}2img`,
    options
  );
}

async function constructRequestOption(param, apiobj) {
  //Log.i(param)
  let ntags = param.ntags ? param.ntags : "";
  if (!param.base64) {
    let size = param.tags.match(/(\d+)\s*[×*]\s*(\d+)/);
    if (size) {
      size = size.slice(1, 3);
    }
    if (size) {
      size[0] = Math.ceil(size[0] / 8) * 8;
      size[1] = Math.ceil(size[1] / 8) * 8;
    }
    if (size && (size[0] > 2048 || size[1] > 2048)) {
      size = null;
    }
    param.tags = param.tags.replace(/(\d+)\s*[×*]\s*(\d+)/, "").trim();
    param.width = size ? size[0] : param.width;
    param.height = size ? size[1] : param.height;
    if (param.tags.match(/(H|h)ires(\.?fix)?/)) {
      let hr_scale = param.tags.match(/(H|h)ires(\.?fix)?\s*(\d+(\.\d+)?)?/)[3];
      if (hr_scale) {
        hr_scale = Number(hr_scale).toFixed(2);
      } else {
        hr_scale = 2;
      }
      if (hr_scale >= 1 && hr_scale <= 4) {
        hr_scale = 2;
      }
      param.tags = param.tags
        .replace(/(H|h)ires(\.?fix)?\s*(\d+(\.\d+)?)?/, "")
        .trim();
      param.enable_hr = true;
      param.denoising_strength = 0.7;
      (param.hr_scale = hr_scale), (param.hr_upscaler = "Latent");
      param.hr_second_pass_steps = param.steps;
      param.width = Math.ceil(param.width / param.hr_scale);
      param.height = Math.ceil(param.height / param.hr_scale);
      param.width = Math.ceil(param.width / 8) * 8;
      param.height = Math.ceil(param.height / 8) * 8;
    }
  }
  let seed = param.seed;
  if (seed == -1) {
    seed = Math.floor(Math.random() * 2147483647);
  }
  // 请求接口判断是否存在指定sampler
  if (param.sampler != "Euler a") {
    const PLUGINPATH = `${process.cwd()}/plugins/ap-plugin`,
      READMEPATH = `${PLUGINPATH}/README.md`;
    try {
      var currentVersion = /版本：(.*)/.exec(
        fs.readFileSync(READMEPATH, "utf8")
      )[1];
    } catch (err) {}
    try {
      let res = await fetch(apiobj.url + "/sdapi/v1/samplers", {
        headers: {
          "User-Agent": "AP-Plugin/@" + currentVersion,
          Authorization: `Basic ${Buffer.from(
            `${apiobj.account_id}:${apiobj.account_password}`,
            "utf8"
          ).toString("base64")}`,
        },
      });
      res = await res.json();
      let exist = false;
      for (let val of res) {
        if (val.name == param.sampler) {
          exist = true;
          break;
        }
      }
      Log.i(`指定的采样器${param.sampler}：${exist ? "存在" : "不存在"}`);
      if (!exist) {
        param.sampler = "Euler a";
        Log.i("接口不存在该采样器，默认使用Euler a");
      }
    } catch (err) {
      param.sampler = "Euler a";
      Log.i("采样器列表请求出错，默认使用Euler a");
    }
  }

  let setting = await Config.getSetting();

  let data;
  // 文生图
  if (!param.base64) {
    data = {
      enable_hr: param.enable_hr ? true : false,
      denoising_strength: param.strength ? param.strength : 0,
      firstphase_width: 0,
      firstphase_height: 0,
      hr_scale: param.hr_scale ? param.hr_scale : 2,
      hr_upscaler: param.hr_upscaler ? param.hr_upscaler : "Latent",
      hr_second_pass_steps: param.hr_second_pass_steps
        ? param.hr_second_pass_steps
        : 0,
      override_settings: {},
      prompt: param.tags + setting.def_prompt,
      seed: seed,
      steps: param.steps,
      cfg_scale: param.scale,
      height: param.height,
      width: param.width,
      negative_prompt: ntags + setting.def_negativeprompt,
      sampler_index: param.sampler,
    };
  }
  // 图生图
  else {
    data = {
      init_images: ["data:image/jpeg;base64," + param.base64],
      sampler_index: param.sampler,
      denoising_strength: param.strength,
      prompt: param.tags + setting.def_prompt,
      seed: seed,
      steps: param.steps,
      cfg_scale: param.scale,
      width: param.width,
      height: param.height,
      negative_prompt: ntags + setting.def_negativeprompt,
      styles: ["string"],
      mask: "mask" in param ? param.mask : null,
      mask_blur: "mask_blur" in param ? param.mask_blur : NaN,
      inpainting_mask_invert:
        "inpainting_mask_invert" in param ? param.inpainting_mask_invert : NaN,
    };
  }

  let options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };
  return options;
}

export default new Draw();
