const videoURLs = [
    "https://www.bilibili.com/video/BV1UT42167xb?t=1.0", // classId 0
    "https://www.bilibili.com/video/BV1Nb4y1Z7tZ?t=0.1"  // classId 1
    // Add more as needed
];
// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/image

// the link to your model provided by Teachable Machine export panel
const URL = "./model/";

let model, webcam, labelContainer, maxPredictions;
let webcamStream, video, overlayCanvas, overlayCtx;

async function init() {
    // Setup webcam video
    video = document.createElement('video');
    video.setAttribute('autoplay', '');
    video.setAttribute('playsinline', '');
    video.style.width = "100vw";
    video.style.height = "100vh";
    document.getElementById("webcam-container").appendChild(video);

    // Overlay canvas
    overlayCanvas = document.getElementById('overlay-canvas');
    overlayCanvas.width = window.innerWidth;
    overlayCanvas.height = window.innerHeight;
    overlayCtx = overlayCanvas.getContext('2d');

    // Start webcam
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    video.srcObject = stream;
    webcamStream = stream;

    // Load Coco SSD model
    model = await cocoSsd.load();
    document.getElementById('info-container').innerText = "Object detection model loaded. Ready!";
}

async function loop() {
    webcam.update(); // update the webcam frame
    window.requestAnimationFrame(loop);
}

// run the webcam image through the image model
async function predict() {
    const prediction = await model.predict(webcam.canvas);
    let maxProb = 0;
    let maxIndex = 0;
    for (let i = 0; i < maxPredictions; i++) {
        const prob = prediction[i].probability;
        if (prob > maxProb) {
            maxProb = prob;
            maxIndex = i;
        }
        const classPrediction =
            prediction[i].className + ": " + prob.toFixed(2);
        labelContainer.childNodes[i].innerHTML = classPrediction;
    }

    // Show video if prediction is confident enough
    const overlayVideo = document.getElementById('overlay-video');
    if (maxProb > 0.5 && videoURLs[maxIndex]) { // threshold can be adjusted
        overlayVideo.src = videoURLs[maxIndex];
        overlayVideo.style.display = "block";
        overlayVideo.play();
    } else {
        overlayVideo.pause();
        overlayVideo.style.display = "none";
    }
}

async function detectFrame() {
    if (!model) return;
    const predictions = await model.detect(video);

    // Clear overlay
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    // Draw bounding boxes and AR overlays
    predictions.forEach(pred => {
        if (pred.score > 0.6) { // confidence threshold
            const [x, y, w, h] = pred.bbox;
            // Draw bounding box
            overlayCtx.strokeStyle = "#e53935";
            overlayCtx.lineWidth = 4;
            overlayCtx.strokeRect(x, y, w, h);

            // Draw AR overlay (simple circle in center of detected object)
            overlayCtx.beginPath();
            overlayCtx.arc(x + w / 2, y + h / 2, Math.min(w, h) / 4, 0, 2 * Math.PI);
            overlayCtx.fillStyle = "rgba(229,57,53,0.5)";
            overlayCtx.fill();

            // Label
            overlayCtx.font = "20px Arial";
            overlayCtx.fillStyle = "#fff";
            overlayCtx.fillText(pred.class, x, y > 20 ? y - 5 : y + 20);
        }
    });

    // Show debug info
    document.getElementById('label-container').innerText =
        predictions.map(p => `${p.class}: ${(p.score * 100).toFixed(1)}%`).join('\n');
}

async function onRecognizeClick() {
    const infoDiv = document.getElementById('info-container');
    infoDiv.innerText = 'Recognizing...';
    await predict();
    infoDiv.innerText += '\nRecognition finished at ' + new Date().toLocaleTimeString();
}

window.onload = async () => {
    const debugDiv = document.getElementById('info-container');
    debugDiv.innerText += 'Loading model...\n';

    try {
        await init();
        debugDiv.innerText += 'Model loaded successfully.\n';
    } catch (error) {
        debugDiv.innerText += 'Error loading model: ' + error.message + '\n';
    }

    // Run detection loop
    function loop() {
        detectFrame();
        requestAnimationFrame(loop);
    }
    loop();
}