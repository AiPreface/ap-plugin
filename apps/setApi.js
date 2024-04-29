/*
 * @Author: 渔火Arcadia  https://github.com/yhArcadia
 * @Date: 2022-12-19 22:18:54
 * @LastEditors: 苏沫柒 3146312184@qq.com
 * @LastEditTime: 2023-04-22 03:16:48
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\apps\set_api.js
 * @Description: 设置接口
 *
 * Copyright (c) 2022 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved.
 */
import plugin from '../../../lib/plugins/plugin.js'
import Config from '../components/ai_painting/config.js'
import Log from '../utils/Log.js'
import axios from 'axios'
import fetch from 'node-fetch'
import translate from '../utils/translate.js'

export class set extends plugin {
  constructor () {
    super({
      name: 'AP-设置',
      dsc: '更改AiPainting设置',
      event: 'message',
      priority: 1009,
      rule: [
        {
          reg: '^#ap(添加|新增|录入)接口',
          fnc: 'addapi',
          permission: 'master'
        },
        {
          reg: '^#ap设置接口(\\d{1,3})$',
          fnc: 'selectapi',
          permission: 'master'
        },
        {
          reg: '^#ap设置接口(\\d{1,3})账号(.+)密码(.+)$',
          fnc: 'set_sd_info',
          permission: 'master'
        },
        {
          reg: '^#ap删除接口(\\d{1,3})$',
          fnc: 'delapi',
          permission: 'master'
        },
        {
          reg: '^#ap设置(鉴赏接口|大清晰术接口|检查ai接口|去背景接口|动漫化接口|图片转音乐接口|二次元美学接口|OpenAI密钥).+',
          fnc: 'setother',
          permission: 'master'
        },
        {
          reg: '^#ap设置百度(appid|apikey|secretkey).+',
          fnc: 'setBaiduKey',
          permission: 'master'
        },
        {
          reg: '^#ap设置(百度|有道)翻译(id|key).+',
          fnc: 'setTranslateToken',
          permission: 'master'
        },
        {
          reg: '^#ap接口列表$',
          fnc: 'apilist'
          // permission: "master",
        },
        {
          reg: '^#ap设置$',
          fnc: 'config',
          permission: 'master'
        },
        {
          reg: '^#采样器列表$',
          fnc: 'samplerlist'
          // permission: "master",
        }
      ]
    })
  }

  /** 添加绘图接口 */
  async addapi (e) {
    const regExp = /^#ap(添加|新增|录入)接口((http|localhost).+)备注(.+)$/
    const regp = regExp.exec(e.msg)

    if (!regp) {
      e.reply(
        '命令格式：#ap添加接口[接口地址]备注[接口备注]\n例如:\n     #ap添加接口http://example.com:7860备注V100'
      )
      return true
    }

    if (regp[2].includes('localhost')) {
      regp[2] = regp[2].replace('localhost', '127.0.0.1')
    }

    let api = regp[2].trim()
    const remark = regp[4].trim()

    if (api.endsWith('/')) api = api.replace(/\/$/, '').trim()

    if (/hf.space/.test(api)) {
      return e.reply(
        '大清晰术和鉴赏的接口无法用于绘图哦，详见https://ap-plugin.com/Config/'
      )
    }

    const apcfg = await Config.getcfg()

    for (const val of apcfg.APIList) {
      if (val.url == api) {
        return await e.reply(`已存在该接口:${api}  [${val.remark}]`)
      }
    }
    // 检测接口连通性
    // if (!await this.testapi(api, '绘图')) { return false }

    const obj = {
      url: api,
      remark,
      account_id: '',
      account_password: '',
      token: ''
    }
    apcfg.APIList.push(obj)
    Config.setcfg(apcfg)

    e.reply(`新增接口成功：\n${api}  [${remark}]`)
    return true
  }

