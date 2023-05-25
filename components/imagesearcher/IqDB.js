import fetch from "node-fetch";
import { FormData } from "formdata-node";
import { fileFromPath } from "formdata-node/file-from-path";

export const BASE_URL = "https://iqdb.org/";

export async function IqDB(req) {
  const { services, discolor, imagePath, url } = req;
  const form = new FormData();
  if (imagePath) {
    form.append("file", await fileFromPath(imagePath));
  } else if (url) {
    form.append("url", url);
  } else {
    throw Error("please input file or url");
  }
  if (services)
    services.forEach((s, index) =>
      form.append(`service.${index}`, s.toString())
    );
  if (discolor) form.append("forcegray", "on");
  const response = await fetch(BASE_URL, { method: "POST", body: form }).then(
    (res) => res.text()
  );
  return parse(response);
}

import * as cheerio from "cheerio";
import _ from "lodash";

export function parse(body) {
  const $ = cheerio.load(body);
  return _.map($("table"), (result) => {
    const content = $(result).text(),
      [link] = $("td.image > a", result),
      [image] = $("td.image img", result);
    if (!link) return;
    const [similarity] = content.match(/(\d+%)\s*similarity/);
    let resolution = content.match(/(\d+×\d+)/);
    !resolution ? (resolution = "未知") : (resolution = resolution[0]);
    const level = content.match(/\[(\w+)\]/)[0];
    return {
      url: new URL(link.attribs.href, BASE_URL).toString(),
      image: new URL(image.attribs.src, BASE_URL).toString(),
      similarity: parseFloat(similarity),
      resolution,
      level: level.toLowerCase(),
    };
  })
    .filter((v) => v !== undefined)
    .sort((a, b) => a.similarity - b.similarity)
    .reverse();
}
