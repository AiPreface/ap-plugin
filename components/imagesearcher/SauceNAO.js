import fetch from "node-fetch";
import { FormData } from "formdata-node";
import { fileFromPath } from "formdata-node/file-from-path";
export const BASE_URL = "https://saucenao.com";

export async function SauceNAO(req) {
  const { hide, imagePath, url } = req;
  let form = new FormData();
  if (imagePath) {
    form.append("file", await fileFromPath(imagePath));
  } else if (url) {
    form.append("url", url);
  } else {
    throw Error("please input file or url");
  }
  if (hide) form.append("hide", "3");
  const response = await fetch(`${BASE_URL}/search.php`, {
    method: "POST",
    body: form,
  }).then((res) => res.text());
  return parse(response);
}

import * as cheerio from "cheerio";
import _ from "lodash";
export function parse(body) {
  const $ = cheerio.load(body, { decodeEntities: true });
  return _.map($(".result"), (result) => {
    const image = $(".resultimage img", result),
      title = $(".resulttitle", result),
      similarity = $(".resultsimilarityinfo", result),
      misc = $(".resultmiscinfo > a", result),
      content = $(".resultcontentcolumn > *", result);
    if (title.length <= 0) return;
    const hiddenImage = image.attr("data-src2"),
      imageUrl = hiddenImage ? hiddenImage : image.attr("src");
    return {
      image: new URL(imageUrl, BASE_URL).toString(),
      hidden: !!hiddenImage,
      title: title.text(),
      similarity: parseFloat(similarity.text()),
      misc: _.map(misc, (m) => m.attribs.href),
      content: _.map(content, (element) => ({
        text: $(element).text(),
        link: element.attribs.href,
      })).filter(({ text }) => text.length > 0),
    };
  })
    .filter((v) => v !== undefined)
    .sort((a, b) => a.similarity - b.similarity)
    .reverse();
}
