/*
 * @Author: 渔火Arcadia  https://github.com/yhArcadia
 * @Date: 2022-12-19 22:47:31
 * @LastEditors: 渔火Arcadia
 * @LastEditTime: 2022-12-22 00:55:50
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\components\ap\policy.js
 * @Description: 修改ap策略
 *
 * Copyright (c) 2022 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved.
 */
import Config from "./config.js";

class Policy {
  async banUser(qq) {
    qq = Number(qq);
    let policy = await Config.getPolicy();
    if (policy.prohibitedUserList.includes(qq)) return false;
    policy.prohibitedUserList.push(qq);
    Config.setPolicy(policy);
    return true;
  }
}

export default new Policy();
