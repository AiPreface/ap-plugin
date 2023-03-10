/*
 * @Author: 渔火Arcadia  https://github.com/yhArcadia
 * @Date: 2022-12-18 23:08:51
 * @LastEditors: 苏沫柒 3146312184@qq.com
 * @LastEditTime: 2023-03-11 03:19:44
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\index.js
 * @Description: 
 * 
 * Copyright (c) 2022 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved. 
 */
import fs from 'node:fs'
import cfg from '../../lib/config/config.js'
import YAML from 'yaml'
import {
	checkPackage
} from './utils/dependencies_reminder.js'
let catlist = ["😸", "😹", "😺", "😻", "😼", "😽", "😾", "😿", "🙀"]
logger.info('---------------')
logger.mark(logger.green(`[${catlist[Math.floor(Math.random() * catlist.length)]}]AP-Plugin插件自检中......`))
let passed = await checkPackage()
if (!passed) {
	throw 'Missing necessary dependencies'
}

const files = fs.readdirSync('./plugins/ap-plugin/apps')
	.filter(file => file.endsWith('.js'))
// 判断文件夹是否存在
if (!fs.existsSync('./plugins/ap-plugin/config/config/config.yaml') || !fs.existsSync('./plugins/ap-plugin/config/config/preset.json')) {
	logger.mark(logger.red('⛔未找到配置文件，将自动生成配置文件'))
    Bot.pickUser(cfg.masterQQ[0]).sendMsg(`[AP-Plugin自检]检测到您是首次安装，我们建议您花点时间看一看我们的配置文档：https://www.wolai.com/tiamcvmiaLJLePhTr4LAJE，\n为了更好的使用本插件，我们建议您使用【#ap安装依赖】进行一键安装必要依赖`)
} else {
	const config = YAML.parse(fs.readFileSync('./plugins/ap-plugin/config/config/config.yaml', 'utf8'))
	const preset = JSON.parse(fs.readFileSync('./plugins/ap-plugin/config/config/preset.json', 'utf8'))
	if (config.APIList.length != 0) {
		logger.mark(logger.green('✅已加载【' + config.APIList.length + '】个绘图API接口'))
	} else {
		logger.mark(logger.red('⛔未加载任何绘图API接口'))
	}
	if (preset.length != 0) {
		logger.mark(logger.green('✅已加载【' + preset.length + '】个预设'))
	} else {
		logger.mark(logger.red('⛔未加载任何预设'))
	}
	if (config.Real_CUGAN != undefined) {
		logger.mark(logger.green('✅大清晰术接口已配置'))
	} else {
		logger.mark(logger.red('⛔大清晰术接口未配置'))
	}
	if (config.appreciate != undefined) {
		logger.mark(logger.green('✅鉴赏接口已配置'))
	} else {
		logger.mark(logger.red('⛔鉴赏接口未配置'))
	}
	if (config.ai_detect != undefined) {
		logger.mark(logger.green('✅AI检测接口已配置'))
	} else {
		logger.mark(logger.red('⛔AI检测接口未配置'))
	}
	if (config.remove_bg != undefined) {
		logger.mark(logger.green('✅去背景接口已配置'))
	} else {
		logger.mark(logger.red('⛔去背景接口未配置'))
	}
	if (config.cartoonization != undefined) {
		logger.mark(logger.green('✅动漫化接口已配置'))
	} else {
		logger.mark(logger.red('⛔动漫化接口未配置'))
	}
	if (config.anime_aesthetic_predict != undefined) {
		logger.mark(logger.green('✅二次元美学接口已配置'))
	} else {
		logger.mark(logger.red('⛔二次元美学接口未配置'))
	}
	if (config.img_to_music != undefined) {
		logger.mark(logger.green('✅图片转音乐接口已配置'))
	} else {
		logger.mark(logger.red('⛔图片转音乐接口未配置'))
	}
	if (config.baidu_appid != "Your_App_ID" && config.baidu_apikey != "Your_Api_Key" && config.baidu_secretkey != "Your_Secret_Key") {
		logger.mark(logger.green('✅百度图片审核已配置'))
	} else {
		logger.mark(logger.red('⛔百度图片审核未配置'))
	}
	if (config.openai_key != null) {
		logger.mark(logger.green('✅OpenAI接口已配置'))
	} else {
		logger.mark(logger.red('⛔OpenAI接口未配置'))
	}
	if (config.baidu_translate.id != null && config.baidu_translate.key != null) {
		logger.mark(logger.green('✅百度翻译接口已配置'))
	} else {
		logger.mark(logger.red('⛔百度翻译接口未配置'))
	}
	if (config.youdao_translate.id != null && config.youdao_translate.key != null) {
		logger.mark(logger.green('✅有道翻译接口已配置'))
	} else {
		logger.mark(logger.red('⛔有道翻译接口未配置'))
	}
}
let ret = []
files.forEach((file) => {
	ret.push(import(`./apps/${file}`))
})

ret = await Promise.allSettled(ret)

let apps = {}
for (let i in files) {
	let name = files[i].replace('.js', '')

	if (ret[i].status != 'fulfilled') {
		logger.error(`载入插件错误：${logger.red(name)}`)
		logger.error(ret[i].reason)
		continue
	}
	apps[name] = ret[i].value[Object.keys(ret[i].value)[0]]
}
export {
	apps
}
logger.info('---------------')

// logger.info('---------------')
// logger.info(`aiPainting载入完成`)
// logger.info('---------------')