  /** 选择默认接口 */
  async selectapi (e) {
    const num = e.msg.replace('#ap设置接口', '')
    const apcfg = await Config.getcfg()
    if (num > apcfg.APIList.length || num < 1) {
      const li = []
      let i = 1
      for (const val of apcfg.APIList) {
        li.push(
          `${i}：${val.remark}${i == apcfg.usingAPI ? ' [当前]' : ''}${e.isPrivate && e.isMaster ? `\n  ${val.url}` : ''}`
        )
        i++
      }
      e.reply(`接口${num}不存在,当前可选接口为：\n${li.join('\n')}`)
      return true
    }
    apcfg.usingAPI = Number(num)
    Config.setcfg(apcfg)
    e.reply(
      `默认接口已设置为${num}：${apcfg.APIList[num - 1].remark}${e.isPrivate && e.isMaster ? `\n  ${apcfg.APIList[num - 1].url}` : ''}`
    )
    return true
  }

  /** 设置接口密码 */
  async set_sd_info (e) {
    const ret = /^#ap设置接口(\d{1,3})账号(.+)密码(.+)$/.exec(e.msg)
    const num = ret[1]
    const account_id = ret[2]
    const account_password = ret[3]
    Log.w(num, account_id, account_password)
    const apcfg = await Config.getcfg()
    if (num > apcfg.APIList.length || num < 1) {
      const li = []
      let i = 1
      for (const val of apcfg.APIList) {
        li.push(
          `${i}：${val.remark}${i == apcfg.usingAPI ? ' [当前]' : ''}${e.isPrivate && e.isMaster ? `\n  ${val.url}` : ''}`
        )
        i++
      }
      e.reply(`接口${num}不存在,当前可选接口为：\n${li.join('\n')}`)
      return true
    }
    apcfg.APIList[num - 1].account_id = account_id
    apcfg.APIList[num - 1].account_password = account_password
    Config.setcfg(apcfg)
    e.reply(
      `接口${num}：${apcfg.APIList[num - 1].remark}${e.isPrivate && e.isMaster ? `\n  ${apcfg.APIList[num - 1].url}` : ''}\n账号已设置为：${account_id}\n密码已设置为：${account_password}`
    )
    return true
  }

  /** 删除指定绘图接口  */
  async delapi (e) {
    const num = e.msg.replace('#ap删除接口', '')
    const apcfg = await Config.getcfg()
    if (num > apcfg.APIList.length || num < 1) {
      const li = []
      let i = 1
      for (const val of apcfg.APIList) {
        li.push(
          `${i}：${val.remark}${i == apcfg.usingAPI ? ' [当前]' : ''}${e.isPrivate && e.isMaster ? `\n  ${val.url}` : ''}`
        )
        i++
      }
      e.reply(`接口${num}不存在,当前可选接口为：\n${li.join('\n')}`)
      return true
    }

    const target = apcfg.APIList[num - 1]
    const ischange = num == apcfg.usingAPI

    if (num <= apcfg.usingAPI && apcfg.usingAPI > 1) apcfg.usingAPI--

    apcfg.APIList.splice(num - 1, 1)

    Config.setcfg(apcfg)

    const msg = [
      `成功删除接口${num}：${target.remark}${e.isPrivate && e.isMaster ? `\n  ${target.url}` : ''}`,
      apcfg.APIList.length == 0
        ? '\n当前接口列表为空'
        : ischange
          ? `\n默认接口已更改为${apcfg.usingAPI}：${apcfg.APIList[apcfg.usingAPI - 1].remark}${e.isPrivate && e.isMaster ? `\n  ${apcfg.APIList[apcfg.usingAPI - 1].url}` : ''}`
          : ''
    ]

    e.reply(msg)
    return true
  }

  /** 查看接口列表     */
  async apilist (e) {
    const apcfg = await Config.getcfg()
    const li = []
    let i = 1
    if (apcfg.APIList.length == 0) {
      return e.reply(
        '当前无可用接口，请先添加接口\n命令：#ap添加接口\n参考文档：https://ap-plugin.com/Config/docs1'
      )
    }
    for (const val of apcfg.APIList) {
      li.push(
        `${i}：${val.remark}${i == apcfg.usingAPI ? ' [默认]' : ''}` +
          (e.isPrivate && e.isMaster ? `\n   ${val.url}` : '')
      )
      i++
    }
    e.reply(li.join('\n'))
    return true
  }

