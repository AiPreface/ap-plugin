/*
 * @Author: 渔火Arcadia  https://github.com/yhArcadia
 * @Date: 2022-12-19 00:40:50
 * @LastEditors: 渔火Arcadia
 * @LastEditTime: 2023-01-05 00:26:04
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\components\ai_painting\config.js
 * @Description: 获取和写入ap各项配置
 * 
 * Copyright (c) 2022 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved. 
 */
import YAML from 'yaml'
import fs from 'fs'
import path from 'path'


const Path = process.cwd();
const Plugin_Name = 'ap-plugin'
const Plugin_Path = path.join(Path, 'plugins', Plugin_Name)
const cfg_path = path.join(Plugin_Path, 'config', 'config')
class Config {
    constructor() {
        this.initPath()
        this.initCfg()
        this.synccfg()
        this.syncplc()
        this.sync_api_format()
    }

    /** 初始化配置 */
    initCfg() {
        let path = `${Plugin_Path}/config/config/`
        let pathDef = `${Plugin_Path}/config/default_config/`
        const files = fs.readdirSync(pathDef).filter(file => file.endsWith('.yaml') || file.endsWith('.json'))
        for (let file of files) {
            if (!fs.existsSync(`${path}${file}`)) {
                fs.copyFileSync(`${pathDef}${file}`, `${path}${file}`)
            }
        }
    }
    // 初始化路径
    initPath() {
        fs.mkdirSync(path.join(process.cwd(), 'resources/yuhuo/aiPainting'), { recursive: true });
        fs.mkdirSync(cfg_path, { recursive: true });
    }
    // 同步config
    async synccfg() {
        let cfg = await this.getcfg()
        let defcfg = await YAML.parse(
            fs.readFileSync(path.join(`${Plugin_Path}/config/default_config/`, 'config.yaml'), "utf8")
        );
        cfg = await this.syncobj(cfg, defcfg)
        this.setcfg(cfg)
    }
    // 同步策略
    async syncplc() {
        let policy = await this.getPolicy()
        let defpolicy = await YAML.parse(
            fs.readFileSync(path.join(`${Plugin_Path}/config/default_config/`, 'policy.yaml'), "utf8")
        );
        policy = await this.syncobj(policy, defpolicy)
        policy.gp.global = await this.syncobj(policy.gp.global, defpolicy.gp.global)
        // policy.gp.private = await this.syncobj(policy.gp.private, defpolicy.gp.private)
        this.setPolicy(policy)
    }
    // 同步/config和/default_config中的属性
    async syncobj(config, defconfig) {
        for (let key in defconfig) {
            if (!(key in config)) {
                config[key] = defconfig[key]
            }
        }
        for (let key in config) {
            if (!(key in defconfig)) {
                delete config[key]
            }
        }
        return config
    }
    // 更新接口格式
    async sync_api_format() {
        let apcfg = await this.getcfg()
        for (let i = 0; i < apcfg.APIList.length; i++) {
            if (Object.keys(apcfg.APIList[i]).length == 1) {
                let api = Object.keys(apcfg.APIList[i])[0]
                console.log(`刷新接口格式：${api}`)
                apcfg.APIList[i] = {
                    url: api,
                    remark: apcfg.APIList[i][api],
                    account_id: '',
                    account_password: '',
                    token: ''
                }
                await this.setcfg(apcfg)
            }
        }
    }

    /**获取配置
     * @return {*}
     */
    async getcfg() {
        let apcfg = await YAML.parse(
            fs.readFileSync(path.join(cfg_path, 'config.yaml'), "utf8")
        );
        return apcfg
    }

    /**写入配置
     * @param {*} apcfg
     * @return {*}
     */
    async setcfg(apcfg) { fs.writeFileSync(path.join(cfg_path, 'config.yaml'), YAML.stringify(apcfg), "utf8"); }



    /**获取ap策略
     * @return {*}
     */
    async getPolicy() {
        let plc = await YAML.parse(
            fs.readFileSync(path.join(cfg_path, 'policy.yaml'), "utf8")
        );
        return plc
    }

    /**写入ap策略
     * @param {*} policy
     * @return {*}
     */
    async setPolicy(policy) { fs.writeFileSync(path.join(cfg_path, 'policy.yaml'), YAML.stringify(policy), "utf8"); }



    /**获取违禁词列表
     * @return {*}
     */
    async getProhibitedWords() {
        let pwords = await YAML.parse(
            fs.readFileSync(path.join(cfg_path, 'prohibitedWords.yaml'), "utf8")
        );
        return pwords
    }

    /**写入违禁词列表
     * @param {*} pwords
     * @return {*}
     */
    async setProhibitedWords(pwords) { fs.writeFileSync(path.join(cfg_path, 'prohibitedWords.yaml'), YAML.stringify(pwords), "utf8"); }



    /**获取预设词列表
     * @return {*}
     */
    async getPresets() {
        let presets = await JSON.parse(
            fs.readFileSync(path.join(cfg_path, 'preset.json'), "utf8")
        );
        return presets
    }

    /**写入预设词列表
     * @param {*} presets
     * @return {*}
     */
    async setpreSets(presets) {
        fs.writeFileSync(path.join(cfg_path, 'preset.json'), JSON.stringify(presets, null, "\t"), "utf8");
        // fs.writeFileSync(path.join(cfg_path, 'preset.yaml'), YAML.stringify(presets), "utf8");
    }


    /**获取全部配置
     * @return {*}
     */
    async getAll() {
        let apcfg = await this.getcfg()
        let plc = await this.getPolicy()
        let pwords = await this.getProhibitedWords()
        let presets = await this.getPresets()
        return [apcfg, plc, pwords, presets]
    }

}

export default new Config()