import plugin from '../../../lib/plugins/plugin.js'
import Config from '../components/ai_painting/config.js';

const _path = process.cwd();

export class setSetting extends plugin {
    constructor() {
        super({
            /** 功能名称 */
            name: 'AP-设置设置',
            /** 功能描述 */
            dsc: '设置设置',
            event: 'message',
            /** 优先级，数字越小等级越高 */
            priority: 1009,
            rule: [
                {
                    /** 命令正则匹配 */
                    reg: '^#ap设置负面.*',
                    /** 执行方法 */
                    fnc: 'setNegative',
                    /** 主人权限 */
                    permission: "master"
                },
                {
                    /** 命令正则匹配 */
                    reg: '^#ap设置正面.*',
                    /** 执行方法 */
                    fnc: 'setPositive',
                    /** 主人权限 */
                    permission: "master"
                },
                {
                    /** 命令正则匹配 */
                    reg: '^#ap(开启|关闭)简洁模式',
                    /** 执行方法 */
                    fnc: 'setSimple',
                    /** 主人权限 */
                    permission: "master"
                },
                {
                    /** 命令正则匹配 */
                    reg: '^#ap设置合并字数.*',
                    /** 执行方法 */
                    fnc: 'setMerge',
                    /** 主人权限 */
                    permission: "master"
                },
                {
                    /** 命令正则匹配 */
                    reg: '^#ap设置调试模式(开启|关闭)',
                    /** 执行方法 */
                    fnc: 'setDebug',
                },
                {
                    /** 命令正则匹配 */
                    reg: '^#ap设置使用(sd|db)鉴赏图片',
                    /** 执行方法 */
                    fnc: 'setAppreciation',
                    /** 主人权限 */
                    permission: "master"
                },
                {
                    /** 命令正则匹配 */
                    reg: '^#ap设置鉴赏模型.*',
                    /** 执行方法 */
                    fnc: 'setAppreciationModel',
                    /** 主人权限 */
                    permission: "master"
                },
                {
                    /** 命令正则匹配 */
                    reg: '^#ap设置大清晰术算法(1|2).*',
                    /** 执行方法 */
                    fnc: 'setSuperResolutionModel',
                    /** 主人权限 */
                    permission: "master"
                },
                {
                    /** 命令正则匹配 */
                    reg: '^#ap设置大清晰术算法2强度.*',
                    /** 执行方法 */
                    fnc: 'setSuperResolutionStrength',
                    /** 主人权限 */
                    permission: "master"
                }
            ]
        })
    }

    async setNegative(e) {
        let setting = await Config.getSetting();
        let negativePrompt = e.msg.replace('#ap设置负面', '').trim();
        setting.def_negativeprompt = negativePrompt;
        Config.setSetting(setting);
        e.reply(`全局负面已设置为：${negativePrompt}，每次绘画时会自动使用该负面Prompt`);
        return true;
    }

    async setPositive(e) {
        let setting = await Config.getSetting();
        let positivePrompt = e.msg.replace('#ap设置正面', '').trim();
        setting.def_prompt = positivePrompt;
        Config.setSetting(setting);
        e.reply(`全局正面已设置为：${positivePrompt}，每次绘画时会自动使用该正面Prompt`);
        return true;
    }

