import plugin from '../../../lib/plugins/plugin.js'
import axios from 'axios'
import { parseImg } from '../utils/utils.js'
import { requestAppreciate } from './appreciation.js'
import Log from '../utils/Log.js'

export class ChimeraGPT extends plugin {
  constructor () {
    super({
      /** 功能名称 */
      name: 'ChimeraGPT',
      /** 功能描述 */
      dsc: 'ChimeraGPT',
      /** https://oicqjs.github.io/oicq/#events */
      event: 'message',
      /** 优先级，数字越小等级越高 */
      priority: 5000,
      rule: [
        {
          /** 命令正则匹配 */
          reg: '^#?(CGPT|cgpt)(新增|添加)预设.*内容([\\s\\S]*)$',
          /** 执行方法 */
          fnc: 'newSystem'
        },
        {
          /** 命令正则匹配 */
          reg: '^#?(CGPT|cgpt)预设列表$',
          /** 执行方法 */
          fnc: 'systemList'
        },
        {
          /** 命令正则匹配 */
          reg: '^#?(CGPT|cgpt)删除预设.*$',
          /** 执行方法 */
          fnc: 'delSystem'
        },
        {
          /** 命令正则匹配 */
          reg: '^#?(CGPT|cgpt)查看预设.*$',
          /** 执行方法 */
          fnc: 'viewSystem'
        },
        {
          /** 命令正则匹配 */
          reg: '^#?(CGPT|cgpt)使用预设.*$',
          /** 执行方法 */
          fnc: 'setSystem'
        },
        {
          /** 命令正则匹配 */
          reg: '^#?(CGPT|cgpt)我的配置$',
          /** 执行方法 */
          fnc: 'myConfig'
        },
        {
          /** 命令正则匹配 */
          reg: '^#?(CGPT|cgpt)导入预设.*$',
          /** 执行方法 */
          fnc: 'importSystem'
        },
        {
          /** 命令正则匹配 */
          reg: '^#?(CGPT|cgpt)(设置|切换)模型.*$',
          /** 执行方法 */
          fnc: 'setModel'
        },
        {
          /** 命令正则匹配 */
          reg: '^#?(CGPT|cgpt)模型列表$',
          /** 执行方法 */
          fnc: 'modelList'
        },
        {
          /** 命令正则匹配 */
          reg: '^#?(CGPT|cgpt)重置对话$',
          /** 执行方法 */
          fnc: 'remake'
        },
        {
          /** 命令正则匹配 */
          reg: '^#?(CGPT|cgpt)([\\s\\S]*)$',
          /** 执行方法 */
          fnc: 'completions'
        }
      ]
    })
  }