  /**  查看当前ap设置 */
  async config (e) {
    const policy = await Config.getPolicy()
    const gp = policy.gp

    let msg = [
      `全局CD：${policy.cd}秒\n`,
      `本地检索图片最大${policy.localNum}张\n`,
      `保存图片至本地：${policy.isDownload ? '是' : '否'}\n`,
      `有人绘制违规图片时通知主人：${policy.isTellMaster ? '是' : '否'}\n`,

      '\n=========ap策略=========\n',

      '\n[全局]：',
      `\n      启用ap：${gp.global.enable ? '是' : '否'}`,
      '\n      每日用量限制：' +
        (gp.global.usageLimit ? `${gp.global.usageLimit}张` : '不限'),
      `\n      启用图片审核：${gp.global.JH ? '是' : '否'}`,
      `\n      群聊内共享CD：${gp.global.gcd}秒`,
      `\n      个人CD：${gp.global.pcd}秒`,
      `\n      自动撤回图片：${gp.global.isRecall ? '是' : '否'}`,
      `\n      自动撤回延时：${gp.global.recallDelay}秒`,
      `\n      封禁使用屏蔽词绘图的用户：${gp.global.isBan ? '是' : '否'}`
    ]

    const msg_ = []
    for (const gid in gp) {
      if (gid == 'global') continue
      if (gid == 'private') {
        msg_.push('\n\n[私聊]：')
      } else {
        let gname = '未知群聊'
        try {
          const ginfo = await Bot.getGroupInfo(Number(gid))
          gname = ginfo ? ginfo.group_name : '未知群聊'
        } catch (err) {}
        msg_.push(
          `\n\n[${gname}]` +
            (e.isPrivate && e.isMaster ? `(${gid})` : '') +
            '：'
        )
      }
      for (const val of Object.keys(gp[gid])) {
        let opt =
          val == 'enable'
            ? '\n      启用ap：'
            : val == 'JH'
              ? '\n      启用图片审核：'
              : val == 'isRecall'
                ? '\n      自动撤回图片：'
                : val == 'isBan'
                  ? '\n      封禁使用屏蔽词绘图的用户：'
                  : ''
        if (opt) {
          msg_.push(opt + `${gp[gid][val] ? '是' : '否'}`)
          continue
        }

        opt =
          val == 'gcd'
            ? '\n      群聊内共享CD：'
            : val == 'pcd'
              ? '\n      个人CD：'
              : val == 'recallDelay'
                ? '\n      自动撤回延时：'
                : ''
        if (opt) {
          msg_.push(opt + `${gp[gid][val]}秒`)
          continue
        }
        msg_.push(
          '\n      每日用量限制：' +
            (gp[gid][val] ? `${gp[gid][val]}张` : '不限')
        )
      }
    }
    if (msg_) msg = msg.concat(msg_)
    e.reply(msg.join(''))
    return true
  }

