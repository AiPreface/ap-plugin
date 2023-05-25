/*
 * @Author: 渔火Arcadia  https://github.com/yhArcadia
 * @Date: 2022-12-18 23:08:51
 * @LastEditors: 苏沫柒 3146312184@qq.com
 * @LastEditTime: 2023-05-07 15:02:31
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\index.js
 * @Description:
 *
 * Copyright (c) 2022 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved.
 */
import fs from "node:fs";
import { initialize } from "./utils/start.js";
import { checkPackage } from "./utils/dependencies_reminder.js";
if (!global.segment) {
  global.segment = (await import("oicq")).segment;
}

let catlist = ["😸", "😹", "😺", "😻", "😼", "😽", "😾", "😿", "🙀"];
logger.info("---------------");
logger.mark(
  logger.green(
    `[${
      catlist[Math.floor(Math.random() * catlist.length)]
    }]AP-Plugin插件自检中......`
  )
);
let passed = await checkPackage();
if (!passed) {
  throw "Missing necessary dependencies";
}
await initialize();
const files = fs
  .readdirSync("./plugins/ap-plugin/apps")
  .filter((file) => file.endsWith(".js"));
let ret = [];
files.forEach((file) => {
  ret.push(import(`./apps/${file}`));
});

ret = await Promise.allSettled(ret);

let apps = {};
for (let i in files) {
  let name = files[i].replace(".js", "");

  if (ret[i].status != "fulfilled") {
    logger.error(`载入插件错误：${logger.red(name)}`);
    logger.error(ret[i].reason);
    continue;
  }
  apps[name] = ret[i].value[Object.keys(ret[i].value)[0]];
}
export { apps };
logger.info("---------------");

// logger.info('---------------')
// logger.info(`aiPainting载入完成`)
// logger.info('---------------')
