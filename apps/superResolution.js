import { parseImg } from '../utils/utils.js';
import axios from 'axios';
import moment from 'moment';
import pic_tools from '../utils/pic_tools.js';
import Config from '../components/ai_painting/config.js';
let apcfg = await Config.getcfg()
const api = apcfg.Real_CUGAN

export class SR extends plugin {
    constructor() {
        super({
            name: "AP-大清晰术",
            dsc: "图片超分",
            event: "message",
            priority: 1009,
            rule: [
                {
                    reg: "^#?大清晰术([234二三四双]重吟?唱?)?(强力术式|中等术式|弱术式|不变式|原式)?$",
                    fnc: "Real_CUGAN",
                },
                {// 倍数1-8，最多两位小数，强度0-1，最多三位小数
                    reg: "^#?清晰术([1-8](\\.[0-9]{1,2})?)倍(强度([0-1](\\.[0-9]{1,3})?))?$",
                    fnc: "SDSR",
                },
            ],
        });
    }

    /**大清晰术，使用部署在 huggingface 的 Real_CUGAN
     * @param {*} e
     * @return {*}
     */
    async Real_CUGAN(e) {
        if (!api)
            return await e.reply('请先配置大清晰术所需接口')

        e = await parseImg(e)

        if (!e.img) {
            return await e.reply("请对图片回复，或在此命令后带上图片", false, { at: true });
        }

        let startTime = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");

        let res = await pic_tools.getPicInfo(e.img[0])
        if (!res.ok) {
            return await e.reply('获取源图片失败，请重试', true)
        }

        if (res.height * res.width > 1310 * 1410) {
            e.reply("好、好大(//// ^ ////)……等我一下下哦！~");
        }


        //   scale
        let scale = 2;
        if (e.msg.match(/(双|二|2)重吟?唱?/)) scale = 2;
        else if (e.msg.match(/(三|3)重吟?唱?/) && res.height * res.width < 400000) scale = 3;
        else if (e.msg.match(/(四|4)重吟?唱?/) && res.height * res.width < 400000) scale = 4;

        // con
        let con = "conservative";
        if (e.msg.match(/强力?(术式)?/)) con = "denoise3x";
        else if (e.msg.match(/中等?(术式)?/)) {
            con = "no-denoise";
            if (scale == 2) con = "denoise2x";
        } else if (e.msg.match(/弱(术式)?/)) {
            con = "no-denoise";
            if (scale == 2) con = "denoise1x";
        } else if (e.msg.match(/不变式?/)) con = "no-denoise";
        else if (e.msg.match(/原式?/)) con = "conservative";

        // modelname
        let modelname = `up${scale}x-latest-${con}.pth`;

        e.reply([`源图${res.width}x${res.height}，使用${scale}重唱${con}分支，大清晰术！`], false, {
            recallMsg: 30,
            at: true,
        });

        // logger.info(`【大清晰术】：源图${res.width}x${res.height}，采用${scale}倍放大${con}模式处理`);


        // 请求
        let result;
        try {
            result = await axios.post(
                api,
                JSON.stringify({ data: ["data:image/jpeg;base64," + res.base64, modelname, 2] }),
                {
                    timeout: 3 * 60 * 1000,
                    headers: { "Content-Type": "application/json" },
                }
            );
        } catch (err) {
            //  logger.warn(err.response);
            logger.warn(err);
            //  等待超时
            if (err.code == "ECONNABORTED") {
                e.reply(["ECONNABORTED：大清晰术施放超时(っ °Д °;)っ"], true);
            } else if (err.code == "ECONNRESET") {
                e.reply(
                    "ECONNRESET：大清晰术施放失败，服务器遭不住啦！(っ °Д °;)っ",
                    true
                );
            } else if (err.code == "ECONNABORTED") {
                e.reply("ECONNABORTED(code 504)：大清晰术施放失败(っ °Д °;)っ", true);
            } else if (err.code == "ERR_BAD_RESPONSE") {
                e.reply(
                    "ERR_BAD_RESPONSE(code 502)：大清晰术施放失败，尝试小一点的分辨率，或者低一层的吟唱重数吧(っ °Д °;)っ",
                    true
                );
            } else {
                e.reply(["大清晰术施放失败(っ °Д °;)っ "], true);
            }

            return true;
        }
        if (result.status == 206) {
            e.reply("Partial Content(code206)大清晰术施放失败(っ °Д °;)っ", true);
            return true;
        }

        let endTime = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
        let seconds = moment(endTime).diff(moment(startTime), "seconds");
        // logger.warn(result);

        try {
            e.reply(
                [
                    segment.image(`base64://${result.data.data[0].replace(/data:image\/png;|base64,/g, "")}`),
                    `用时${seconds}秒，${scale}重唱${con}分支大清晰术!`,
                ],
                true
            );
        } catch (err) {
            e.reply([`大清晰术报错:\n${err.message}\n请联系开发者反馈~`,], true);
        }
        return true;
    }


    /**清晰术，使用stable diffusion的接口
     * @param {*} e
     * @return {*}
     */
    async SDSR(e) {
        let setting = await Config.getSetting()
        e = await parseImg(e)
        if (!e.img) return await e.reply("请对图片回复，或在此命令后带上图片", false, { at: true });
        let res = await pic_tools.getPicInfo(e.img[0])
        if (!res.ok) {
            return await e.reply('获取源图片失败，请重试', true)
        }
        if (res.height * res.width > 1310 * 1410) {
            e.reply("好、好大(//// ^ ////)……等我一下下哦！~");
        }
        let scale = e.msg.match(/^#?清晰术([1-8](\.[0-9]{1,2})?)倍(强度([0-1](\.[0-9]{1,3})?))?$/);
        if (!scale) scale = 2;
        else scale = parseFloat(scale[1]);
        let strength = e.msg.match(/强度([0-1](\.[0-9]{1,3})?)/);
        if (!strength) strength = 0.6;
        else strength = parseFloat(strength[1]);
        await e.reply([`源图${res.width}x${res.height}，使用${setting.realesrgan.model1}算法与${setting.realesrgan.model2}算法，${scale}倍放大，强度${strength}，大清晰术！`], false, { recallMsg: 30, at: true });
        let config = await Config.getcfg()
        let apiobj = config.APIList[config.usingAPI - 1]
        let url = apiobj.url + '/sdapi/v1/extra-single-image';
        const headers = {
            "Content-Type": "application/json"
        };
        if (apiobj.account_password) {
            headers.Authorization = `Basic ${Buffer.from(apiobj.account_id + ':' + apiobj.account_password, 'utf8').toString('base64')} `
        }
        try {
            const response = await axios({
                method: 'post',
                url: url,
                headers: headers,
                data: JSON.stringify({
                    "resize_mode": 0,
                    "show_extras_results": true,
                    "gfpgan_visibility": 0,
                    "codeformer_visibility": 0,
                    "codeformer_weight": 0,
                    "upscaling_resize": scale,
                    "upscaling_crop": true,
                    "upscaler_1": setting.realesrgan.model1,
                    "upscaler_2": setting.realesrgan.model2,
                    "extras_upscaler_2_visibility": strength,
                    "upscale_first": false,
                    "image": "data:image/jpeg;base64," + res.base64
                })
            });
            await e.reply(segment.image(`base64://${response.data.image.replace(/data:image\/png;|base64,/g, "")}`), true)
        } catch (error) {
            e.reply('大清晰术失败了呢(っ °Д °;)っ', true)
        }
        return true
    }
}