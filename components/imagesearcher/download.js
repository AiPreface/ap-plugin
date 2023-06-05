import fs from "fs";
import fetch from "node-fetch";

export async function downloadFile(url, filePath, fileName) {
  fs.rmdirSync(filePath);
  fs.mkdirSync(filePath);
  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/octet-stream" },
  });
  const dest = fs.createWriteStream(`${filePath}/${fileName}`);
  res.body.pipe(dest);
  return new Promise((resolve, reject) => {
    dest.on("finish", resolve);
    dest.on("error", reject);
  });
}

export const getRangeCode = (len = 6) => {
  var orgStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let returnStr = "";
  for (var i = 0; i < len; i++) {
    returnStr += orgStr.charAt(Math.floor(Math.random() * orgStr.length));
  }
  return returnStr;
};
