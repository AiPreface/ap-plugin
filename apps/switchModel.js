import plugin from '../../../lib/plugins/plugin.js'
import fetch from 'node-fetch';
import Config from '../components/ai_painting/config.js';
import Log from '../utils/Log.js';
import cfg from "../../../lib/config/config.js";

export class ChangeModel extends plugin {
  constructor () {
    super({
      /** 功能名称 */
      name: '模型切换',
      /** 功能描述 */
      dsc: '^模型切换',
      /** https://oicqjs.github.io/oicq/#events */
      event: 'message',
      /** 优先级，数字越小等级越高 */
      priority: 5000,
      rule: [
        {
          /** 命令正则匹配 */
          reg: '^#?模型列表$',
          /** 执行方法 */
          fnc: 'modelList',
        },
        {
          /** 命令正则匹配 */
          reg: '^#?切换模型(.*)$',
          /** 执行方法 */
          fnc: 'changeModel',
          /** 主人权限 */
          permission: "master",
        },
        {
          /** 命令正则匹配 */
          reg: '^#?(VAE|vae|Vae)列表$',
          /** 执行方法 */
          fnc: 'VAEList',
        },
        {
          /** 命令正则匹配 */
          reg: '^#?切换(VAE|vae|Vae)(.*)$',
          /** 执行方法 */
          fnc: 'changeVAE',
          /** 主人权限 */
          permission: "master",
        },
      ]
    })
  }

  async modelList(e) {
    let apiurl = await get_apiurl();
    let config = await Config.getcfg()
    let apiobj = config.APIList[config.usingAPI - 1]
    let url = apiurl + '/sdapi/v1/options';
    const headers = {
      "Content-Type": "application/json"
    };
    if (apiobj.account_password) {
      headers.Authorization = `Basic ${Buffer.from(apiobj.account_id + ':' + apiobj.account_password, 'utf8').toString('base64')} `
    }
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });
    const optionsdata = await response.json();
    let msg = "正在使用的模型：\n" + optionsdata['sd_model_checkpoint'] + "\n\n可用模型列表：";
    let modelList = await get_model_list();
    if (modelList.length == 0) {
      msg.push("\n模型列表为空");
    } else {
      for (var i = 0; i < modelList.length; i++) {
        modelList[i] = modelList[i].replace(/^.*\//, '');
        msg = msg + "\n" + modelList[i];
      }
    }
    let data_msg = []
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

  async VAEList(e) {
    try {
    let apiurl = await get_apiurl();
    let url = apiurl + '/sdapi/v1/options';
    const headers = {
      "Content-Type": "application/json"
    };
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });
    const optionsdata = await response.json();
    let msg = ["正在使用的VAE：\n" + optionsdata['sd_vae'] + "\n\n可用VAE列表："];
    let VAEList = await get_vae_list();
    if (VAEList.length == 0) {
      msg.push("\nVAE列表为空");
    } else {
      for (var i = 0; i < VAEList.length; i++) {
        VAEList[i] = VAEList[i].replace(/^.*\//, '');
        msg.push("\n" + VAEList[i]);
      }
    }
    e.reply(msg, true);
    return true;
    } catch (error) {
      Log.e(error);
      e.reply("获取VAE列表失败", true);
      return true;
    }
  }

  async changeModel(e) {
    let apiurl = await get_apiurl();
    let config = await Config.getcfg()
    let apiobj = config.APIList[config.usingAPI - 1]
    let model = e.msg.replace(/^#?切换模型/, '');
    model = model.trim();
    if (model == "") {
      e.reply("模型名不能为空", true);
      return true;
    }
    let modelList = await get_model_list();
    Log.i("模型列表是" + modelList);
    Log.i("要切换的模型是" + model);
    let modelPrefix = modelList.filter(function (item) {
      return item.indexOf(model) == 0;
    });
    Log.i("匹配的模型是" + modelPrefix);
    if (modelPrefix.length == 0) {
      e.reply("模型不存在", true);
      return false;
    } else if (modelPrefix.length > 1) {
      e.reply("模型名不唯一", true);
      return false;
    } else {
      e.reply("正在切换模型，请耐心等待\n请不要随意切换不属于自己的接口，这会导致该接口所有用户的模型被切换！！！", true)
      let url = apiurl + '/sdapi/v1/options';
      let data = {
        "sd_model_checkpoint": modelPrefix[0]
      };
      const headers = {
        "Content-Type": "application/json"
      };
      if (apiobj.account_password) {
        headers.Authorization = `Basic ${Buffer.from(apiobj.account_id + ':' + apiobj.account_password, 'utf8').toString('base64')} `
      }
      let response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: headers
      });
      const optionsdata = await response.json();
      if (optionsdata){
        e.reply("模型切换失败", true);
      } else {
        e.reply("模型切换成功", true);
      }
    }
    return true;
  }

  async changeVAE(e) {
    try {
    let apiurl = await get_apiurl();
    let VAE = e.msg.replace(/^#?切换(VAE|vae|Vae)/, '');
    VAE = VAE.trim();
    if (VAE == "") {
      e.reply("VAE不能为空", true);
      return true;
    }
    let VAEList = await get_vae_list();
    if (VAEList == ["当前接口WebUI设置了密码，无法获取VAE列表"]) {
      e.reply("当前接口WebUI设置了密码，无法获取VAE列表并切换", true);
      return true;
    }
    Log.i("模型列表是" + VAEList);
    Log.i("要切换的模型是" + VAE);
    let VAEPrefix = VAEList.filter(function (item) {
      return item.indexOf(VAE) == 0;
    });
    Log.i("匹配的模型是" + VAEPrefix);
    if (VAEPrefix.length == 0) {
      e.reply("模型不存在", true);
      return false;
    } else if (VAEPrefix.length > 1) {
      e.reply("模型名不唯一", true);
      return false;
    } else {
      e.reply("正在切换模型，请耐心等待\n请不要随意切换不属于自己的接口，这会导致该接口所有用户的模型被切换！！！", true)
      let url = apiurl + '/sdapi/v1/options';
      let data = {
        "sd_vae": VAEPrefix[0]
      };
      const headers = {
        "Content-Type": "application/json"
      };
      let response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: headers
      });
      const optionsdata = await response.json();
      if (optionsdata){
        e.reply("VAE切换失败", true);
      } else {
        e.reply("VAE切换成功", true);
      }
    }
    return true;
    } catch (error) {
      e.reply("VAE切换失败", true);
      return true;
    }
  }
}



