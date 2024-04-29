/*
 * @Author: 苏沫柒 3146312184@qq.com
 * @Date: 2023-05-02 13:05:50
 * @LastEditors: 苏沫柒 3146312184@qq.com
 * @LastEditTime: 2023-05-03 16:21:50
 * @FilePath: \ap-plugin\apps\apHelp.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import plugin from '../../../lib/plugins/plugin.js'
import axios from 'axios'
import FormData from 'form-data'
import Log from '../utils/Log.js'

const _path = process.cwd()

export class apHelp extends plugin {
  constructor () {
    super({
      /** 功能名称 */
      name: 'AP-助手',
      /** 功能描述 */
      dsc: 'AP助手，对服务器进行额外操作',
      event: 'message',
      /** 优先级，数字越小等级越高 */
      priority: 1009,
      rule: [
        {
          /** 命令正则匹配 */
          reg: '^#ap关闭sd$',
          /** 执行方法 */
          fnc: 'closeSd',
          /** 主人权限 */
          permission: 'master'
        },
        {
          /** 命令正则匹配 */
          reg: '^#ap开启sd$',
          /** 执行方法 */
          fnc: 'openSd',
          /** 主人权限 */
          permission: 'master'
        },
        {
          /** 命令正则匹配 */
          reg: '^#ap设置ap助手.*密钥.*$',
          /** 执行方法 */
          fnc: 'setSd',
          /** 主人权限 */
          permission: 'master'
        },
        {
          /** 命令正则匹配 */
          reg: '^#ap下载.*模型.*$',
          /** 执行方法 */
          fnc: 'downloadModel',
          /** 主人权限 */
          permission: 'master'
        },
        {
          /** 命令正则匹配 */
          reg: '^#ap下载状态$',
          /** 执行方法 */
          fnc: 'downloadStatus',
          /** 主人权限 */
          permission: 'master'
        },
        {
          /** 命令正则匹配 */
          reg: '^#ap停止下载.*$',
          /** 执行方法 */
          fnc: 'stopDownload',
          /** 主人权限 */
          permission: 'master'
        }
      ]
    })
  }

  async closeSd (e) {}
  async openSd (e) {}
  async setSd (e) {
    let server = e.msg.match(/(?<=ap助手).*?(?=密钥)/g)
    let key = e.msg.match(/(?<=密钥).*?(?=$)/g)
    server = server.toString()
    key = key.toString()
    if (server && key) {
      await axios
        .get(
          server,
          {
            headers: {
              Authorization: key
            }
          },
          {
            timeout: 10000
          }
        )
        .catch((err) => {
          if (err.response == undefined) {
            e.reply('设置失败，连接超时', true)
          } else if (err.response.status == 404) {
            redis.set('ap_server', server)
            redis.set('ap_key', key)
            e.reply(`设置成功\n监听地址为${server}\n密钥为${key}`, true)
          } else if (err.response.status == 401 || err.response.status == 403) {
            e.reply(
              '设置失败，密钥错误，请在服务端打开server_config.ini查看或更改密钥',
              true
            )
          } else {
            e.reply('设置失败，这个接口似乎不是AP助手的接口', true)
          }
        })
    } else {
      e.reply(
        '设置失败，格式错误，正确格式为：#ap设置ap助手<AP助手监听地址>密钥<密钥>',
        true
      )
    }
    return true
  }

  async downloadModel (e) {
    let type = e.msg.match(/(?<=#ap下载).*?(?=模型)/g)
    let file_url = e.msg.match(/(?<=模型).*?(?=$)/g)
    type = type.toString()
    file_url = file_url.toString()
    const server = await redis.get('ap_server')
    const key = await redis.get('ap_key')
    if (!server || !key) {
      e.reply('查询失败，未设置AP助手监听地址或密钥', true)
    }
    if (type && file_url) {
      if (type == 'ckpt' || type == 'vae' || type == 'emb' || type == 'lora') {
        const server = await redis.get('ap_server')
        const key = await redis.get('ap_key')
        const form = new FormData()
        form.append('type', type)
        form.append('file_url', file_url)
        const response = await axios
          .post(
            `${server}/download`,
            form,
            {
              headers: {
                Authorization: key
              }
            },
            {
              timeout: 10000
            }
          )
          .catch((err) => {
            Log.e(err)
            if (err.response == undefined) {
              e.reply('下载失败，连接超时', true)
            } else if (err.response.status == 404) {
              e.reply('下载失败，AP助手监听地址失效', true)
            } else if (err.response.status == 401) {
              e.reply(
                '下载失败，密钥错误，请在服务端打开server_config.ini查看或更改密钥',
                true
              )
            } else {
              e.reply('下载失败，未知错误', true)
            }
          })
        if (response) {
          if (response.data.status == 'ok') {
            const file_name = response.data.msg.match(
              /(?<=链接:.*\/).*?(?=开始下载)/g
            )
            e.reply(
              `正在下载[${response.data.gid}]${file_name}\n发送#ap下载状态查看下载进度`,
              true
            )
          } else {
            e.reply('下载失败，AP助手内部错误', true)
          }
        }
      } else {
        e.reply(
          '下载失败，格式错误，正确格式为：#ap下载<ckpt|vae|emb|lora>模型<下载地址>',
          true
        )
      }
    }
    return true
  }

  async downloadStatus (e) {
    const server = await redis.get('ap_server')
    const key = await redis.get('ap_key')
    if (!server || !key) {
      e.reply('查询失败，未设置AP助手监听地址或密钥', true)
    }
    const response = await axios
      .get(
        `${server}/download_status`,
        {
          headers: {
            Authorization: key
          }
        },
        {
          timeout: 10000
        }
      )
      .catch((err) => {
        if (err.response == undefined) {
          e.reply('查询失败，连接超时', true)
        } else if (err.response.status == 404) {
          e.reply('查询失败，AP助手监听地址失效', true)
        } else if (err.response.status == 401) {
          e.reply(
            '查询失败，密钥错误，请在服务端打开server_config.ini查看或更改密钥',
            true
          )
        } else {
          e.reply('查询失败，未知错误', true)
        }
      })
    if (response) {
      if (response.data.length == 0) {
        e.reply('暂无下载任务', true)
        return true
      }
      let msg = '[下载状态]文件名   下载速度   已下载/总大小   gid'
      for (let i = 0; i < response.data.length; i++) {
        const item = response.data[i]
        msg += `\n[${item.status == 'active' ? '正在下载' : item.status == 'complete' ? '下载完成' : '下载失败'}]${item.downloading}   ${item.speed}   ${item.finish}/${item.total}   ${item.gid}`
      }
      e.reply(msg, true)
    }
    return true
  }

  async stopDownload (e) {
    const server = await redis.get('ap_server')
    const key = await redis.get('ap_key')
    if (!server || !key) {
      e.reply('查询失败，未设置AP助手监听地址或密钥', true)
    }
    let gid = e.msg.match(/(?<=#ap停止下载).*?(?=$)/g)
    gid = gid.toString()
    if (gid) {
      const response = await axios
        .get(
          `${server}/download_stop/${gid}`,
          {
            headers: {
              Authorization: key
            }
          },
          {
            timeout: 10000
          }
        )
        .catch((err) => {
          if (err.response == undefined) {
            e.reply('停止失败，连接超时', true)
          } else if (err.response.status == 404) {
            e.reply('停止失败，AP助手监听地址失效', true)
          } else if (err.response.status == 401) {
            e.reply(
              '停止失败，密钥错误，请在服务端打开server_config.ini查看或更改密钥',
              true
            )
          } else {
            e.reply('停止失败，未知错误', true)
          }
        })
      if (response) {
        if (response.data.status == 'ok') {
          e.reply('停止成功', true)
        } else {
          e.reply('停止失败，请检查gid是否正确', true)
        }
      }
    } else {
      e.reply('停止失败，格式错误，正确格式为：#ap停止下载<gid>', true)
    }
    return true
  }
}