    async setSimple(e) {
        let setting = await Config.getSetting();
        let simple = e.msg.replace('#ap', '').replace('简洁模式', '').trim();
        setting.concise_mode = simple == '开启' ? true : false;
        Config.setSetting(setting);
        e.reply(`简洁模式已${simple}，单次绘图将${simple == '开启' ? '不' : ''}显示详细信息`);
        return true;
    }
    async setMerge(e) {
        let setting = await Config.getSetting();
        let merge = e.msg.replace('#ap设置合并字数', '').trim();
        if (isNaN(merge) || merge < 1 || merge > 800) {
            e.reply(`合并字数必须为1-800之间的数字`);
            return true;
        }
        setting.merge = merge;
        Config.setSetting(setting);
        e.reply(`合并字数已设置为：${merge}，详细信息若超出${merge}字将会被合并发送`);
        return true;
    }
    async setDebug(e) {
        let setting = await Config.getSetting();
        let debug = e.msg.replace('#ap设置调试模式', '').trim();
        setting.debug = debug == '开启' ? true : false;
        Config.setSetting(setting);
        e.reply(`调试模式已${debug == '开启' ? '开启' : '关闭'}，详细信息将${debug == '开启' ? '会' : '不会'}被输出至控制台`);
        return true;
    }
    async setAppreciation(e) {
        let setting = await Config.getSetting();
        let appreciation = e.msg.replace('#ap设置使用', '').replace('鉴赏图片', '').trim();
        setting.appreciation.useSD = appreciation == 'sd' ? true : false;
        Config.setSetting(setting);
        e.reply(`鉴赏图片接口已设置为：${appreciation == 'sd' ? 'Stable Diffusion' : 'DeepDanbooru'}`);
        return true;
    }
    async setAppreciationModel(e) {
        let config = await Config.getcfg()
        let apiobj = config.APIList[config.usingAPI - 1]
        let url = apiobj.url + '/tagger/v1/interrogators';
        const headers = {
            "Content-Type": "application/json"
        };
        if (apiobj.account_password) {
            headers.Authorization = `Basic ${Buffer.from(apiobj.account_id + ':' + apiobj.account_password, 'utf8').toString('base64')} `
        }
        let response;
        try {
            response = await axios.get(url, { headers });
        } catch (error) {
            response = {
                "models": [
                    "wd14-convnextv2-v2",
                    "wd14-vit-v2",
                    "wd14-convnext-v2",
                    "wd14-swinv2-v2",
                    "wd14-convnextv2-v2-git",
                    "wd14-vit-v2-git",
                    "wd14-convnext-v2-git",
                    "wd14-swinv2-v2-git",
                    "wd14-vit",
                    "wd14-convnext"
                ]
            }
        }
        let modelList = response.data.models;
        let setting = await Config.getSetting();
        let appreciationModel = e.msg.replace('#ap设置鉴赏模型', '').trim();
        if (appreciationModel == '') {
            e.reply(`鉴赏模型不能为空`);
            return true;
        }
        if (!modelList.includes(appreciationModel)) {
            e.reply(`鉴赏模型不存在，可用模型有：\n${modelList.join('\n')}`);
            return true;
        }
        setting.appreciation.model = appreciationModel;
        Config.setSetting(setting);
        e.reply(`鉴赏模型已设置为：${appreciationModel}`);
        return true;
    }
    async setSuperResolutionModel(e) {
        let config = await Config.getcfg()
        let apiobj = config.APIList[config.usingAPI - 1]
        let url = apiobj.url + '/sdapi/v1/upscalers';
        const headers = {
            "Content-Type": "application/json"
        };
        if (apiobj.account_password) {
            headers.Authorization = `Basic ${Buffer.from(apiobj.account_id + ':' + apiobj.account_password, 'utf8').toString('base64')} `
        }
        let modelList;
        try {
            let response = await axios.get(url, { headers });
            for (let i = 0; i < response.data.length; i++) {
                modelList.push(response.data[i].name)
            }
        } catch (error) {
            modelList = ['None', 'Lanczos', 'Nearest', 'BSRGAN', 'ESRGAN_4x', 'LDSR', 'R-ESRGAN 4x+', 'R-ESRGAN 4x+ Anime6B', 'ScuNET', 'ScuNET PSNR', 'SwinIR_4x']
        }
        let setting = await Config.getSetting();
        let superResolutionModel = e.msg.replace('#ap设置大清晰术算法1', '').replace('#ap设置大清晰术算法2', '').trim();
        if (superResolutionModel == '') {
            e.reply(`大清晰术算法不能为空`);
            return true;
        }
        if (!modelList.includes(superResolutionModel)) {
            e.reply(`大清晰术算法不存在，可用算法有：\n${modelList.join('\n')}`);
            return true;
        }
        if (e.msg.indexOf('#ap设置大清晰术算法1') != -1) {
            setting.superResolution.model1 = superResolutionModel;
            e.reply(`大清晰术算法1已设置为：${superResolutionModel}`);
        } else {
            setting.superResolution.model2 = superResolutionModel;
            e.reply(`大清晰术算法2已设置为：${superResolutionModel}`);
        }
        Config.setSetting(setting);
        return true;
    }
    async setSuperResolutionStrength(e) {
        let setting = await Config.getSetting();
        let superResolutionStrength = e.msg.replace('#ap设置大清晰术算法2强度', '').trim();
        if (superResolutionStrength == '') {
            e.reply(`大清晰术强度不能为空`);
            return true;
        }
        if (isNaN(superResolutionStrength)) {
            e.reply(`大清晰术强度必须为数字`);
            return true;
        }
        if (superResolutionStrength < 0 || superResolutionStrength > 1) {
            e.reply(`大清晰术强度必须在0到1之间`);
            return true;
        }
        setting.superResolution.strength = superResolutionStrength.toiFixed(3);
        Config.setSetting(setting);
        e.reply(`大清晰术强度已设置为：${superResolutionStrength.toiFixed(3)}`);
        return true;
    }
}
