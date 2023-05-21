import plugin from '../../../lib/plugins/plugin.js';
import axios from 'axios';
import fs from 'fs';
import YAML from 'yaml';
import picTool from '../utils/pic_tools.js';
import cfg from '../../../lib/config/config.js'
import { parseImg } from '../utils/utils.js';
import Config from '../components/ai_painting/config.js';
import Log from '../utils/Log.js';

const configPath = process.cwd() + '/plugins/ap-plugin/config/config/controlnet.yaml';

let config = {};
let getImagetime = {}
let msgList = {}

if (fs.existsSync(configPath)) {
  config = YAML.parse(fs.readFileSync(configPath, 'utf8'));
}

export class ControlNet extends plugin {
  constructor() {
    super({
      name: 'AP-控制网',
      dsc: '控制网',
      event: 'message',
      priority: 1009,
      rule: [
        {
          reg: '^#?以图绘图(.*)$',
          fnc: 'controlNet'
        },
        {
          reg: '^#?预处理$',
          fnc: 'controlNetPreprocess'
        },
        {
          reg: '^#?控制网模型$',
          fnc: 'controlNetModelList'
        },
        {
          reg: '^#?控制网预处理器$',
          fnc: 'controlNetModuleList'
        },
        {
          reg: '^#?控制网设置模型(.*)$',
          fnc: 'controlNetSetModel'
        },
        {
          reg: '^#?控制网设置预处理器(.*)$',
          fnc: 'controlNetSetModule'
        },
        {
          reg: '^.*$',
          fnc: 'getImage',
          log: false
        }
      ]
    });
  }

