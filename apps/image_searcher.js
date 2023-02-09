import plugin from '../../../lib/plugins/plugin.js'
import {
	ascii2d,
	SauceNAO,
	IqDB,
	TraceMoe,
	EHentai,
	Yandex
} from '../utils/utidx.js'
import {
	parseImg
} from '../utils/utils.js';
import {
	segment
} from 'oicq'
import Log from "../utils/Log.js";
import fs from 'fs';
import axios from 'axios';
import request from 'request';

let Path = process.cwd() + '\/data\/temp\/'
let AwaitChooseSearcher = {}
let AwaitChooseEngine = {}
let getImagetime = {};
let SearcherTime
let EngineTime
let engineName = ['Ascii2d', 'SauceNAO', 'IqDB', 'TraceMoe', 'EHentai', 'Yandex']

const EHentaiCookie = {
	"ipb_member_id": "123456789",
	"ipb_pass_hash": "123456789",
	"igneous": "123456789",
}

export class ImageSearcher extends plugin {
	constructor() {
		super({
			/** 功能名称 */
			name: '搜图',
			/** 功能描述 */
			dsc: '简单开发示例',
			/** https://oicqjs.github.io/oicq/#events */
			event: 'message',
			/** 优先级，数字越小等级越高 */
			priority: 1000,
			rule: [{
					/** 命令正则匹配 */
					reg: '^#?(ap)搜图$',
					/** 执行方法 */
					fnc: 'ImageSearcher'
				},
				{
					/** 命令正则匹配 */
					reg: '^[1-6]$',
					/** 执行方法 */
					fnc: 'ChooseImageSearcher',
					/** 关闭日志 */
					log: false
				},
				{
					/** 命令正则匹配 */
					reg: '^[A-D]$',
					/** 执行方法 */
					fnc: 'ChooseSetting',
					/** 关闭日志 */
					log: false
				},
				{
					/** 命令正则匹配 */
					reg: '^.*$',
					/** 执行方法 */
					fnc: 'getImage',
					/** 关闭日志 */
					log: false
				}
			]
		})
	}

	async ImageSearcher(e) {
		if (!fs.existsSync(Path)) {
			fs.mkdirSync(Path)
		} else {
			let files = fs.readdirSync(Path)
			files.forEach(function(file, index) {
				let DelPath = Path + '/' + file
				fs.unlinkSync(DelPath)
			})
		}
		e = await parseImg(e)
		if (this.e.img) {
			Log.i('【ImageSeacher】: 获取到图片，等待选择搜索引擎')
			e.reply([segment.at(e.user_id), '请选择搜索引擎：\n【1】. Ascii2d（专业二次元画像检索）\n【2】. Saucenao（日本二次元以图搜图站点）\n【3】. Iqdb（动画、游戏、壁纸图片搜索）\n【4】. Tracemoe（番剧，动漫图片搜索）\n【5】. Ehentai（搜本子专用）\n【6】. Yandex（战斗名族的搜索引擎）\n※：发送序号即可，请在60s内进行选择~'])
			let imgurl = e.img[0]
			AwaitChooseSearcher[e.user_id] = imgurl
			SearcherTime = setTimeout(() => {
				if (AwaitChooseSearcher[e.user_id]) {
					Log.i('【ImageSeacher】: 等待选择搜索引擎超时')
					e.reply([segment.at(e.user_id), '等待选择搜索引擎已超时，请再次发送命令~'])
					delete AwaitChooseSearcher[e.user_id]
				}
			}, 60000)
		} else {
			Log.i('【ImageSeacher】: 未获取到图片，等待发送图片')
			e.reply([segment.at(e.user_id), '请在60s内发送图片~'])
			getImagetime[e.user_id] = setTimeout(() => {
				if (getImagetime[e.user_id]) {
					Log.i('【ImageSeacher】: 等待发送图片超时')
					e.reply([segment.at(e.user_id), '等待发送图片已超时，请再次发送命令~'])
					delete getImagetime[e.user_id];
				}
			}, 60000);
			return false;
		}
	}

