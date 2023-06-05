import plugin from "../../../lib/plugins/plugin.js";
import Draw from "../components/ai_painting/draw.js";
import { parseImg } from "../utils/utils.js";
import Pictools from "../utils/pic_tools.js";

let FiguretypeUser = {};

export class Difference extends plugin {
  constructor() {
    super({
      /** 功能名称 */
      name: "AP-图像差分",
      /** 功能描述 */
      dsc: "图像差分",
      event: "message",
      /** 优先级，数字越小等级越高 */
      priority: 1009,
      rule: [
        {
          /** 命令正则匹配 */
          reg: "^#?图片差分.*$",
          /** 执行方法 */
          fnc: "Difference",
        },
      ],
    });
  }

  async Difference(e) {
    if (FiguretypeUser[e.user_id]) {
      e.reply(
        "你是大风机关嘛？！你急什么！\n（当前有任务在处理中，请不要频繁请求）",
        true
      );
      return true;
    }
    e = await parseImg(e);
    if (!this.e.img) {
      e.reply("图呢？图被你吃了嘛？？？", true);
      return true;
    }
    let imgInfo = await Pictools.getPicInfo(this.e.img[0]);
    if (!imgInfo.ok) {
      e.reply("图片坏啦！都怪你！", true);
      return true;
    }
    let base64 = imgInfo.base64;
    let width = Math.round(imgInfo.width / 64) * 64;
    let height = Math.round(imgInfo.height / 64) * 64;
    if (width > 2048 || height > 2048) {
      e.reply("图片长宽超过2048，无法重绘，请更换图片再试");
      return true;
    }
    e.reply("正在图片差分中，请耐心等待喵~");
    let num = 5;
    if (this.e.msg.match(/(\d+)张/)) {
      num = parseInt(this.e.msg.match(/(\d+)张/)[1]);
    }
    let strength = (0.5 / (num - 1)).toFixed(2);
    let msg = [];
    let time = new Date().getTime();
    for (let i = 0; i < num; i++) {
      let paramdata = {
        param: {
          sampler_index: "DPM++ 2S a Karras",
          strength: 0.6,
          seed: -1,
          scale: 11,
          steps: 20,
          width: width,
          height: height,
          strength: (0.25 + i * strength).toFixed(2),
          tags: "",
          ntags: "",
          pt: [],
          npt: [],
          base64: base64,
        },
        num: 1,
        rawtag: {
          tags: "",
          ntags: "",
        },
        specifyAPI: NaN,
        user: e.user_id,
        code: 0,
        JH: false,
        message: "",
      };
      let resp = await Draw.get_a_pic(paramdata);
      if (resp.code) {
        e.reply("图片差分失败了喵~", true);
        continue;
      }
      msg.push("Denoising Strength: " + (0.25 + i * strength).toFixed(2));
      msg.push(segment.image("base64://" + resp.base64));
      if (i == 0) {
        time = new Date().getTime() - time;
        let min = Math.floor((time * num) / 1000 / 60);
        let sec = Math.floor(((time * num) / 1000) % 60);
        e.reply("本次图片差分大约需要" + min + "分" + sec + "秒", true);
        FiguretypeUser[e.user_id] = true;
        setTimeout(() => {
          delete FiguretypeUser[e.user_id];
        }, time * num);
      }
    }
    e.reply(msg);
    return true;
  }
}