  async setother (e) {
    const jianshang_reg = /^#ap设置鉴赏接口 ?(http.+)$/
    const super_resolution_reg = /^#ap设置大清晰术接口 ?(http.+)$/
    const ai_detect_reg = /^#ap设置检查ai接口 ?(http.+)$/
    const remove_bg_reg = /^#ap设置去背景接口 ?(http.+)$/
    const cartoonization_reg = /^#ap设置动漫化接口 ?(http.+)$/
    const img_to_music_reg = /^#ap设置图片转音乐接口 ?(http.+)$/
    const anime_aesthetic_predict_reg = /^#ap设置二次元美学接口 ?(http.+)$/
    const openai_key_reg = /^#ap设置OpenAI密钥 ?(sk-.+)$/

    const jianshang = jianshang_reg.exec(e.msg)
    if (jianshang) {
      return this.writecfg(jianshang, 'appreciate')
    }

    const RC = super_resolution_reg.exec(e.msg)
    if (RC) {
      return this.writecfg(RC, 'Real_CUGAN')
    }

    const ai_detect = ai_detect_reg.exec(e.msg)
    if (ai_detect) {
      return this.writecfg(ai_detect, 'ai_detect')
    }

    const remove_bg = remove_bg_reg.exec(e.msg)
    if (remove_bg) {
      return this.writecfg(remove_bg, 'remove_bg')
    }

    const cartoonization = cartoonization_reg.exec(e.msg)
    if (cartoonization) {
      return this.writecfg(cartoonization, 'cartoonization')
    }

    const img_to_music = img_to_music_reg.exec(e.msg)
    if (img_to_music) {
      return this.writecfg(img_to_music, 'img_to_music')
    }

    const anime_aesthetic_predict = anime_aesthetic_predict_reg.exec(e.msg)
    if (anime_aesthetic_predict) {
      return this.writecfg(anime_aesthetic_predict, 'anime_aesthetic_predict')
    }

    const openai_key = openai_key_reg.exec(e.msg)
    if (openai_key) {
      return this.writecfg(openai_key, 'openai_key')
    }
    return false
  }

  /** 写入配置
   * @param {*} ret 匹配到的正则
   * @param {*} type 属性类型
   * @return {*}
   */
  async writecfg (ret, type) {
    let value = ret[1].trim()
    if (type == 'Real_CUGAN' && !value.endsWith('/')) value = value + '/'
    if (
      (type == 'appreciate' || type == 'ai_detect' || type == 'remove_bg') &&
      value.endsWith('/')
    ) {
      value = value.replace(/\/$/, '').trim()
    }
    if (type == 'cartoonization') {
      value = value.replace('/+/', '/').replace(/\/$/, '')
    }
    if (type == 'img_to_music' && !value.endsWith('/')) value = value + '/'
    if (type == 'anime_aesthetic_predict' && !value.endsWith('/')) {
      value = value + '/'
    }
    if (type == 'openai_key') value = value.replace(/\/$/, '')

    // if (type == 'appreciate' || type == 'ai_detect')
    //     if (!value.endsWith('predict'))
    //         return this.e.reply('鉴赏接口和检查ai接口应当以“predict”结尾')

    // 测试接口连通性
    if (type != 'remove_bg' && type != 'openai_key') {
      if (!(await this.testapi(value, type))) {
        return false
      }
    }

    try {
      const apcfg = await Config.getcfg()
      apcfg[type] = value
      await Config.setcfg(apcfg)
    } catch (err) {
      Log.e(err)
      Log.e(err.message)
      return this.e.reply('设置失败。请查看控制台报错', true)
    }
    this.e.reply('设置成功，若未生效请重启Bot')

    return true
  }

  /** 检测接口的连通性
   * @param {*} api 接口地址
   * @param {*} type 接口类型：绘图 or ""
   * @return {*}
   */
  async testapi (api, type = '') {
    if (type == '绘图') {
      api = api + '/sdapi/v1/txt2img'
    }
    this.e.reply('正在测试接口连通性，请稍候')
    const testres = await test_api(api)
    this.e.reply(
      testres ? '接口可用' : '接口未正确响应，您可能配置了错误的接口',
      true
    )
    return testres
  }

  /** 查看当前接口支持的采样器列表 */
  async samplerlist (e) {
    // 取默认接口
    const apcfg = await Config.getcfg()
    if (apcfg.APIList.length == 0) {
      e.reply('当前暂无可用接口')
      return true
    }
    const index = apcfg.usingAPI
    const apiobj = apcfg.APIList[index - 1]
    const api = apiobj.url // 接口
    const remark = apiobj.remark // 接口备注
    try {
      let res = await fetch(api + '/sdapi/v1/samplers')
      if (res.status == 404) {
        return e.reply('拉取列表失败')
      }
      res = await res.json()
      const samplerList = []
      for (const val of res) samplerList.push(val.name)
      e.reply(`当前接口[${remark}]支持如下采样器：\n` + samplerList.join('\n'))
    } catch (err) {
      Log.e(err)
      return e.reply('拉取列表失败')
    }
    return true
  }

