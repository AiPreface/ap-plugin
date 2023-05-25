/*
 * @Author: https://github.com/itorr/one-last-image
 * @Date: 2023-01-06 17:01:03
 * @LastEditors: 渔火Arcadia
 * @LastEditTime: 2023-01-07 01:28:13
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\components\louvre\louvre.cjs
 * @Description: 
 * 
 * Copyright (c) 2023 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved. 
 */
/* 
[致谢itorr提供图像处理方法]：https://github.com/itorr/one-last-image
 */
let Canvas
try {
	Canvas = require("canvas");
} catch (err) {
	Log.w(err)
}
// import Canvas from "canvas";
global.Image = Canvas.Image;

const randRange = (a, b) => Math.floor(Math.random() * (b - a) + a);
const _path = process.cwd();

let width = 640;
let height = 480;
let scale = width / height;
let lastConfigString = null;

const canvas = Canvas.createCanvas();
const ctx = canvas.getContext('2d');
const canvasShade = Canvas.createCanvas();
const canvasShadeMin = Canvas.createCanvas();
const canvasMin = Canvas.createCanvas();
const pencilTextureCanvas = Canvas.createCanvas();

async function louvre({
	img,
	config,
}, e) {

	if (!img || !config) return;
	var outputCanvas = Canvas.createCanvas();
	pencilTextureEl = await new Canvas.loadImage(_path + '\/plugins\/ap-plugin\/resources\/louvre\/pencil-texture.jpg');
	watermarkImageEl = await new Canvas.loadImage(_path + '\/plugins\/ap-plugin\/resources\/louvre\/one-last-image-logo2.png');
	const configString = [
		JSON.stringify(config),
		img.src,
	].join('-');
	console.time('louvre');
	lastConfigString = configString;
	const oriWidth = img.naturalWidth;
	const oriHeight = img.naturalHeight;

	// if (oriWidth * oriHeight > 500 * 500) {
	// 	e.reply('正在生成，请稍候', true)
	// }
	let oriScale = oriWidth / oriHeight;
	let _width = parseInt(Math.round(oriWidth / config.zoom));
	let _height = parseInt(Math.round(oriHeight / config.zoom));

	const maxWidth = 1920;
	if (_width > maxWidth) {
		_height = _height * maxWidth / _width
		_width = maxWidth
	}
	let cutLeft = 0;
	let cutTop = 0;

	let calcWidth = oriWidth;
	let calcHeight = oriHeight;

	if (config.cover) {

		if (oriScale > 1) {
			cutLeft = (oriScale - 1) * oriHeight / 2;
			cutLeft = Math.round(cutLeft);
			calcWidth = oriHeight;
			_width = _height;
		} else {
			cutTop = (1 - oriScale) * oriHeight / 2;
			cutTop = Math.round(cutTop);
			calcHeight = oriWidth;
			_height = _width;
		}
	}


	let setLeft = 0;
	let setTop = 0;

	let setWidth = _width;
	let setHeight = _height;


	canvas.width = _width;
	canvas.height = _height;



	ctx.drawImage(
		img,
		cutLeft, cutTop,
		calcWidth, calcHeight,

		setLeft, setTop,
		setWidth, setHeight
	);

	let pixel = ctx.getImageData(0, 0, _width, _height);



	let pixelData = pixel.data;

	for (let i = 0; i < pixelData.length; i += 4) {
		const r = pixelData[i];
		const g = pixelData[i + 1];
		const b = pixelData[i + 2];

		let y = r * .299000 + g * .587000 + b * .114000;
		y = Math.floor(y);

		pixelData[i] = y;
		pixelData[i + 1] = y;
		pixelData[i + 2] = y;
	}
	let shadePixel;

	const {
		shadeLimit = 80,
		shadeLight = 40
	} = config;
	let pencilTexturePixel;
	if (config.shade) {

		pencilTextureCanvas.width = _width;
		pencilTextureCanvas.height = _height;
		const pencilTextureCtx = pencilTextureCanvas.getContext('2d');
		const pencilSetWidthHeight = Math.max(_width, _height);
		pencilTextureCtx.drawImage(
			pencilTextureEl,
			0, 0,
			1200, 1200,
			0, 0,
			pencilSetWidthHeight, pencilSetWidthHeight
		);
		pencilTexturePixel = pencilTextureCtx.getImageData(0, 0, _width, _height);

		shadePixel = ctx.createImageData(_width, _height);

		for (let i = 0; i < pixelData.length; i += 4) {
			let y = pixelData[i];

			y = y > shadeLimit ? 0 : 255;

			shadePixel.data[i] = y;
			shadePixel.data[i + 1] = 128;
			shadePixel.data[i + 2] = 128;
			shadePixel.data[i + 3] = Math.floor(Math.random() * 255)
		}

		const ctxShade = canvasShade.getContext('2d');
		const ctxShadeMin = canvasShadeMin.getContext('2d');

		canvasShade.width = _width;
		canvasShade.height = _height;

		ctxShade.putImageData(shadePixel, 0, 0);

		const shadeZoom = 4;
		canvasShadeMin.width = Math.floor(_width / shadeZoom);
		canvasShadeMin.height = Math.floor(_height / shadeZoom);

		ctxShadeMin.drawImage(
			canvasShade,
			0, 0,
			canvasShadeMin.width, canvasShadeMin.height
		);

		ctxShade.clearRect(0, 0, _width, _height)
		ctxShade.drawImage(
			canvasShadeMin,
			0, 0,
			_width, _height
		);
		shadePixel = ctxShade.getImageData(0, 0, _width, _height);

		for (let i = 0; i < shadePixel.data.length; i += 4) {
			let y = shadePixel.data[i];

			y = Math.round((255 - pencilTexturePixel.data[i]) / 255 * y / 255 * shadeLight);

			shadePixel.data[i] = y;
		}

	}

	const {
		light = 0,
	} = config;
	if (light) {


		for (let i = 0; i < pixelData.length; i += 4) {
			let y = pixelData[i];

			y = y + y * (light / 100);

			pixelData[i] = y;
			pixelData[i + 1] = y;
			pixelData[i + 2] = y;
		}
	}


	if (config.denoise) {
		pixel = convoluteY(
			pixel,
			[
				1 / 9, 1 / 9, 1 / 9,
				1 / 9, 1 / 9, 1 / 9,
				1 / 9, 1 / 9, 1 / 9
			],
			ctx
		);
	}

	let pixel1 = config.convoluteName ? convoluteY(
		pixel,
		config.Convolutes[config.convoluteName],
		ctx
	) : pixel;
	if (config.convolute1Diff) {
		let pixel2 = config.convoluteName2 ? convoluteY(
			pixel,
			config.Convolutes[config.convoluteName2],
			ctx
		) : pixel;
		for (let i = 0; i < pixel2.data.length; i += 4) {
			let r = 128 + pixel2.data[i] - pixel1.data[i];
			pixel2.data[i] = r;
			pixel2.data[i + 1] = r;
			pixel2.data[i + 2] = r;
			pixel2.data[i + 3] = 255;
		}
		pixel = pixel2;
	} else {
		pixel = pixel1;
	}

	pixelData = pixel.data;



	if (config.lightCut || config.darkCut) {
		const scale = 255 / (255 - config.lightCut - config.darkCut);
		for (let i = 0; i < pixelData.length; i += 4) {
			let y = pixelData[i];

			y = (y - config.darkCut) * scale;

			y = Math.max(0, y);

			pixelData[i + 0] = y
			pixelData[i + 1] = y
			pixelData[i + 2] = y
			pixelData[i + 3] = 255
		}
	}

	if (config.kuma) {

		const hStart = 30;
		const hEnd = -184;
		const gradient = ctx.createLinearGradient(0, 0, _width, _height);

		gradient.addColorStop(0, '#fbba30');
		gradient.addColorStop(0.4, '#fc7235');
		gradient.addColorStop(.6, '#fc354e');
		gradient.addColorStop(.7, '#cf36df');
		gradient.addColorStop(.8, '#37b5d9');
		gradient.addColorStop(1, '#3eb6da');

		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, _width, _height);
		let gradientPixel = ctx.getImageData(0, 0, _width, _height);

		for (let i = 0; i < pixelData.length; i += 4) {
			let y = pixelData[i];
			let p = Math.floor(i / 4);

			let _h = Math.floor(p / _width);
			let _w = p % _width;
			pixelData[i + 0] = gradientPixel.data[i + 0];
			pixelData[i + 1] = gradientPixel.data[i + 1];
			pixelData[i + 2] = gradientPixel.data[i + 2];

			y = 255 - y;
			if (config.shade) {
				y = Math.max(
					y,
					shadePixel.data[i]
				);
			}
			pixelData[i + 3] = y
		}

	}
	ctx.putImageData(pixel, 0, 0);

	const ctxMin = canvasMin.getContext('2d');

	canvasMin.width = Math.floor(_width / 1.4);
	canvasMin.height = Math.floor(_height / 1.3);

	ctxMin.clearRect(0, 0, canvasMin.width, canvasMin.height)
	ctxMin.drawImage(
		canvas,
		0, 0,
		canvasMin.width, canvasMin.height
	);

	ctx.clearRect(0, 0, _width, _height)
	ctx.drawImage(
		canvasMin,
		0, 0,
		canvasMin.width, canvasMin.height,
		0, 0, _width, _height
	);
	if (config.watermark) {
		const watermarkImageWidth = watermarkImageEl.naturalWidth;
		const watermarkImageHeight = watermarkImageEl.naturalHeight / 2;
		let setWidth = _width * 0.3;
		let setHeight = setWidth / watermarkImageWidth * watermarkImageHeight;

		if (_width / _height > 1.1) {
			setHeight = _height * 0.15;
			setWidth = setHeight / watermarkImageHeight * watermarkImageWidth;
		}

		let cutTop = 0;

		if (config.hajimei) {
			cutTop = watermarkImageHeight;
		}

		let setLeft = _width - setWidth - setHeight * 0.2;
		let setTop = _height - setHeight - setHeight * 0.16;
		ctx.drawImage(
			watermarkImageEl,
			0, cutTop,
			watermarkImageWidth, watermarkImageHeight,
			setLeft, setTop,
			setWidth, setHeight
		);
	}
	const outputCtx = outputCanvas.getContext('2d');

	outputCanvas.width = parseInt(_width);
	outputCanvas.height = parseInt(_height);
	outputCtx.fillStyle = '#FFF';
	outputCtx.fillRect(0, 0, _width, _height);
	outputCtx.drawImage(
		canvas,
		0, 0, _width, _height
	);

	console.timeEnd('louvre');
	return outputCanvas
};

