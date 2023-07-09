function handleResize() {
    const image = document.getElementsByTagName('img')[0];
    const horizontalOffset = 10 * (image.offsetWidth / 760);
    const verticalOffset = 10 * (image.offsetWidth / 760);
    const blurRadius = 6;
    const spreadRadius = 5 * (image.offsetWidth / 1080);
    image.style.boxShadow = `${horizontalOffset}px ${verticalOffset}px ${blurRadius}px ${spreadRadius}px rgba(0, 0, 0, 0.4)`;
}
window.addEventListener('resize', handleResize);
window.addEventListener('load', function () {
    window.dispatchEvent(new Event('resize'));
});

//传入图片
function getImgStyle() {
    //自适应图片长宽比
    const img = document.getElementsByTagName("img")[0];
    const aigcImg = document.getElementById("aigc_img");
    const content = document.getElementById("content");
    const bottomText = document.getElementById('bottom_text');
    if (img.naturalWidth === img.naturalHeight) {
        aigcImg.style.aspectRatio = '1/1';
        aigcImg.style.width = '50%';
        aigcImg.style.margin = '3% 0% 0% 4%';
        content.style.width = '32%';
        content.style.padding = '0 0 0 6%';
        bottomText.style.marginTop = '0.7%';
    }
    if (img.naturalWidth / img.naturalHeight === 3 / 2) {
        aigcImg.style.aspectRatio = "3/2";
        aigcImg.style.width = '66%';
        aigcImg.style.margin = '6% 4% 0% 0%';
        content.style.width = '24%';
        content.style.padding = '0 3%';
        bottomText.style.marginTop = '2%';
    }
}
const myImg = document.getElementsByTagName('img')[0];
// 检查 src 属性是否存在或者非空
if (myImg.src && myImg.src !== '') {
    getImgStyle();
}