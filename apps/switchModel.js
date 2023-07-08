import plugin from "../../../lib/plugins/plugin.js";
import fetch from "node-fetch";
import Config from "../components/ai_painting/config.js";
import Log from "../utils/Log.js";
import puppeteer from "../../../lib/puppeteer/puppeteer.js";

const _path = process.cwd();

export class ChangeModel extends plugin {
  constructor() {
    super({
      /** 功能名称 */
      name: "AP-模型切换",
      /** 功能描述 */
      dsc: "^模型切换",
      event: "message",
      /** 优先级，数字越小等级越高 */
      priority: 1009,
      rule: [
        {
          /** 命令正则匹配 */
          reg: "^#?模型列表$",
          /** 执行方法 */
          fnc: "modelList",
        },
        {
          /** 命令正则匹配 */
          reg: "^#?切换模型(.*)$",
          /** 执行方法 */
          fnc: "changeModel",
          /** 主人权限 */
          permission: "master",
        },
        {
          /** 命令正则匹配 */
          reg: "^#?(VAE|vae|Vae)列表$",
          /** 执行方法 */
          fnc: "VAEList",
        },
        {
          /** 命令正则匹配 */
          reg: "^#?切换(VAE|vae|Vae)(.*)$",
          /** 执行方法 */
          fnc: "changeVAE",
          /** 主人权限 */
          permission: "master",
        },
        {
          /** 命令正则匹配 */
          reg: "^#?刷新模型$",
          /** 执行方法 */
          fnc: "refreshModel",
          /** 主人权限 */
          permission: "master",
        },
      ],
    });
  }

  async modelList(e) {
    const apiurl = await get_apiurl();
    const config = await Config.getcfg();
    const apiobj = config.APIList[config.usingAPI - 1];
    const url = apiurl + "/sdapi/v1/options";
    const headers = {
      "Content-Type": "application/json",
    };
    if (apiobj.account_password) {
      headers.Authorization = `Basic ${Buffer.from(
        apiobj.account_id + ":" + apiobj.account_password,
        "utf8",
      ).toString("base64")} `;
    }
    const response = await fetch(url, {
      method: "GET",
      headers,
    });
    const optionsdata = await response.json();
    const useModel = optionsdata.sd_model_checkpoint
      .split(".")
      .slice(0, -1)
      .join(".");
    const modeldata = await get_model_list();
    const TmpModels = [];
    for (var i in modeldata) {
      TmpModels.push({
        list1: modeldata[i].model_name,
        list2: modeldata[i].hash,
      });
    }
    for (var i = 0; i < TmpModels.length; i++) {
      if (TmpModels[i].list1 == useModel) {
        TmpModels[i].able = true;
        break;
      }
    }
    const base64 = await puppeteer.screenshot("ap-plugin", {
      saveId: "swichModel",
      tplFile: `${_path}/plugins/ap-plugin/resources/listTemp/listTemp.html`,
      sidebar: "模型列表",
      list_name: "模型",
      _path,
      imgType: "png",
      header: apiobj.remark,
      models: TmpModels,
      list1: "模型名称",
      list2: "哈希值",
      notice: "使用#切换模型+序号可直接更改当前接口的模型",
    });
    e.reply(base64);
    return true;
  }

  async VAEList(e) {
    const apiurl = await get_apiurl();
    const config = await Config.getcfg();
    const apiobj = config.APIList[config.usingAPI - 1];
    const url = apiurl + "/sdapi/v1/options";
    const headers = {
      "Content-Type": "application/json",
    };
    if (apiobj.account_password) {
      headers.Authorization = `Basic ${Buffer.from(
        apiobj.account_id + ":" + apiobj.account_password,
        "utf8",
      ).toString("base64")} `;
    }
    const response = await fetch(url, {
      method: "GET",
      headers,
    });
    const optionsdata = await response.json();
    const modeldata = await get_vae_list();
    const TmpModels = [];
    for (var i in modeldata) {
      const list1 = modeldata[i].model_name.split(".").slice(0, -1).join(".");
      const list2 =
        modeldata[i].model_name.split(".")[
          modeldata[i].model_name.split(".").length - 1
        ];
      TmpModels.push({
        list1,
        list2,
      });
    }
    const useModel = optionsdata.sd_vae.split(".").slice(0, -1).join(".");
    for (var i = 0; i < TmpModels.length; i++) {
      if (TmpModels[i].list1 == useModel) {
        TmpModels[i].able = true;
        break;
      }
    }
    const base64 = await puppeteer.screenshot("ap-plugin", {
      saveId: "swichModel",
      tplFile: `${_path}/plugins/ap-plugin/resources/listTemp/listTemp.html`,
      sidebar: "VAE列表",
      list_name: "VAE",
      _path,
      imgType: "png",
      header: apiobj.remark,
      models: TmpModels,
      list1: "VAE名称",
      list2: "文件类型",
      notice: "使用#切换VAE+序号可直接更改当前接口的模型",
    });
    e.reply(base64);
    return true;
  }