  async controlNet(e) {
    const api = await getAPI(e);
    const parseData = YAML.parse(fs.readFileSync(process.cwd() + '/plugins/ap-plugin/config/config/parse.yaml', 'utf8'));
    if (!config[e.user_id]) {
      config[e.user_id] = {
        "module": "lineart_anime",
        "model": "control_v11p_sd15s2_lineart_anime [3825e83e]"
      };
      e.reply('未配置预处理器与模型，已自动设置为lineart_anime', true);
    }

    const url = api + '/sdapi/v1/txt2img';
    const anurl = api + '/controlnet/txt2img';
    let tags;
    if (e.msg) {
      tags = e.msg.replace(/^#?以图绘图/, '');
    } else {
      tags = msgList[e.user_id];
    }

    let base64;
    let height;
    let width;
    e = await parseImg(e);
    if (e.img) {
      const picInfo = await picTool.getPicInfo(e.img[0]);
      base64 = picInfo.base64;
      height = picInfo.height;
      width = picInfo.width;
    } else {
      e.reply('请在60s内发送的图片~', true);
      msgList[e.user_id] = e.msg.replace(/^#?以图绘图/, '');
      getImagetime[e.user_id] = setTimeout(() => {
        if (getImagetime[e.user_id]) {
          e.reply('已超时，请再次发送命令~', true);
          delete getImagetime[e.user_id];
        }
      }, 60000);
      return false;
    }

    if (height > 2048 || width > 2048) {
      e.reply('图片过大，无法处理', true);
      return true;
    }

    e.reply(`● 正在使用ControlNet生成图片\n◎ 使用预处理器：${config[e.user_id].module}\n◎ 使用模型：${config[e.user_id].model}`);

    let paramData = parseData[e.user_id] || parseData.default;
    let setting = await Config.getSetting()

    const data = {
      "enable_hr": paramData.enable_hr,
      "denoising_strength": paramData.strength,
      "hr_scale": paramData.hr_scale,
      "hr_upscaler": paramData.hr_upscaler,
      "hr_second_pass_steps": paramData.hr_second_pass_steps,
      "prompt": tags + setting.def_prompt,
      "seed": -1,
      "steps": paramData.steps,
      "cfg_scale": paramData.scale,
      "height": height,
      "width": width,
      "negative_prompt": setting.def_negativeprompt,
      "sampler_name": paramData.sampler,
      "alwayson_scripts": {
        "controlnet": {
          "args": [{
            "input_image": "data:image/png;base64," + base64,
            "module": config[e.user_id].module,
            "model": config[e.user_id].model,
            "weight": 1,
            "resize_mode": "Scale to Fit (Inner Fit)",
            "lowvram": false,
            "processor_res": Math.sqrt(height * width),
            "threshold_a": 100,
            "threshold_b": 250,
          }]
        }
      }
    };
    const andata = {
      "enable_hr": paramData.enable_hr,
      "denoising_strength": paramData.strength,
      "hr_scale": paramData.hr_scale,
      "hr_upscaler": paramData.hr_upscaler,
      "hr_second_pass_steps": paramData.hr_second_pass_steps,
      "prompt": tags + setting.def_prompt,
      "seed": -1,
      "steps": paramData.steps,
      "cfg_scale": paramData.scale,
      "height": height,
      "width": width,
      "negative_prompt": setting.def_negativeprompt,
      "sampler_name": paramData.sampler,
      "alwayson_scripts": {},
      "controlnet_units": [{
        "input_image": "data:image/png;base64," + base64,
        "module": config[e.user_id].module,
        "model": config[e.user_id].model,
        "weight": 1,
        "resize_mode": "Scale to Fit (Inner Fit)",
        "lowvram": false,
        "processor_res": Math.sqrt(height * width),
        "threshold_a": 100,
        "threshold_b": 250,
      }]
    };
    let useUrl = anurl;
    let useData = andata;
    await axios.get(useUrl).catch(async (error) => {
      if (error.response.status === 404) {
        useUrl = url;
        useData = data;
        Log.w(`ControlNet找不到旧版接口，已切换为新版接口`)
      }
    });
    let apcfg = await Config.getcfg()
    let header = {}
    if (apcfg.APIList[apcfg.usingAPI - 1].account_id && apcfg.APIList[apcfg.usingAPI - 1].account_password) {
      header = {
        'Authorization': 'Basic ' + Buffer.from(`${apcfg.APIList[apcfg.usingAPI - 1].account_id}:${apcfg.APIList[apcfg.usingAPI - 1].account_password}`).toString('base64')
      }
    }
    try {
      const response = await axios.post(useUrl, useData, { headers: header });
      await e.reply(segment.image(`base64://${response.data.images[0]}`), true);
      sendMsg(e, [`● 图片生成成功\n◎ 使用的预处理器：${config[e.user_id].module}\n◎ 使用的模型：${config[e.user_id].model}\n◎ 蒙版图片：`, segment.image(`base64://${response.data.images[1]}`)]);
    } catch (error) {
      e.reply('生成失败', true);
      Log.e(error);
    }
    return true;
  }

  async controlNetPreprocess(e) {
    const api = await getAPI(e);
    if (!config[e.user_id]) {
      config[e.user_id] = {
        "module": "lineart_anime",
        "model": "control_v11p_sd15s2_lineart_anime [3825e83e]"
      };
      e.reply('未配置预处理器与模型，已自动设置为lineart_anime', true);
    }

    let base64;
    let height;
    let width;
    e = await parseImg(e);
    if (e.img) {
      const picInfo = await picTool.getPicInfo(e.img[0]);
      base64 = picInfo.base64;
      height = picInfo.height;
      width = picInfo.width;
    } else {
      e.reply('请携带图片使用该功能', true);
      return true;
    }

    if (height > 2048 || width > 2048) {
      e.reply('图片过大，无法处理', true);
      return true;
    }
    e.reply(`● 正在使用ControlNet预处理图片\n◎ 使用预处理器：${config[e.user_id].module}`)
    let data = {
      "controlnet_module": config[e.user_id].module,
      "controlnet_input_images": [`data:image/png;base64, ${base64}`],
      "controlnet_processor_res": 512,
      "controlnet_threshold_a": 64,
      "controlnet_threshold_b": 64
    }
    try {
      const res = await axios.post(api + '/controlnet/detect', data);
      e.reply([`● 图片生成成功\n◎ 使用的预处理器：${config[e.user_id].module}\n◎ 蒙版图片：`, segment.image(`base64://${res.data.images[0]}`)]);
      return true;
    } catch (error) {
      e.reply('生成失败', true);
      Log.e(error);
      return true;
    }
  }

  async controlNetModelList(e) {
    const api = await getAPI(e);
    try {
      const res = await axios.get(api + '/controlnet/model_list');
      const data = res.data;
      let msg = '以下是当前可用的模型：';

      data.model_list.forEach((item, index) => {
        msg += `\n${item}`;
      });

      sendMsg(e, msg)
    } catch (error) {
      e.reply('获取失败', true);
    }
  }

  async controlNetModuleList(e) {
    const api = await getAPI(e);
    try {
      const res = await axios.get(api + '/controlnet/module_list');
      const data = res.data;
      let msg = '以下是当前可用的预处理器：';

      data.module_list.forEach((item, index) => {
        msg += `\n${item}`;
      });

      sendMsg(e, msg);
    } catch (error) {
      e.reply('获取失败', true);
    }
  }

  async controlNetSetModel(e) {
    const api = await getAPI(e);
    const model = e.msg.replace(/^#?控制网设置模型/, '');
    const res = await axios.get(api + '/controlnet/model_list');
    const data = res.data;
    let flag = false;

    data.model_list.forEach((item, index) => {
      if (item == model) {
        flag = true;
      }
    });

    if (flag) {
      config[e.user_id].model = model;
      fs.writeFileSync(configPath, YAML.stringify(config));
      e.reply('已将模型设置为' + model, true);
    } else {
      e.reply('不存在该模型', true);
    }
  }

  async controlNetSetModule(e) {
    const api = await getAPI(e);
    const module = e.msg.replace(/^#?控制网设置预处理器/, '');
    const res = await axios.get(api + '/controlnet/module_list');
    const data = res.data;
    let flag = false;

    data.module_list.forEach((item, index) => {
      if (item == module) {
        flag = true;
      }
    });

    if (flag) {
      config[e.user_id].module = module;
      fs.writeFileSync(configPath, YAML.stringify(config));
      e.reply('已将预处理器设置为' + module, true);
      // 匹配模型
      let modulelist = await axios.get(api + '/controlnet/model_list');
      modulelist = modulelist.data.model_list;
      let model = findSimilar(module, modulelist);
      if (model) {
        config[e.user_id].model = model;
        fs.writeFileSync(configPath, YAML.stringify(config));
        e.reply(`已自动设置模型为${model}`, true);
      }
    } else {
      e.reply('不存在该预处理器', true);
    }
  }
  async getImage(e) {
    if (!this.e.img) {
      return false;
    }
    if (getImagetime[e.user_id]) {
      clearTimeout(getImagetime[e.user_id]);
      delete getImagetime[e.user_id];
    } else {
      return false;
    }
    let result = await this.controlNet(e);
    if (result) {
      return true;
    }
  }
}

async function sendMsg(e, msg) {
  let data_msg = [];
  data_msg.push({
    message: msg,
    nickname: Bot.nickname,
    user_id: cfg.qq,
  });
  let send_res = null;
  if (e.isGroup)
    send_res = await e.reply(await e.group.makeForwardMsg(data_msg));
  else send_res = await e.reply(await e.friend.makeForwardMsg(data_msg));
  if (!send_res) {
    e.reply("消息发送失败，可能被风控~");
  }
  return true;
}
async function getAPI(e) {
  let config = await Config.getcfg()
  if (config.APIList.length == 0) {
    e.reply(`当前无可用绘图接口，请先配置接口。\n配置指令： #ap添加接口\n参考文档：https://www.wolai.com/tiamcvmiaLJLePhTr4LAJE\n发送#ap说明书以查看详细说明`)
    return true
  }
  let api = config.APIList[config.usingAPI - 1].url
  return api
}

function findSimilar(str, arr) {
  const tokens = str.split('_');
  for (let word of arr) {
    if (tokens.some(token => word.includes(token))) {
      return word;
    }
  }
  return null;
}