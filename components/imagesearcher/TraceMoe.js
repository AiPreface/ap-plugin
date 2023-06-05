import fetch from "node-fetch";
import fs from "fs";
import { FormData } from "formdata-node";
import { fileFromPath } from "formdata-node/file-from-path";
import { getRangeCode, downloadFile } from "./download.js";

export const BASE_URL = "https://api.trace.moe";

const _path = process.cwd();

export async function TraceMoe(req) {
  const { cutBorders, imagePath, url } = req;
  const form = new FormData();
  if (imagePath) {
    form.append("image", await fileFromPath(imagePath));
    return await request(form, cutBorders);
  } else if (url) {
    //download image
    const fileName = getRangeCode(10) + ".temp";
    const outPath = _path + "/data/temp";
    const fullPath = `${outPath}/${fileName}`;
    await downloadFile(url, outPath, fileName);
    form.append("image", await fileFromPath(fullPath));
    const data = await request(form, cutBorders);
    fs.unlinkSync(fullPath);
    return data;
  } else if (!imagePath) {
    throw Error("please input file or url");
  }
}

export async function request(form, cutBorders) {
  const response = await fetch(
    `${BASE_URL}/search?anilistInfo=1${cutBorders ? "&&cutBorders=1" : ""}`,
    {
      method: "POST",
      body: form,
    }
  ).then((res) => res.text());
  return parse(response);
}

export function parse(res) {
  const { result } = JSON.parse(res);
  return result
    .map((result) => ({
      preview: result.image,
      similarity: result.similarity * 100,
      name: result.anilist?.title,
      nsfw: result.anilist?.isAdult,
      from: result.from * 1000,
      to: result.to * 1000,
      episode: result.episode,
      file: result.filename,
    }))
    .sort((a, b) => a.similarity - b.similarity)
    .reverse();
}
