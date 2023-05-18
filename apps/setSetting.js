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
}
