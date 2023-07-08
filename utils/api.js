import axios from "axios";
import Log from "./Log.js";
import Config from "../components/ai_painting/config.js";

export async function upscalers() {
    return await fetchData("/sdapi/v1/upscalers", "放大器列表");
}

export async function latent_upscalers() {
    return await fetchData("/sdapi/v1/latent-upscale-modes", "潜变量放大器列表");
}

export async function sd_models() {
    return await fetchData("/sdapi/v1/sd-models", "模型列表");
}

export async function sd_vae() {
    return await fetchData("/sdapi/v1/sd-vae", "变分自编码器列表");
}

export async function hypernetworks() {
    return await fetchData("/sdapi/v1/hypernetworks", "超网络列表");
}

export async function face_restorers() {
    return await fetchData("/sdapi/v1/face-restorers", "人脸修复器列表");
}

export async function realesrgan_models() {
    return await fetchData("/sdapi/v1/realesrgan-models", "盲图像超分模型列表");
}

export async function embeddings() {
    return await fetchData("/sdapi/v1/embeddings", "嵌入模型列表");
}

export async function loras() {
    return await fetchData("/sdapi/v1/loras", "LoRa列表");
}


async function fetchData(apiEndpoint, errorMessage) {
    try {
        const config = await Config.getcfg();
        const { APIList, usingAPI } = config;
        if (APIList.length === 0) return false;
        const { url, account_id, account_password } = APIList[usingAPI - 1];
        const headers = {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(account_id && account_password && {
                Authorization: `Basic ${Buffer.from(
                    `${account_id}:${account_password}`
                ).toString("base64")}`,
            }),
        };
        const res = await axios.get(`${url}${apiEndpoint}`, { headers });
        if (res.status === 200) {
            const data = res.data.filter((element) => element.name || element.model_name);
            return data;
        } else {
            Log.e(`获取${errorMessage}失败`);
            return false;
        }
    } catch (error) {
        Log.e(`获取${errorMessage}失败: ${error.message}`);
        return false;
    }
}