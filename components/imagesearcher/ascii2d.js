import fetch from 'node-fetch'
import { FormData } from 'formdata-node'
import { fileFromPath } from 'formdata-node/file-from-path'

import * as cheerio from 'cheerio'
import _ from 'lodash'

export const PROXY_URL = 'https://ascii2d.obfs.dev'
export const BASE_URL = 'https://ascii2d.net'

export async function ascii2d (req) {
  const { type, imagePath, url, proxy } = req
  const form = new FormData()
  if (imagePath) {
    form.append('file', await fileFromPath(imagePath))
  } else if (url) {
    form.append('uri', url)
  } else {
    throw Error('please input file or url')
  }
  const colorResponse = await fetch(
    `${proxy ? PROXY_URL : BASE_URL}/search/${imagePath ? 'file' : 'uri'}`,
    {
      method: 'POST',
      body: form
    }
  )
  if (colorResponse.status === 200) {
    let response
    if (type === 'color') {
      response = await colorResponse.text()
    } else {
      const bovwUrl = colorResponse.url.replace('/color/', '/bovw/')
      response = await fetch(bovwUrl).then((res) => res.text())
    }
    return parse(response)
  } else {
    throw new Error('请求失败，可能被拦截' + colorResponse.status)
  }
}
export function parse (body) {
  const $ = cheerio.load(body, { decodeEntities: true })
  return _.map($('.item-box'), (item) => {
    const detail = $('.detail-box', item)
    const hash = $('.hash', item)
    const info = $('.info-box > .text-muted', item)
    const [image] = $('.image-box > img', item)
    const [source, author] = $('a[rel=noopener]', detail)
    if (!source && !author) return
    return {
      hash: hash.text(),
      info: info.text(),
      image: new URL(
        image.attribs.src ?? image.attribs['data-cfsrc'],
        BASE_URL
      ).toString(),
      source: source
        ? { link: source.attribs.href, text: $(source).text() }
        : undefined,
      author: author
        ? { link: author.attribs.href, text: $(author).text() }
        : undefined
    }
  }).filter((v) => v !== undefined)
}
