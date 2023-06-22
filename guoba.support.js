import Config from "./components/ai_painting/config.js";
import lodash from "lodash";
import path from "path";

export function supportGuoba() {
  return {
    pluginInfo: {
      name: "ap-plugin",
      title: "AP-Plugin绘图插件",
      author: "@渔火Arcadia @0卡苏打水",
      authorLink: "https://gitee.com/yhArcadia",
      link: "https://gitee.com/yhArcadia/ap-plugin",
      isV3: true,
      isV2: false,
      description: "基于Yunzai-Bot的AI绘图插件，使用Stable Diffusion接口",
      icon: "mdi:stove",
      iconColor: "#d19f56",
      iconPath: path.join(
        process.cwd() + "/plugins/ap-plugin/resources/readme/logo.png"
      ),
    },
    configInfo: {
      schemas: [
        {
          component: "Divider",
          label: "Stable Diffusion接口配置",
          componentProps: {
            orientation: "left",
            plain: true,
          },
        },
        {
          field: "config.APIList",
          label: "绘图接口",
          bottomHelpMessage:
            "用于生成图片等一系列功能，是本插件主要功能",
          component: "GSubForm",
          componentProps: {
            multiple: true,
            schemas: [
              {
                field: "url",
                label: "接口地址",
                component: "Input",
                required: true,
              },
              {
                field: "remark",
                label: "接口备注",
                component: "Input",
                required: true,
              },
              {
                field: "account_id",
                label: "接口账号",
                component: "Input",
              },
              {
                field: "account_password",
                label: "接口密码",
                component: "InputPassword",
              },
            ],
          },
        },
        {
          field: 'config.usingAPI',
          label: '使用的接口',
          component: 'Select',
          componentProps: {
            options: Config.mergeConfig().APIList.map((item, index) => { return { label: item.remark, value: index + 1 } })
          },
        },
        {
          component: "Divider",
          label: "百度图片审核配置",
          componentProps: {
            orientation: "left",
            plain: true,
          },
        },
        {
          field: "config.baidu_appid",
          label: "ID",
          bottomHelpMessage:
            "用于图片审核服务，请在百度云图片审核应用列表中查看",
          component: "Input",
          required: false,
          componentProps: {
            maxlength: 8,
            showCount: true,
            placeholder: "请输入BAIDU_APPID",
          },
        },
        {
          field: "config.baidu_apikey",
          label: "APIKEY",
          bottomHelpMessage:
            "用于图片审核服务，请在百度云图片审核应用列表中查看",
          component: "Input",
          required: false,
          componentProps: {
            maxlength: 24,
            showCount: true,
            placeholder: "请输入BAIDU_APIKEY",
          },
        },
        {
          field: "config.baidu_secretkey",
          label: "SECRETKEY",
          bottomHelpMessage:
            "用于图片审核服务，请在百度云图片审核应用列表中查看",
          component: "Input",
          required: false,
          componentProps: {
            maxlength: 32,
            showCount: true,
            placeholder: "请输入BAIDU_SECRETKEY",
          },
        },
        {
          component: "Divider",
          label: "附加功能接口配置",
          componentProps: {
            orientation: "left",
            plain: true,
          },
        },
        {
          field: "config.Real_CUGAN",
          label: "大清晰术接口",
          bottomHelpMessage: "用于超分，放大图片",
          component: "Input",
          required: false,
          componentProps: {
            placeholder:
              "请输入接口地址，如https://dianxian-real-cugan.hf.space/api/predict",
          },
        },
        {
          field: "config.appreciate",
          label: "图片鉴赏接口",
          bottomHelpMessage: "用于鉴赏，二次元的我功能",
          component: "Input",
          required: false,
          componentProps: {
            placeholder:
              "请输入接口地址，如https://nocrypt-deepdanbooru-string.hf.space/api/predict",
          },
        },

        {
          field: "config.ai_detect",
          label: "图片鉴定接口",
          bottomHelpMessage: "用于检测图片是否为AI所作，如：",
          component: "Input",
          required: false,
          componentProps: {
            placeholder:
              "请输入接口地址，如https://saltacc-anime-ai-detect.hf.space/run/predict",
          },
        },
        {
          field: "config.remove_bg",
          label: "图片去背景接口",
          bottomHelpMessage: "用于去除图片背景",
          component: "Input",
          required: false,
          componentProps: {
            placeholder:
              "请输入接口地址，如https://huggingface.co/spaces/skytnt/anime-remove-background",
          },
        },
        {
          field: "config.cartoonization",
          label: "图片动漫化接口",
          bottomHelpMessage: "用于图片动漫化",
          component: "Input",
          required: false,
          componentProps: {
            placeholder:
              "请输入接口地址，如https://hylee-white-box-cartoonization.hf.space/api/predict/",
          },
        },
        {
          field: "config.img_to_music",
          label: "图片转音乐接口",
          bottomHelpMessage: "用于图片转音乐",
          component: "Input",
          required: false,
          componentProps: {
            placeholder:
              "请输入接口地址，如https://fffiloni-img-to-music.hf.space/run/i2m",
          },
        },
        {
          field: "config.anime_aesthetic_predict",
          label: "图片美学评分接口",
          bottomHelpMessage: "用于图片美学评分",
          component: "Input",
          required: false,
          componentProps: {
            placeholder:
              "请输入接口地址，如https://skytnt-anime-aesthetic-predict.hf.space/run/predict",
          },
        },
        {
          field: "config.openai_key",
          label: "OpenAI密钥",
          bottomHelpMessage: "用于自然语言处理",
          component: "InputPassword",
          required: false,
          componentProps: {
            placeholder:
              "请输入密钥，如sk-tZgIILD1th6DqMiBM3VZH3BlbkFJnyEYu9t9kfQEzC6ocBOS",
            maxlength: 51,
            showCount: true,
          },
        },
        {
          component: "Divider",
          label: "翻译功能配置",
          componentProps: {
            orientation: "left",
            plain: true,
          },
        },
        {
          field: "config.baidu_translate.id",
          label: "百度翻译APPID",
          bottomHelpMessage: "用于翻译中文Prompt，请在百度翻译开放平台中查看",
          component: "Input",
          required: false,
          componentProps: {
            placeholder: "请输入APPID，如20200727003021717",
            maxlength: 17,
            showCount: true,
          },
        },
        {
          field: "config.baidu_translate.key",
          label: "百度翻译密钥",
          bottomHelpMessage: "用于翻译中文Prompt，请在百度翻译开放平台中查看",
          component: "Input",
          required: false,
          componentProps: {
            placeholder: "请输入密钥，如cAQVZv_BhmprwF90Al_I",
            maxlength: 20,
            showCount: true,
          },
        },
        {
          field: "config.youdao_translate.id",
          label: "有道翻译应用ID",
          bottomHelpMessage: "用于翻译中文Prompt，请在有道智云控制台中查看",
          component: "Input",
          required: false,
          componentProps: {
            placeholder: "请输入APPID，如4523B39ea362ec0c",
            maxlength: 16,
            showCount: true,
          },
        },
        {
          field: "config.youdao_translate.key",
          label: "有道翻译应用密钥",
          bottomHelpMessage: "用于翻译中文Prompt，请在有道智云控制台中查看",
          component: "Input",
          required: false,
          componentProps: {
            placeholder: "请输入密钥，如TplRPttI0XdF65xqMBkITM0k9vh7YFUB",
            maxlength: 32,
            showCount: true,
          },
        },
        {
          component: "Divider",
          label: "策略相关配置",
          componentProps: {
            orientation: "left",
            plain: true,
          },
        },
        {
          field: "policy.cd",
          label: "全局CD",
          bottomHelpMessage: "单位：秒，默认为10",
          component: "InputNumber",
          required: true,
          componentProps: {
            placeholder: "请输入全局CD，如10",
            addonAfter: "秒",
          },
        },
        {
          field: "policy.localNum",
          label: "本地检索图片张数",
          bottomHelpMessage: "单位：张，默认为50",
          component: "InputNumber",
          required: true,
          componentProps: {
            placeholder: "请输入本地检索图片张数，如50",
            addonAfter: "张",
          },
        },
        {
          field: "policy.isDownload",
          label: "图片存入本地",
          bottomHelpMessage: "默认关闭，开启后会将图片存入本地",
          component: "Switch",
        },
        {
          field: "policy.isTellMaster",
          label: "违规图片通知主人",
          bottomHelpMessage: "默认关闭，开启后会将违规图片通知主人",
          component: "Switch",
        },
        {
          field: "policy.isAllowSearchLocalImg",
          label: "成员搜索本地图片",
          bottomHelpMessage: "默认关闭，开启后会允许成员搜索本地图片",
          component: "Switch",
        },
        {
          field: "policy.prohibitedUserList",
          label: "禁止使用的用户",
          bottomHelpMessage:
            "封禁的用户QQ号，封禁的用户无法绘图",
          component: "GTags",
          componentProps: {
            placeholder: '请输入黑名单QQ',
            allowAdd: true,
            allowDel: true,
            showPrompt: true,
            promptProps: {
              content: '请输入QQ号：',
              placeholder: '请输入QQ号',
              okText: '添加',
              rules: [
                {required: true, message: 'QQ号得填上才行哦~'},
                {pattern: '^\\d+$', message: 'QQ号应该是纯数字的吧'},
                {min: 5, message: '真的有这么短的QQ号吗？'},
                {max: 10, message: '太…太长了……'},
              ],
            },
            valueFormatter: ((value) => Number.parseInt(value)).toString(),
          },
        },
        {
          field: "policy.apMaster",
          label: "AP管理员QQ号",
          bottomHelpMessage: "AP管理员QQ号，用于更改相关设置",
          component: "GSelectFriend",
        },
        {
          component: "Divider",
          label: "全局策略相关配置",
          componentProps: {
            orientation: "left",
            plain: true,
          },
        },
        {
          field: "policy.gp.global.enable",
          label: "全局启用绘图",
          bottomHelpMessage: "默认开启，关闭后所有群都无法绘图",
          component: "Switch",
        },
        {
          field: "policy.gp.global.JH",
          label: "全局图片审核",
          bottomHelpMessage: "默认开启，关闭后图片将不会被审核",
          component: "Switch",
        },
        {
          field: "policy.gp.global.gcd",
          label: "全局群聊CD",
          bottomHelpMessage: "单位：秒，默认为20",
          component: "InputNumber",
          required: true,
          componentProps: {
            placeholder: "请输入全局群聊CD，如20",
            addonAfter: "秒",
          },
        },
        {
          field: "policy.gp.global.pcd",
          label: "全局个人CD",
          bottomHelpMessage: "单位：秒，默认为40",
          component: "InputNumber",
          required: true,
          componentProps: {
            placeholder: "请输入全局个人CD，如40",
            addonAfter: "秒",
          },
        },
        {
          field: "policy.gp.global.isRecall",
          label: "全局是否撤回",
          bottomHelpMessage: "默认关闭，开启后会在发送图片后撤回",
          component: "Switch",
        },
        {
          field: "policy.gp.global.recallDelay",
          label: "全局撤回时间",
          bottomHelpMessage: "单位：秒，默认为60",
          component: "InputNumber",
          required: true,
          componentProps: {
            placeholder: "请输入全局撤回延迟时间，如60",
            addonAfter: "秒",
          },
        },
        {
          field: "policy.gp.global.isBan",
          label: "全局封禁违禁用户",
          bottomHelpMessage: "默认关闭，开启后会封禁违禁词用户",
          component: "Switch",
        },
        {
          field: "policy.gp.global.usageLimit",
          label: "全局每日使用次数",
          bottomHelpMessage: "单位：次，默认为30",
          component: "InputNumber",
          required: true,
          componentProps: {
            placeholder: "请输入全局每日使用次数限制，如30",
            addonAfter: "次",
          },
        },
        {
          component: "Divider",
          label: "私聊相关配置",
          componentProps: {
            orientation: "left",
            plain: true,
          },
        },
        {
          field: "policy.gp.private.enable",
          label: "私聊启用绘图",
          bottomHelpMessage: "默认开启，关闭后所有私聊都无法绘图",
          component: "Switch",
        },
        {
          field: "policy.gp.private.JH",
          label: "私聊图片审核",
          bottomHelpMessage: "默认开启，关闭后图片将不会被审核",
          component: "Switch",
        },
        {
          field: "policy.gp.private.gcd",
          label: "私聊群聊CD",
          bottomHelpMessage: "单位：秒，默认为20",
          component: "InputNumber",
          componentProps: {
            placeholder: "请输入私聊群聊CD，如20",
            addonAfter: "秒",
          },
        },
        {
          field: "policy.gp.private.pcd",
          label: "私聊个人CD",
          bottomHelpMessage: "单位：秒，默认为40",
          component: "InputNumber",
          componentProps: {
            placeholder: "请输入私聊个人CD，如40",
            addonAfter: "秒",
          },
        },
        {
          field: "policy.gp.private.isRecall",
          label: "私聊是否撤回",
          bottomHelpMessage: "默认关闭，开启后会在发送图片后撤回",
          component: "Switch",
        },
        {
          field: "policy.gp.private.recallDelay",
          label: "私聊撤回延迟时间",
          bottomHelpMessage: "单位：秒，默认为60",
          component: "InputNumber",
          componentProps: {
            placeholder: "请输入私聊撤回延迟时间，如60",
            addonAfter: "秒",
          },
        },
        {
          field: "policy.gp.private.isBan",
          label: "私聊封禁违禁用户",
          bottomHelpMessage: "默认关闭，开启后会封禁违禁词用户",
          component: "Switch",
        },
        {
          field: "policy.gp.private.usageLimit",
          label: "私聊使用次数限制",
          bottomHelpMessage: "单位：次，默认为30",
          component: "InputNumber",
          componentProps: {
            placeholder: "请输入私聊每日使用次数限制，如30",
            addonAfter: "次",
          },
        },
      ],
      getConfigData() {
        let config = Config.mergeConfig();
        let policy = Config.mergePolicy();
        return {
          config: config,
          policy: policy,
        };
      },
      setConfigData(data, { Result }) {
        let config = {};
        let policy = {};
        for (let [keyPath, value] of Object.entries(data)) {
          if (keyPath.startsWith("config.")) {
            lodash.merge(
              config,
              lodash.set({}, keyPath.replace("config.", ""), value)
            );
          } else if (keyPath.startsWith("policy.")) {
            lodash.merge(
              policy,
              lodash.set({}, keyPath.replace("policy.", ""), value)
            );
          }
        }
        config = lodash.merge(Config.mergeConfig(), config);
        config.baidu_appid = parseInt(config.baidu_appid);
        // 特殊处理数组
        // 由于 lodash.merge 会将数组也合并，所以会导致删除的数据也被合并进去了，就删不掉了，所以这里数组需要直接赋值
        config.APIList = data['config.APIList'];
        Config.setcfg(config);

        policy = lodash.merge(Config.mergePolicy(), policy);
        // 特殊处理数组
        policy.prohibitedUserList = data['policy.prohibitedUserList'];
        Config.setPolicy(policy);
        return Result.ok({}, "保存成功~");
      },
    },
  };
}