  /** 设置百度和有道翻译的appid和key  */
  async setTranslateToken (e) {
    let company = ''
    let company_ = ''
    let type = ''
    let value = ''
    const regExp = /^#ap设置(百度|有道)翻译(id|key)(.+)/
    const reg = regExp.exec(e.msg)
    if (reg) {
      value = reg[3].trim()
    }
    if (/^#ap设置百度/.test(e.msg)) {
      company = 'baidu_translate'
      company_ = '百度'
    } else if (/^#ap设置有道/.test(e.msg)) {
      company = 'youdao_translate'
      company_ = '有道'
    }
    if (/^#ap设置(百度|有道)翻译id/.test(e.msg)) {
      type = 'id'
    } else if (/^#ap设置(百度|有道)翻译key/.test(e.msg)) {
      type = 'key'
    }

    if (!(company && type && value)) {
      return e.reply(
        '命令格式：#ap设百度(或有道)翻译id(或key) 你的翻译id或key\n(不带加号)'
      )
    }
    Log.w(company, type, value)

    const apcfg = await Config.getcfg()
    apcfg[company][type] = value
    await Config.setcfg(apcfg)
    e.reply(`${company_}翻译的${type}已设置为：【${value}】`)
    if (apcfg[company].id && apcfg[company].key) {
      if (await this.testTranslate(company_, apcfg[company])) {
        setTimeout(() => {
          e.reply(
            `${company_}翻译配置成功，将优先使用该翻译接口。请重启Bot以应用配置`
          )
        }, 500)
      } else {
        setTimeout(() => {
          e.reply(`${company_}翻译调用失败，请检查您的appid和key是否有误`)
        }, 500)
      }
    }
    return true
  }

  /** 测试用户配置的翻译接口的连通性 */
  async testTranslate (company_, verify) {
    if (company_ == '百度') {
      const res = await translate.BaiduTranslate('测试', verify.id, verify.key)
      if (res) {
        Log.i(res)
        return true
      }
    } else if (company_ == '有道') {
      const res = await translate.YoudaoTranslate(
        '测试',
        verify.id,
        verify.key
      )
      if (res) {
        Log.i(res)
        return true
      }
    }
    return false
  }

  /** 设置百度图片审核所需key */
  async setBaiduKey (e) {
    const baidu_appid_reg = /^#ap设置百度appid ?(\d{8})$/
    const baidu_ak_reg = /^#ap设置百度apikey ?([A-Za-z0-9]+)$/
    const baidu_sk_reg = /^#ap设置百度secretkey ?([A-Za-z0-9]+)$/

    let value = null
    let type = null

    const bdappid = baidu_appid_reg.exec(e.msg)
    const bdkey = baidu_ak_reg.exec(e.msg)
    const bdsk = baidu_sk_reg.exec(e.msg)
    if (bdappid) {
      value = Number(bdappid[1].trim())
      type = 'baidu_appid'
    } else if (bdkey) {
      value = bdkey[1].trim()
      type = 'baidu_apikey'
    } else if (bdsk) {
      value = bdsk[1].trim()
      type = 'baidu_secretkey'
    }
    if (!value || !type) {
      return false
    }
    try {
      const apcfg = await Config.getcfg()
      apcfg[type] = value
      await Config.setcfg(apcfg)
    } catch (err) {
      Log.e(err)
      Log.e(err.message)
      return this.e.reply('设置失败。请查看控制台报错', true)
    }
    this.e.reply('设置成功，若未生效请重启Bot')
    return true
  }
}

/** 请求接口，判断是否收到了正确的响应
 * @param {*} api 接口地址
 */
export async function test_api (api) {
  try {
    let res = await axios.get(api, {
      timeout: 5000
    })
    res = await res.json()
    if (!res.data.detail == 'Method Not Allowed') {
      return false
    }
  } catch (err) {
    Log.e(err)
    if (err.message == 'Request failed with status code 405') return true
    else return false
  }
  return false
}