  async newSystem (e) {
    const name = e.msg
      .replace(/^#?(CGPT|cgpt)(新增|添加)预设/, '')
      .trim()
      .split('内容')[0]
      .trim()
    const message = e.msg
      .replace(/^#?(CGPT|cgpt)(新增|添加)预设/, '')
      .trim()
      .split('内容')[1]
      .trim()
    if (!name || !message) {
      e.reply(
        '格式错误，正确格式：#CGPT设置预设[预设名称]内容[预设内容]',
        true
      )
      return true
    }
    if (await redis.exists(`Yz:AiPainting:CGPT:system:${name}`)) {
      e.reply('已存在同名预设，输入#CGPT预设列表查看预设列表', true)
      return true
    }
    await redis.set(`Yz:AiPainting:CGPT:system:${name}`, message)
    e.reply('设置预设[' + name + ']成功', true)
  }

  async systemList (e) {
    const list = await redis.keys('Yz:AiPainting:CGPT:system:*')
    let msg = '预设列表：\n'
    for (let i = 0; i < list.length; i++) {
      msg +=
        '【' +
        (i + 1) +
        '】' +
        list[i].replace('Yz:AiPainting:CGPT:system:', '') +
        '\n'
    }
    msg += '\n\n输入#CGPT查看预设[预设名称]查看预设内容'
    msg += '\n输入#CGPT添加预设[预设名称]内容[预设内容]设置预设'
    msg += '\n输入#CGPT删除预设[预设名称]删除预设'
    msg += '\n输入#CGPT导入预设[预设名称]导入预设'
    msg += '\n输入#CGPT使用预设[预设名称]使用预设'
    const data_msg = [
      {
        message: segment.text(msg),
        nickname: Bot.nickname,
        user_id: Bot.uin
      }
    ]
    if (e.isGroup) await e.reply(await e.group.makeForwardMsg(data_msg))
    else await e.reply(await e.friend.makeForwardMsg(data_msg))
  }

  async delSystem (e) {
    const name = e.msg.replace(/^#?(CGPT|cgpt)删除预设/, '').trim()
    if (!name) {
      e.reply('格式错误，正确格式：#CGPT删除预设[预设名称]', true)
      return true
    }
    if (!(await redis.exists(`Yz:AiPainting:CGPT:system:${name}`))) {
      e.reply('不存在该预设，输入#CGPT预设列表查看预设列表', true)
      return true
    }
    await redis.del(`Yz:AiPainting:CGPT:system:${name}`)
    e.reply('删除预设[' + name + ']成功', true)
  }

  async viewSystem (e) {
    const name = e.msg.replace(/^#?(CGPT|cgpt)查看预设/, '').trim()
    if (!name) {
      e.reply('格式错误，正确格式：#CGPT查看预设[预设名称]', true)
      return true
    }
    if (!(await redis.exists(`Yz:AiPainting:CGPT:system:${name}`))) {
      e.reply('不存在该预设，输入#CGPT预设列表查看预设列表', true)
      return true
    }
    const message = await redis.get(`Yz:AiPainting:CGPT:system:${name}`)
    e.reply('预设[' + name + ']内容：\n' + message, true)
  }

  async setSystem (e) {
    await initRedis(e)
    let redisData = await redis.get(`Yz:AiPainting:CGPT:config:${e.user_id}`)
    redisData = JSON.parse(redisData)
    const name = e.msg.replace(/^#?(CGPT|cgpt)使用预设/, '').trim()
    if (!name) {
      e.reply('格式错误，正确格式：#CGPT使用预设[预设名称]', true)
      return true
    }
    if (!(await redis.exists(`Yz:AiPainting:CGPT:system:${name}`))) {
      e.reply('不存在该预设，输入#CGPT预设列表查看预设列表', true)
      return true
    }
    redisData.system = name
    await redis.set(
      `Yz:AiPainting:CGPT:config:${e.user_id}`,
      JSON.stringify(redisData)
    )
    e.reply('设置预设[' + name + ']成功', true)
  }

  async myConfig (e) {
    await initRedis(e)
    const config = JSON.parse(
      await redis.get(`Yz:AiPainting:CGPT:config:${e.user_id}`)
    )
    let msg = '使用模型：' + config.model + '\n'
    msg += '使用预设：' + (config.system || '无')
    e.reply(msg, true)
  }

  async importSystem (e) {
    e.reply('待填坑，咕咕咕', true)
  }

  async setModel (e) {
    await initRedis(e)
    let redisData = await redis.get(`Yz:AiPainting:CGPT:config:${e.user_id}`)
    redisData = JSON.parse(redisData)
    const message = e.msg.replace(/^#?(CGPT|cgpt)(设置|切换)模型/, '').trim()
    const modelList = []
    try {
      const response = await axios.get('http://openai.yuri.ski/v1/models')
      for (let i = 0; i < response.data.data.length; i++) {
        modelList.push(response.data.data[i].id)
      }
    } catch (error) {
      e.reply('出错了，请查看控制台输出', true)
      Log.e(error)
    }
    if (!isNaN(message)) {
      if (message > 0 && message <= modelList.length) {
        redisData.model = modelList[message - 1]
        await redis.set(
          `Yz:AiPainting:CGPT:config:${e.user_id}`,
          JSON.stringify(redisData)
        )
        e.reply('模型已设置为' + modelList[message - 1], true)
      } else {
        e.reply(
          '模型不存在，当前只有' +
            modelList.length +
            '个模型，输入#CGPT模型列表查看模型列表',
          true
        )
        return true
      }
    } else if (modelList.indexOf(message) == -1) {
      e.reply('模型不存在，输入#CGPT模型列表查看模型列表', true)
      return true
    } else {
      redisData.model = message
      await redis.set(
        `Yz:AiPainting:CGPT:config:${e.user_id}`,
        JSON.stringify(redisData)
      )
      e.reply('模型已设置为' + message, true)
      return true
    }
  }

  async modelList (e) {
    try {
      const response = await axios.get('http://openai.yuri.ski/v1/models')
      const modelList = response.data.data
      const data_msg = []
      for (const key in modelList) {
        data_msg.push({
          message: `${Number(key) + 1} \n├模型：${
            modelList[key].id
          } \n├服务商：${modelList[key].category} \n├类型：${
            modelList[key].type
          } \n└对话最大字符：${modelList[key].tokens}`,
          nickname: Bot.nickname,
          user_id: Bot.uin
        })
      }
      if (e.isGroup) await e.reply(await e.group.makeForwardMsg(data_msg))
      else await e.reply(await e.friend.makeForwardMsg(data_msg))
    } catch (error) {
      e.reply('出错了，请查看控制台输出', true)
      Log.e(error)
    }
    return true
  }

  async remake (e) {
    await initRedis(e)
    let redisData = await redis.get(`Yz:AiPainting:CGPT:config:${e.user_id}`)
    redisData = JSON.parse(redisData)
    redisData.messages = []
    await redis.set(
      `Yz:AiPainting:CGPT:config:${e.user_id}`,
      JSON.stringify(redisData)
    )
    e.reply('已重置您的对话', true)
  }

  async completions (e) {
    await initRedis(e)
    let redisData = await redis.get(`Yz:AiPainting:CGPT:config:${e.user_id}`)
    redisData = JSON.parse(redisData)
    let message = e.msg.replace(/^#?(CGPT|cgpt)/, '').trim()
    e.reply('让我想想该如何回复您~', false, { recallMsg: 15 })
    e = await parseImg(e)
    if (this.e.img) {
      const base64 = await axios
        .get(e.img, { responseType: 'arraybuffer' })
        .then((res) => Buffer.from(res.data, 'binary').toString('base64'))
      const tags = await requestAppreciate(base64)
      if (tags) {
        message +=
          '，（这是图片Prompt，如果我问你你才需要使用它，否则请无视: ' +
          tags +
          '）'
      }
    }
    const message_data = {
      role: 'user',
      content: message
    }
    if (redisData.messages.length == 0) {
      if (redisData.system) {
        if (
          !(await redis.exists(`Yz:AiPainting:CGPT:system:${redisData.system}`))
        ) {
          e.reply('您的预设[' + redisData.system + ']不存在，请重新设置', true)
          return true
        }
        const system = await redis.get(
          `Yz:AiPainting:CGPT:system:${redisData.system}`
        )
        redisData.messages.push({
          role: 'system',
          content: system
        })
      } else {
        redisData.messages = []
      }
    }
    let use = 0
    if (redisData.messages != []) {
      for (let i = 0; i < redisData.messages.length; i++) {
        use += redisData.messages[i].content.length
      }
    }
    await usageCheck(use, e, redisData.model)
    redisData.messages.push(message_data)
    const data = {
      model: redisData.model,
      messages: redisData.messages,
      stream: false
    }
    try {
      const response = await axios.post(
        'http://openai.yuri.ski/v1/chat/completions',
        data
      )
      const replyMessage = response.data.choices[0].message
      e.reply(replyMessage.content, true)
      redisData.messages.push({
        role: 'assistant',
        content: replyMessage.content
      })
      await redis.set(
        `Yz:AiPainting:CGPT:config:${e.user_id}`,
        JSON.stringify(redisData)
      )
    } catch (error) {
      e.reply('出错了，请查看控制台输出', true)
      Log.e(error)
    }
    return true
  }
}

async function usageCheck (use, e, model) {
  const modelToken = {}
  let redisData = await redis.get(`Yz:AiPainting:CGPT:config:${e.user_id}`)
  redisData = JSON.parse(redisData)
  try {
    const response = await axios.get('http://openai.yuri.ski/v1/models')
    const modelList = response.data.data
    for (let i = 0; i < modelList.length; i++) {
      modelToken[modelList[i].id] = modelList[i].tokens
    }
  } catch (error) {
    e.reply('出错了，请查看控制台输出', true)
    Log.e(error)
  }
  let totuse = 0
  for (let i = 0; i < redisData.messages.length; i++) {
    totuse += redisData.messages[i].content.length
  }
  Log.e('还可以使用' + (modelToken[model] - totuse) + '个字符')
  if (totuse + use > modelToken[model]) {
    if (redisData.messages[0].role == 'system') {
      redisData.messages.splice(1, 2)
    } else {
      redisData.messages.splice(0, 2)
    }
    usageCheck(use, e, model)
  }
  return true
}

async function initRedis (e) {
  if (!(await redis.exists(`Yz:AiPainting:CGPT:config:${e.user_id}`))) {
    await redis.set(
      `Yz:AiPainting:CGPT:config:${e.user_id}`,
      JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [],
        system: null
      })
    )
    Log.e('初始化成功')
  } else {
    let config = await redis.get(`Yz:AiPainting:CGPT:config:${e.user_id}`)
    config = JSON.parse(config)
    if (!config.model) {
      config.model = 'gpt-3.5-turbo'
    }
    if (!config.messages) {
      config.messages = []
    }
    if (!config.system) {
      config.system = null
    }
    await redis.set(
      `Yz:AiPainting:CGPT:config:${e.user_id}`,
      JSON.stringify(config)
    )
  }
  return true
}
