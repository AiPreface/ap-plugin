import plugin from '../../../lib/plugins/plugin.js'
import { createRequire } from 'module'
import { Restart } from '../../other/restart.js'
import lodash from 'lodash'
import common from '../../../lib/common/common.js'

const require = createRequire(import.meta.url)
const { exec, execSync } = require('child_process')

/**
 * 处理插件更新
 */
export class branch extends plugin {
  constructor () {
    super({
      name: 'AP-切换版本',
      event: 'message',
      priority: 1009,
      rule: [
        {
          reg: '^#ap切换分支$',
          fnc: 'branch',
          permission: 'master'
        },
        {
          reg: '^#ap当前分支$',
          fnc: 'checkBranch'
        }
      ]
    })
  }

  /**
   * rule - 切换ap版本
   * @returns
   */
  async branch (e) {
    if (!(await this.checkGit())) return e.reply('请先安装git')
    const ret = await this.execSync('git -C ./plugins/ap-plugin/ branch')
    if (ret.error) {
      await this.reply('切换分支失败，请查看控制台报错')
    } else {
      if (ret.stdout.includes('* dev')) {
        await this.execSync('git -C ./plugins/ap-plugin/ checkout main')
        await this.reply('已将AP-Plugin切换到稳定分支')
      } else {
        await this.execSync('git -C ./plugins/ap-plugin/ checkout dev')
        await this.reply(
          '已将AP-Plugin切换到测试分支，测试分支可能存在Bug，用户自行承担风险'
        )
      }
      common.sleep(1000)
      // 重启
      await new Restart(this.e).restart()
    }
  }

  async checkBranch (e) {
    if (!(await this.checkGit())) return e.reply('请先安装git')
    const ret = await this.execSync('git -C ./plugins/ap-plugin/ branch')
    if (ret.error) {
      await this.reply('切换分支失败')
    } else {
      const commitId = await this.getcommitId('ap-plugin')
      const time = await this.getTime('ap-plugin')
      if (ret.stdout.includes('* dev')) {
        await this.reply(
          '当前分支为测试分支[dev]\n最后一次提交时间：' +
            time +
            '\n最后一次提交commitID：' +
            commitId
        )
      } else {
        await this.reply(
          '当前分支为稳定分支[main]\n最后一次提交时间：' +
            time +
            '\n最后一次提交commitID：' +
            commitId
        )
      }
    }
  }

  /**
   * 异步执行git相关命令
   * @param {string} cmd git命令
   * @returns
   */
  async execSync (cmd) {
    return new Promise((resolve, reject) => {
      exec(cmd, { windowsHide: true }, (error, stdout, stderr) => {
        resolve({ error, stdout, stderr })
      })
    })
  }

  /**
   * 检查git是否安装
   * @returns
   */
  async checkGit () {
    const ret = await execSync('git --version', { encoding: 'utf-8' })
    if (!ret || !ret.includes('git version')) {
      await this.reply('请先安装git')
      return false
    }
    return true
  }

  /**
   * 获取上次提交的commitId
   * @param {string} plugin 插件名称
   * @returns
   */
  async getcommitId (plugin = '') {
    const cm = `git -C ./plugins/${plugin}/ rev-parse --short HEAD`

    let commitId = await execSync(cm, { encoding: 'utf-8' })
    commitId = lodash.trim(commitId)

    return commitId
  }

  /**
   * 获取本次更新插件的最后一次提交时间
   * @param {string} plugin 插件名称
   * @returns
   */
  async getTime (plugin = '') {
    const cm = `cd ./plugins/${plugin}/ && git log -1 --oneline --pretty=format:"%cd" --date=format:"%m-%d %H:%M"`

    let time = ''
    try {
      time = await execSync(cm, { encoding: 'utf-8' })
      time = lodash.trim(time)
    } catch (error) {
      logger.error(error.toString())
      time = '获取时间失败'
    }
    return time
  }
}