  async changeModel(e) {
    const apiurl = await get_apiurl();
    const config = await Config.getcfg();
    const apiobj = config.APIList[config.usingAPI - 1];
    let model = e.msg.replace(/^#?切换模型/, "");
    model = model.trim();
    if (model == "") {
      e.reply("模型名不能为空", true);
      return true;
    }
    const modelList = await get_model_list();
    for (const i in modelList) {
      modelList[i] = modelList[i].title;
    }
    if (!isNaN(model)) {
      model = parseInt(model);
      if (model > modelList.length || model < 1) {
        e.reply("模型序号不存在", true);
        return false;
      }
      model = modelList[model - 1];
    }
    const modelPrefix = modelList.filter(function (item) {
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
      e.reply("正在切换模型，请耐心等待，即将切换为" + modelPrefix[0], true);
      const url = apiurl + "/sdapi/v1/options";
      const data = {
        sd_model_checkpoint: modelPrefix[0],
      };
      const headers = {
        "Content-Type": "application/json",
      };
      if (apiobj.account_password) {
        headers.Authorization = `Basic ${Buffer.from(
          apiobj.account_id + ":" + apiobj.account_password,
          "utf8",
        ).toString("base64")} `;
      }
      const response = await fetch(url, {
        method: "POST",
        body: JSON.stringify(data),
        headers,
      });
      const optionsdata = await response.json();
      if (optionsdata) {
        e.reply("模型切换失败", true);
      } else {
        e.reply("模型切换成功", true);
      }
    }
    return true;
  }

  async changeVAE(e) {
    try {
      const apiurl = await get_apiurl();
      let VAE = e.msg.replace(/^#?切换(VAE|vae|Vae)/, "");
      VAE = VAE.trim();
      if (VAE == "") {
        e.reply("VAE不能为空，请输入vae名称或者序号", true);
        return true;
      }
      const VAEList = await get_vae_list();
      for (const i in VAEList) {
        VAEList[i] = VAEList[i].model_name;
      }
      if (!isNaN(VAE)) {
        VAE = parseInt(VAE);
        if (VAE > VAEList.length || VAE < 1) {
          e.reply("VAE序号不存在", true);
          return false;
        }
        VAE = VAEList[VAE - 1];
      }
      VAE = VAE.trim();
      if (VAE == "") {
        e.reply("VAE不能为空", true);
        return true;
      }
      const VAEPrefix = VAEList.filter(function (item) {
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
        e.reply("正在切换模型，请耐心等待，即将切换为" + VAEPrefix[0], true);
        const url = apiurl + "/sdapi/v1/options";
        const data = {
          sd_vae: VAEPrefix[0],
        };
        const headers = {
          "Content-Type": "application/json",
        };
        const response = await fetch(url, {
          method: "POST",
          body: JSON.stringify(data),
          headers,
        });
        const optionsdata = await response.json();
        if (optionsdata) {
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

  async refreshModel(e) {
    const apiurl = await get_apiurl();
    const config = await Config.getcfg();
    const apiobj = config.APIList[config.usingAPI - 1];
    const url = apiurl + "/sdapi/v1/refresh-checkpoints";
    const headers = {
      "Content-Type": "application/json",
    };
    if (apiobj.account_password) {
      headers.Authorization = `Basic ${Buffer.from(
        apiobj.account_id + ":" + apiobj.account_password,
        "utf8",
      ).toString("base64")} `;
    }
    const response = await fetch(url, {
      method: "POST",
      headers,
    });
    if (response.status == 200) {
      e.reply("模型刷新成功", true);
    } else {
      e.reply("模型刷新失败", true);
    }
    return true;
  }
}

async function get_model_list() {
  const apiurl = await get_apiurl();
  const config = await Config.getcfg();
  const apiobj = config.APIList[config.usingAPI - 1];
  const url = apiurl + "/sdapi/v1/sd-models";
  const headers = {
    "Content-Type": "application/json",
  };
  if (apiobj.account_password) {
    headers.Authorization = `Basic ${Buffer.from(
      apiobj.account_id + ":" + apiobj.account_password,
      "utf8",
    ).toString("base64")} `;
  }
  const response = await fetch(url, {
    method: "GET",
    headers,
  });
  const modeldata = await response.json();
  return modeldata;
}

async function get_vae_list() {
  const apiurl = await get_apiurl();
  const config = await Config.getcfg();
  const apiobj = config.APIList[config.usingAPI - 1];
  const url = apiurl + "/sdapi/v1/sd-vae";
  const headers = {
    "Content-Type": "application/json",
  };
  if (apiobj.account_password) {
    headers.Authorization = `Basic ${Buffer.from(
      apiobj.account_id + ":" + apiobj.account_password,
      "utf8",
    ).toString("base64")} `;
  }
  const response = await fetch(url, {
    method: "GET",
    headers,
  });
  const modeldata = await response.json();
  return modeldata;
}

async function get_apiurl() {
  const config = await Config.getcfg();
  if (config.APIList.length == 0) {
    e.reply(
      "当前无可用绘图接口，请先配置接口。\n配置指令： #ap添加接口\n参考文档：https://ap-plugin.com/Config/\n发送#ap说明书以查看详细说明",
      true,
    );
    return true;
  } else {
    const apiurl = config.APIList[config.usingAPI - 1];
    return apiurl.url;
  }
}