let loadImage = (url, onOver) => {
	const el = new Image();
	el.src = url;
};
let loadImagePromise = async url => {
	return new Promise(function (resolve, reject) {
		setTimeout(function () {
			const el = new Image();
			el.onload = _ => resolve(el);
			el.onerror = e => reject(e);
			el.src = url;
		}, 2000);
	});
}

let watermarkImageEl;
let pencilTextureEl;
const louvreInit = onOver => {
	loadImage(_path + '\/plugins\/ap-plugin\/utils\/pencil-texture.jpg', el => {
		pencilTextureEl = el;
		loadImage(_path + '\/plugins\/ap-plugin\/utils\/one-last-image-logo2.png', el => {
			watermarkImageEl = el;

		});
	});
};


let convolute = (pixels, weights, ctx) => {
	const side = Math.round(Math.sqrt(weights.length));
	const halfSide = Math.floor(side / 2);

	const src = pixels.data;
	const sw = pixels.width;
	const sh = pixels.height;

	const w = sw;
	const h = sh;
	const output = ctx.createImageData(w, h);
	const dst = output.data;


	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const sy = y;
			const sx = x;
			const dstOff = (y * w + x) * 4;
			let r = 0,
				g = 0,
				b = 0;
			for (let cy = 0; cy < side; cy++) {
				for (let cx = 0; cx < side; cx++) {
					const scy = Math.min(sh - 1, Math.max(0, sy + cy - halfSide));
					const scx = Math.min(sw - 1, Math.max(0, sx + cx - halfSide));
					const srcOff = (scy * sw + scx) * 4;
					const wt = weights[cy * side + cx];
					r += src[srcOff] * wt;
					g += src[srcOff + 1] * wt;
					b += src[srcOff + 2] * wt;
				}
			}
			dst[dstOff] = r;
			dst[dstOff + 1] = g;
			dst[dstOff + 2] = b;
			dst[dstOff + 3] = 255;
		}
	}
	return output;
};


const convoluteY = (pixels, weights, ctx) => {
	const side = Math.round(Math.sqrt(weights.length));
	const halfSide = Math.floor(side / 2);

	const src = pixels.data;

	const w = pixels.width;
	const h = pixels.height;
	const output = ctx.createImageData(w, h);
	const dst = output.data;

	for (let sy = 0; sy < h; sy++) {
		for (let sx = 0; sx < w; sx++) {
			const dstOff = (sy * w + sx) * 4;
			let r = 0,
				g = 0,
				b = 0;

			for (let cy = 0; cy < side; cy++) {
				for (let cx = 0; cx < side; cx++) {

					const scy = Math.min(h - 1, Math.max(0, sy + cy - halfSide));
					const scx = Math.min(w - 1, Math.max(0, sx + cx - halfSide));

					const srcOff = (scy * w + scx) * 4;
					const wt = weights[cy * side + cx];

					r += src[srcOff] * wt;
				}
			}
			dst[dstOff] = r;
			dst[dstOff + 1] = r;
			dst[dstOff + 2] = r;
			dst[dstOff + 3] = 255;
		}
	}
	return output;
};
module.exports = {
	louvre
}