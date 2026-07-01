// script.js

let mindarThree = null;
let activeTargets = { frame: false, bird: false, rain: false };
let birdAnimation = { x: 0, y: 0, frameIndex: 0 };

// 预加载我们需要在 Canvas 上绘制的水墨小鸟 PNG (确保背景完全透明干净)
const birdImg = new Image();
birdImg.src = "./assets/bird-transparent.png"; 

document.addEventListener("DOMContentLoaded", async () => {
    const video = document.querySelector("#overlay-video");
    const canvas = document.querySelector("#overlay-canvas");
    const ctx = canvas.getContext("2d");

    // 动态调整 Canvas 尺寸，防止画面拉伸变形
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // 初始化 MindAR 控制器，最大支持同时识别 3 个目标 (0:大边框, 1:小鸟, 2:暴雨背景)
    const mindarImage = new mindid.MindARImage({
        imageTargetSrc: './assets/targets.mind',
        numTargets: 3,
        videoOptions: { videoEl: video }
    });

    // 启动摄像头和 AR 引擎
    await mindarImage.start();
    console.log("MindAR 引擎启动成功！代刷旧版目标检测代码。");

    // 每帧循环：核心算法逻辑 (获取玩具的绝对落点并演算动画)
    const tick = () => {
        // 清空上一帧的 Canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 核心技术：实时循环检测每一个目标当前的定位矩阵
        for (let i = 0; i < 3; i++) {
            const activeResult = mindarImage.getCoordinate(i);
            
            // 如果在手机画面里抓到了这个磁吸玩具 (activeResult 不为 null)
            if (activeResult) {
                // 1. 核心大招：计算出该玩具在当前屏幕上的绝对像素坐标 $(X, Y)$ 和缩放比例
                const [m0, m1, m2, m3, m4, m5, m6, m7, m8, m9, m10, m11, m12, m13, m14, m15] = activeResult;
                
                // 将 3D 矩阵中的平移向量转换为屏幕的 2D 像素坐标
                const screenX = ((m12 + 1) / 2) * canvas.width;
                const screenY = ((1 - m13) / 2) * canvas.height;
                const size = m0 * 200; // 根据距离估算渲染尺寸

                if (i === 1) { // 识别到了“鸟”
                    activeTargets.bird = true;
                    // 2. 动态实例化动画：让数字小鸟从物理磁吸鸟的精准位置 $(screenX, screenY)$ 开始煽动翅膀
                    drawLiveBird(ctx, screenX, screenY, size);
                }
            } else {
                if (i === 1) activeTargets.bird = false;
            }
        }

        // 判定多结局 UI 浮现
        updatePoemUI();

        // 持续死循环调用，保证动画的帧率
        requestAnimationFrame(tick);
    };

    // 启动逐帧渲染
    requestAnimationFrame(tick);
});

// 2. 局部坐标动画渲染函数
function drawLiveBird(ctx, x, y, size) {
    // 模拟一个极其省钱的 2D 帧动画：小鸟每帧在原位产生一个上下晃动的位移
    birdAnimation.frameIndex++;
    const bounce = Math.sin(birdAnimation.frameIndex * 0.1) * 15; 
    
    ctx.save();
    // 完美的图层覆盖：将透明的虚拟水墨小鸟，精准盖在游客摆放的物理磁吸鸟正上方
    ctx.drawImage(birdImg, x - size/2, y - size/2 + bounce, size, size);
    ctx.restore();
}

// 3. 多结局黑盒判定 (Decoupling)
function updatePoemUI() {
    const poemBox = document.querySelector("#poem-box");
    if (activeTargets.bird && !activeTargets.rain) {
        poemBox.innerHTML = "春眠不觉晓，<br>处处闻啼鸟。";
        poemBox.style.opacity = "1";
    } else if (activeTargets.bird && activeTargets.rain) {
        poemBox.innerHTML = "夜来风雨声，<br>花落知多少。";
        poemBox.style.opacity = "1";
    } else {
        poemBox.style.opacity = "0"; // 拿走磁贴，诗句自动淡出
    }
}

// 红色按钮的新功能：重置数据
function onResetClick() {
    console.log("点击了重置。");
    document.querySelector("#poem-box").style.opacity = "0";
}