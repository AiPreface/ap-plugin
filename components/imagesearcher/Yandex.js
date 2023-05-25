import fetch from "node-fetch";

export const BASE_URL = "https://yandex.com/";

export async function Yandex(req) {
  const { url, cookie } = req;
  const response = await fetch(
    `${BASE_URL}images/search?cbir_page=similar&rpt=imageview&url=${url}`,
    { headers: { cookie } }
  ).then((res) => res.text());

  if (
    response.search(
      "Please confirm that you and not a robot are sending requests"
    ) !== -1
  ) {
    throw new Error(
      `被拦截了,请求地址:${BASE_URL}images/search?cbir_page=similar&rpt=imageview&url=${url}`
    );
  }

  return parse(response);
}

import * as cheerio from "cheerio";
import _ from "lodash";

export function parse(body) {
  const $ = cheerio.load(body, { decodeEntities: true });
  return _.map($(".serp-list .serp-item"), (item) => {
    return JSON.parse(item.attribs["data-bem"])["serp-item"];
  }).filter((v) => v !== undefined);
}