async function get_model_list() {
  let apiurl = await get_apiurl();
  let config = await Config.getcfg()
  let apiobj = config.APIList[config.usingAPI - 1]
  let url = apiurl + '/sdapi/v1/sd-models';
  const headers = {
    "Content-Type": "application/json"
  };
  if (apiobj.account_password) {
    headers.Authorization = `Basic ${Buffer.from(apiobj.account_id + ':' + apiobj.account_password, 'utf8').toString('base64')} `
  }
  const response = await fetch(url, {
    method: 'GET',
    headers: headers
  });
  const modeldata = await response.json();
  let model_list = [];
  let model_name = [];
  for (var i in modeldata) {
    model_list.push(modeldata[i]['title']);
    model_name.push(modeldata[i]['model_name']);
  }
  return model_list
}

async function get_vae_list() {
  let apiurl = await get_apiurl();
  let url = apiurl + '/config';
  const headers = {
    "Content-Type": "application/json",
  };
  const response = await fetch(url, {
    method: 'GET',
    headers: headers,
  });
  const vaedata = await response.json();
  if (vaedata.detail == "Not authenticated") {
    return ["当前接口WebUI设置了密码，无法获取VAE列表"]
  }
  let vae_list = [];
  for (var i in vaedata['components']) {
    if (vaedata['components'][i]['id'] == 953) {
      vae_list = vaedata['components'][i]['props']['choices'];
    }
  }
  return vae_list
}

async function get_apiurl() {
  let config = await Config.getcfg();
  if (config.APIList.length == 0) {
    e.reply("当前无可用绘图接口，请先配置接口。\n配置指令： #ap添加接口\n参考文档：https://www.wolai.com/tiamcvmiaLJLePhTr4LAJE\n发送#ap说明书以查看详细说明", true);
    return true;
  } else {
    let apiurl = config.APIList[config.usingAPI - 1];
    return apiurl.url;
  }
}