	async getImage(e) {
		if (!e.img) {
			return false;
		}
		if (getImagetime[e.user_id]) {
			clearTimeout(getImagetime[e.user_id]);
			delete getImagetime[e.user_id];
		} else {
			return false;
		}
		let result = await this.ImageSearcher(e);
		if (result) {
			return true;
		}
	}

	async ChooseImageSearcher(e) {
		if (AwaitChooseSearcher[e.user_id]) {
			clearTimeout(SearcherTime)
			let imgurl = AwaitChooseSearcher[e.user_id]
			switch (e.msg) {
				case '1':
					Log.i('【ImageSeacher】: 用户选择了Ascii2d')
					e.reply([segment.at(e.user_id), '请选择搜索参数：\n【A】. 特征模式（使用反向代理）\n【B】. 颜色模式（使用反向代理）\n【C】. 特征模式（不使用反向代理）\n【D】. 颜色模式（不使用反向代理）\n※：发送字母即可，请在60s内进行选择~'])
					AwaitChooseEngine[e.user_id] = {
						imgurl,
						engine: 1
					}
					EngineTime = setTimeout(() => {
						if (AwaitChooseEngine[e.user_id]) {
							e.reply([segment.at(e.user_id), '等待选择搜索参数已超时，请再次发送命令~'])
							delete AwaitChooseEngine[e.user_id]
						}
					}, 60000)
					break
				case '2':
					Log.i('【ImageSeacher】: 用户选择了SauceNAO')
					e.reply([segment.at(e.user_id), '请选择搜索参数：\n【A】. 过滤敏感内容\n【B】. 不过滤敏感内容\n※：发送字母即可，请在60s内进行选择~'])
					AwaitChooseEngine[e.user_id] = {
						imgurl,
						engine: 2
					}
					EngineTime = setTimeout(() => {
						if (AwaitChooseEngine[e.user_id]) {
							e.reply([segment.at(e.user_id), '等待选择搜索参数已超时，请再次发送命令~'])
							delete AwaitChooseEngine[e.user_id]
						}
					}, 60000)
					break
				case '3':
					Log.i('【ImageSeacher】: 用户选择了IQDB')
					e.reply([segment.at(e.user_id), '请选择搜索参数：\n【A】. 搜索时保留颜色\n【B】. 搜索时去除颜色\n※：发送字母即可，请在60s内进行选择~'])
					AwaitChooseEngine[e.user_id] = {
						imgurl,
						engine: 3
					}
					EngineTime = setTimeout(() => {
						if (AwaitChooseEngine[e.user_id]) {
							e.reply([segment.at(e.user_id), '等待选择搜索参数已超时，请再次发送命令~'])
							delete AwaitChooseEngine[e.user_id]
						}
					}, 60000)
					break
				case '4':
					Log.i('【ImageSeacher】: 用户选择了Trace.moe')
					e.reply([segment.at(e.user_id), '请选择搜索参数：\n【A】. 搜索时去除图片边框\n【B】. 搜索时保留图片边框\n※：发送字母即可，请在60s内进行选择~'])
					AwaitChooseEngine[e.user_id] = {
						imgurl,
						engine: 4
					}
					EngineTime = setTimeout(() => {
						if (AwaitChooseEngine[e.user_id]) {
							e.reply([segment.at(e.user_id), '等待选择搜索参数已超时，请再次发送命令~'])
							delete AwaitChooseEngine[e.user_id]
						}
					}, 60000)
					break
				case '5':
					Log.i('【ImageSeacher】: 用户选择了E-Hentai')
					e.reply([segment.at(e.user_id), '请选择搜索参数：\n【A】. 搜索EH画廊\n【B】. 搜索EX画廊\n【C】. 搜索EH画廊（搜索相似内容）\n【D】. 搜索EX画廊（搜索相似内容）\n※：发送字母即可，请在60s内进行选择~'])
					AwaitChooseEngine[e.user_id] = {
						imgurl,
						engine: 5
					}
					EngineTime = setTimeout(() => {
						if (AwaitChooseEngine[e.user_id]) {
							e.reply([segment.at(e.user_id), '等待选择搜索参数已超时，请再次发送命令~'])
							delete AwaitChooseEngine[e.user_id]
						}
					}, 60000)
					break
				case '6':
					Log.i('【ImageSeacher】: 用户选择了Yandex')
					AwaitChooseEngine[e.user_id] = {
						imgurl,
						engine: 6
					}
					await this.ChooseSetting(e)
					break
			}
			delete AwaitChooseSearcher[e.user_id]
		} else {
			return false
		}
	}
	async ChooseSetting(e) {
		if (AwaitChooseEngine[e.user_id]) {
			clearTimeout(EngineTime)
			let imgurl = AwaitChooseEngine[e.user_id].imgurl
			let engine = AwaitChooseEngine[e.user_id].engine
			let setting
			switch (e.msg) {
				case 'A':
					setting = 'A'
					break
				case 'B':
					setting = 'B'
					break
				case 'C':
					setting = 'C'
					break
				case 'D':
					setting = 'D'
					break
			}
			if (engine === 1 && setting === 'A' || engine === 1 && setting === 'B' || engine === 1 && setting === 'C' || engine === 1 && setting === 'D' || engine === 2 && setting === 'A' || engine === 2 && setting === 'B' || engine === 3 && setting === 'A' || engine === 3 && setting === 'B' || engine === 4 && setting === 'A' || engine === 4 && setting === 'B' || engine === 5 && setting === 'A' || engine === 5 && setting === 'B' || engine === 5 && setting === 'C' || engine === 5 && setting === 'D' || engine === 6) {
				Log.i('【ImageSeacher】: 用户选择了' + setting + '参数')
				let data
				switch (engine) {
					case 1:
						if (setting === 'A') {
							data = {
								type: 'bovw',
								url: imgurl,
								proxy: true
							}
						} else if (setting === 'B') {
							data = {
								type: 'color',
								url: imgurl,
								proxy: true
							}
						} else if (setting === 'C') {
							data = {
								type: 'bovw',
								url: imgurl,
								proxy: false
							}
						} else if (setting === 'D') {
							data = {
								type: 'color',
								url: imgurl,
								proxy: false
							}
						}
						break
					case 2:
						if (setting === 'A') {
							data = {
								hide: true,
								url: imgurl,
							}
						} else if (setting === 'B') {
							data = {
								hide: false,
								url: imgurl,
							}
						}
						break
					case 3:
						if (setting === 'A') {
							data = {
								discolor: false,
								url: imgurl,
							}
						} else if (setting === 'B') {
							data = {
								discolor: true,
								url: imgurl,
							}
						}
						break
					case 4:
						if (setting === 'A') {
							data = {
								cutBorders: true,
								url: imgurl,
							}
						} else if (setting === 'B') {
							data = {
								cutBorders: false,
								url: imgurl,
							}
						}
						break
					case 5:
						let HentaiRes = await axios.get(imgurl, {
							responseType: 'arraybuffer'
						})
						let HentaiFilename = Path + Date.now() + '.jpg'
						fs.writeFileSync(HentaiFilename, HentaiRes.data)
						if (setting === 'A') {
							data = {
								size: 'eh',
								similar: false,
								imagePath: HentaiFilename
							}
						} else if (setting === 'B') {
							data = {
								size: 'ex',
								similar: false,
								imagePath: HentaiFilename,
								EH_COOKIE: EHentaiCookie
							}
						} else if (setting === 'C') {
							data = {
								size: 'eh',
								similar: true,
								imagePath: HentaiFilename
							}
						} else if (setting === 'D') {
							data = {
								size: 'ex',
								similar: true,
								imagePath: HentaiFilename,
								EH_COOKIE: EHentaiCookie
							}
						}
						break
					case 6:
						let yandexRes = await axios.get(imgurl, {
							responseType: 'arraybuffer'
						})
						let yandexFilename = Path + Date.now() + '.jpg'
						fs.writeFileSync(yandexFilename, yandexRes.data)
						let yandexImgbed = await ImageBed(yandexFilename)
						data = {
							url: yandexImgbed
						}
						break
				}
				e.reply([segment.at(e.user_id), '正在使用', engineName[engine - 1], '搜索图片，请稍后...'])
				let result = await this.Search(data, engine, e)
				if (result) {
					await this.ProcessResult(result, engine, e)
				} else {
					Log.w('【ImageSearcher】搜索失败')
					return false
				}
			} else {
				Log.w('【ImageSearcher】搜索参数错误')
				e.reply([segment.at(e.user_id), '搜索参数错误，请重新发送命令~'])
				delete AwaitChooseEngine[e.user_id]
				return false
			}
		} else {
			return false
		}
	}
	async Search(data, engine, e) {
		Log.i('【ImageSearcher】开始搜索')
		let result
		switch (engine) {
			case 1:
				try {
					result = await ascii2d(data)
				} catch (error) {
					e.reply([segment.at(e.user_id), 'Ascii2d搜索失败，报错已发送到控制台'])
					Log.w('【ImageSearcher】Ascii2d搜索失败')
					Log.w(error)
				}
				break
			case 2:
				try {
					result = await SauceNAO(data)
				} catch (error) {
					e.reply([segment.at(e.user_id), 'SauceNAO搜索失败，报错已发送到控制台'])
					Log.w('【ImageSearcher】SauceNAO搜索失败')
					Log.w(error)
				}
				break
			case 3:
				try {
					result = await IqDB(data)
				} catch (error) {
					e.reply([segment.at(e.user_id), 'IqDB搜索失败，报错已发送到控制台'])
					Log.w('【ImageSearcher】IqDB搜索失败')
					Log.w(error)
				}
				break
			case 4:
				try {
					result = await TraceMoe(data)
				} catch (error) {
					e.reply([segment.at(e.user_id), 'TraceMoe搜索失败，报错已发送到控制台'])
					Log.w('【ImageSearcher】TraceMoe搜索失败')
					Log.w(error)
				}
				break
			case 5:
				try {
					result = await EHentai(data)
				} catch (error) {
					e.reply([segment.at(e.user_id), 'EHentai搜索失败，报错已发送到控制台'])
					Log.w('【ImageSearcher】EHentai搜索失败')
					Log.w(error)
				}
				break
			case 6:
				try {
					result = await Yandex(data)
				} catch (error) {
					e.reply([segment.at(e.user_id), 'Yandex搜索失败，报错已发送到控制台'])
					Log.w('【ImageSearcher】Yandex搜索失败')
					Log.w(error)
				}
				break
		}
		return result
	}
	async ProcessResult(result, engine, e) {
		Log.i('【ImageSearcher】开始处理搜索结果')
		let ForwardMsg;
		let data_msg = [];
		switch (engine) {
			case 1:
				Log.i(result)
				for (let i = 0; i < result.length; i++) {
					try {
						Log.m('【ImageSearcher】正在处理第' + (i + 1) + '个结果，共' + result.length + '个结果')
						let msg = []
						let result_ = result[i]
						try {
							let image = result_.image
							msg.push(segment.image(image))
						} catch (error) {
							Log.w('【ImageSearcher】第' + (i + 1) + '个Ascii2d搜索结果中没有图片')
						}
						try {
							let source_text = result_.source.text
							msg.push(`\n[作品标题]：${source_text}`)
						} catch (error) {
							Log.w('【ImageSearcher】第' + (i + 1) + '个Ascii2d搜索结果中没有作品标题')
						}
						try {
							let source_link = result_.source.link
							msg.push(`\n[作品地址]：${source_link}`)
						} catch (error) {
							Log.w('【ImageSearcher】第' + (i + 1) + '个Ascii2d搜索结果中没有作品地址')
						}
						try {
							let author_text = result_.author.text
							msg.push(`\n[作者]：${author_text}`)
						} catch (error) {
							Log.w('【ImageSearcher】第' + (i + 1) + '个Ascii2d搜索结果中没有作者')
						}
						try {
							let author_link = result_.author.link
							msg.push(`\n[作者地址]：${author_link}`)
						} catch (error) {
							Log.w('【ImageSearcher】第' + (i + 1) + '个Ascii2d搜索结果中没有作者地址')
						}
						try {
							let info = result_.info
							msg.push(`\n[相关信息]：${info}`)
						} catch (error) {
							Log.w('【ImageSearcher】第' + (i + 1) + '个Ascii2d搜索结果中没有相关信息')
						}
						try {
							let hash = result_.hash
							msg.push(`\n[哈希值]：${hash}`)
						} catch (error) {
							Log.w('【ImageSearcher】第' + (i + 1) + '个Ascii2d搜索结果中没有哈希值')
						}
						data_msg.push({
							message: msg,
							nickname: Bot.nickname,
							user_id: Bot.uin
						})
					} catch (error) {
						Log.w('【ImageSearcher】处理第' + (i + 1) + '个结果失败')
						Log.w(result[i])
					}
				}
				break
			case 2:
				Log.i(result)
				for (let i = 0; i < result.length; i++) {
					try {
						Log.m('【ImageSearcher】正在处理第' + (i + 1) + '个结果，共' + result.length + '个结果')
						let msg = []
						let result_ = result[i]
						try {
							let image = result_.image
							msg.push(segment.image(image))
						} catch (error) {
							Log.w('【ImageSearcher】第' + (i + 1) + '个Saucenao搜索结果中没有图片')
						}
						try {
							let title = result_.title
							msg.push(`\n[作品标题]：${title}`)
						} catch (error) {
							Log.w('【ImageSearcher】第' + (i + 1) + '个Saucenao搜索结果中没有作品标题')
						}
						try {
							let similarity = result_.similarity
							msg.push(`\n[相似度]：${similarity}%`)
						} catch (error) {
							Log.w('【ImageSearcher】第' + (i + 1) + '个Saucenao搜索结果中没有相似度')
						}
						try {
							let hidden = result_.hidden ? "隐藏" : "公开"
							msg.push(`\n[作品状态]：${hidden}`)
						} catch (error) {
							Log.w('【ImageSearcher】第' + (i + 1) + '个Saucenao搜索结果中没有作品状态')
						}
						try {
							let misc = ""
							for (let i = 0; i < result_.misc.length; i++) {
								misc += "\n" + result_.misc[i]
							}
							msg.push(`\n[地址]：${misc}`)
						} catch (error) {
							Log.w('【ImageSearcher】第' + (i + 1) + '个Saucenao搜索结果中没有地址')
						}
						try {
							let content = result_.content
							for (let i = 0; i < content.length; i++) {
								let text = content[i].text
								let link = content[i].link
								msg.push(`\n[${text}]：${link}`)
							}
						} catch (error) {
							Log.w('【ImageSearcher】第' + (i + 1) + '个Saucenao搜索结果中没有内容')
						}
						data_msg.push({
							message: msg,
							nickname: Bot.nickname,
							user_id: Bot.uin
						})
					} catch (error) {
						Log.w('【ImageSearcher】处理第' + (i + 1) + '个结果失败')
						Log.w(result[i])
					}
				}
				break
			case 3:
				Log.i(result)
				for (let i = 0; i < result.length; i++) {
					try {
						Log.m('【ImageSearcher】正在处理第' + (i + 1) + '个结果，共' + result.length + '个结果')
						let msg = []
						let result_ = result[i]
						try {
							let image = result_.image
							msg.push(segment.image(image))
						} catch (error) {
							Log.w('【ImageSearcher】第' + (i + 1) + '个IQDB搜索结果中没有图片')
						}
						try {
							let similarity = result_.similarity
							msg.push(`\n[相似度]：${similarity}%`)
						} catch (error) {
							Log.w('【ImageSearcher】第' + (i + 1) + '个IQDB搜索结果中没有相似度')
						}
						try {
							let resolution = result_.resolution
							msg.push(`\n[分辨率]：${resolution}`)
						} catch (error) {
							Log.w('【ImageSearcher】第' + (i + 1) + '个IQDB搜索结果中没有分辨率')
						}
						try {
							let level = result_.level
							msg.push(`\n[等级]：${level}`)
						} catch (error) {
							Log.w('【ImageSearcher】第' + (i + 1) + '个IQDB搜索结果中没有等级')
						}
						try {
							let url = result_.url
							msg.push(`\n[地址]：${url}`)
						} catch (error) {
							Log.w('【ImageSearcher】第' + (i + 1) + '个IQDB搜索结果中没有地址')
						}
						data_msg.push({
							message: msg,
							nickname: Bot.nickname,
							user_id: Bot.uin
						})
					} catch (error) {
						Log.w('【ImageSearcher】处理第' + (i + 1) + '个结果失败')
						Log.w(result[i])
					}
				}
				break
			case 4:
				Log.i(result)
				for (let i = 0; i < result.length; i++) {
					try {
						Log.m('【ImageSearcher】正在处理第' + (i + 1) + '个结果，共' + result.length + '个结果')
						let msg = []
						let result_ = result[i]
						try {
							let preview = result_.preview
							msg.push(segment.image(preview))
						} catch (error) {
							Log.w('【ImageSearcher】第' + (i + 1) + '个TraceMoe搜索结果中没有图片')
						}
						try {
							let native = result_.name.native
							msg.push(`\n[原名]：${native}`)
						} catch (error) {
							Log.w('【ImageSearcher】第' + (i + 1) + '个TraceMoe搜索结果中没有原名')
						}
						try {
							let romaji = result_.name.romaji
							msg.push(`\n[罗马音]：${romaji}`)
						} catch (error) {
							Log.w('【ImageSearcher】第' + (i + 1) + '个TraceMoe搜索结果中没有罗马音')
						}
						try {
							let english = result_.name.english
							msg.push(`\n[英文名]：${english}`)
						} catch (error) {
							Log.w('【ImageSearcher】第' + (i + 1) + '个TraceMoe搜索结果中没有英文名')
						}
						try {
							let similarity = result_.similarity
							similarity = similarity.toFixed(2)
							msg.push(`\n[相似度]：${similarity}%`)
						} catch (error) {
							Log.w('【ImageSearcher】第' + (i + 1) + '个TraceMoe搜索结果中没有相似度')
						}
						try {
							let nsfw = result_.nsfw ? '是' : '否'
							msg.push(`\n[是否NSFW]：${nsfw}`)
						} catch (error) {
							Log.w('【ImageSearcher】第' + (i + 1) + '个TraceMoe搜索结果中没有是否NSFW')
						}
						try {
							let from = result_.from / 1000
							let to = result_.to / 1000
							let from_ = new Date(from * 1000)
								.toISOString()
								.substr(11, 8)
							let to_ = new Date(to * 1000)
								.toISOString()
								.substr(11, 8)
							msg.push(`\n[时间]：${from_} - ${to_}`)
						} catch (error) {
							Log.w('【ImageSearcher】第' + (i + 1) + '个TraceMoe搜索结果中没有时间')
						}
						try {
							let episode = result_.episode
							msg.push(`\n[集数]：${episode}`)
						} catch (error) {
							Log.w('【ImageSearcher】第' + (i + 1) + '个TraceMoe搜索结果中没有集数')
						}
						try {
							let file = result_.file
							msg.push(`\n[文件名]：${file}`)
						} catch (error) {
							Log.w('【ImageSearcher】第' + (i + 1) + '个TraceMoe搜索结果中没有文件名')
						}
						data_msg.push({
							message: msg,
							nickname: Bot.nickname,
							user_id: Bot.uin
						})
					} catch (error) {
						Log.w('【ImageSearcher】处理第' + (i + 1) + '个结果失败')
						Log.w(result[i])
					}
				}
				break
			case 5:
				Log.i(result)
				for (let i = 0; i < result.length; i++) {
					try {
						Log.m('【ImageSearcher】正在处理第' + (i + 1) + '个结果，共' + result.length + '个结果')
						let msg = []
						let result_ = result[i]
						try {
							image = result_.image
							msg.push(segment.image(image))
						} catch (error) {
							Log.w('【ImageSearcher】第' + (i + 1) + '个EHentai搜索结果中没有图片')
						}
						try {
							let title = result_.title
							msg.push(`[标题]：${title}`)
						} catch (error) {
							Log.w('【ImageSearcher】第' + (i + 1) + '个EHentai搜索结果中没有标题')
						}
						try {
							let link = result_.link
							msg.push(`\n[链接]：${link}`)
						} catch (error) {
							Log.w('【ImageSearcher】第' + (i + 1) + '个EHentai搜索结果中没有链接')
						}
						try {
							let type = result_.type
							msg.push(`\n[类型]：${type}`)
						} catch (error) {
							Log.w('【ImageSearcher】第' + (i + 1) + '个EHentai搜索结果中没有类型')
						}
						try {
							let date = result_.date
							msg.push(`\n[日期]：${date}`)
						} catch (error) {
							Log.w('【ImageSearcher】第' + (i + 1) + '个EHentai搜索结果中没有日期')
						}
						try {
							let tags = result_.tags
							msg.push(`\n[标签]：${tags}`)
						} catch (error) {
							Log.w('【ImageSearcher】第' + (i + 1) + '个EHentai搜索结果中没有标签')
						}
						data_msg.push({
							message: msg,
							nickname: Bot.nickname,
							user_id: Bot.uin
						})
					} catch (error) {
						Log.w('【ImageSearcher】处理第' + (i + 1) + '个结果失败')
						Log.w(result[i])
					}
				}
				break
			case 6:
				Log.i(result)
				for (let i = 0; i < result.length; i++) {
					try {
						Log.m('【ImageSearcher】正在处理第' + (i + 1) + '个结果，共' + result.length + '个结果')
						let msg = []
						let result_ = result[i]
						try {
							let thumb_url = result_.thumb.url
							msg.push(segment.image("http:" + thumb_url))
						} catch (error) {
							Log.w('【ImageSearcher】第' + (i + 1) + '个Yandex搜索结果中没有图片')
						}
						try {
							let snippet_title = result_.snippet.title
							msg.push(`[标题]：${snippet_title}`)
						} catch (error) {
							Log.w('【ImageSearcher】第' + (i + 1) + '个Yandex搜索结果中没有标题')
						}
						try {
							let snippet_text = result_.snippet.text
							msg.push(`\n[内容]：${snippet_text}`)
						} catch (error) {
							Log.w('【ImageSearcher】第' + (i + 1) + '个Yandex搜索结果中没有内容')
						}
						try {
							let snippet_url = result_.snippet.url
							msg.push(`\n[链接]：${snippet_url}`)
						} catch (error) {
							Log.w('【ImageSearcher】第' + (i + 1) + '个Yandex搜索结果中没有链接')
						}
						try {
							for (let i in result_.preview) {
								let preview_url = result_.preview[i].url
								let size = result_.preview[i].w + 'x' + result_.preview[i].h
								msg.push(`\n[预览]：[${size}] ${preview_url}`)
							}
						} catch (error) {
							Log.w('【ImageSearcher】第' + (i + 1) + '个Yandex搜索结果中没有预览')
						}
						data_msg.push({
							message: msg,
							nickname: Bot.nickname,
							user_id: Bot.uin
						})
					} catch (error) {
						Log.w('【ImageSearcher】处理第' + (i + 1) + '个结果失败')
						Log.w(result[i])
					}
				}
				break
		}
		ForwardMsg = e.isGroup ? await e.group.makeForwardMsg(data_msg) : await e.friend.makeForwardMsg(data_msg);
		e.reply(ForwardMsg)
		data_msg = []
		ForwardMsg = null
	}
}
async function ImageBed(filename) {
	return new Promise((resolve, reject) => {
		request.post('https://0x0.st', function(err, resp, body) {
				if (err) {
					reject(err);
				} else {
					resolve(body);
				}
			})
			.form()
			.append('file', fs.createReadStream(filename));
	});
}