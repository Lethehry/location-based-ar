window.onload = () => {
    // UI for classification result
    const resultDiv = document.createElement('div');
    resultDiv.id = 'result-ui';
    resultDiv.style.position = 'fixed';
    resultDiv.style.top = '10%';
    resultDiv.style.left = '50%';
    resultDiv.style.transform = 'translateX(-50%)';
    resultDiv.style.background = 'rgba(0,0,0,0.7)';
    resultDiv.style.color = '#fff';
    resultDiv.style.padding = '8px 16px';
    resultDiv.style.borderRadius = '8px';
    resultDiv.style.fontSize = '1.1em';
    resultDiv.style.zIndex = '10000';
    resultDiv.style.pointerEvents = 'none';
    resultDiv.innerText = 'Waiting for model and camera...';
    document.body.appendChild(resultDiv);

    // UI for debug messages
    const debugDiv = document.createElement('div');
    debugDiv.id = 'debug-ui';
    debugDiv.style.position = 'fixed';
    debugDiv.style.bottom = '10%';
    debugDiv.style.left = '50%';
    debugDiv.style.transform = 'translateX(-50%)';
    debugDiv.style.background = 'rgba(50,50,50,0.8)';
    debugDiv.style.color = '#ffeb3b';
    debugDiv.style.padding = '8px 16px';
    debugDiv.style.borderRadius = '8px';
    debugDiv.style.fontSize = '1em';
    debugDiv.style.zIndex = '10001';
    debugDiv.style.pointerEvents = 'none';
    debugDiv.innerText = '';
    document.body.appendChild(debugDiv);

    // Start camera feed
    const video = document.getElementById('camera-feed');
    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
        video.srcObject = stream;
        debugDiv.innerText += 'Camera started.\n';
    }).catch(err => {
        debugDiv.innerText += 'Camera error: ' + err.message + '\n';
    });

    // Load Teachable Machine model
    const modelURL = "./model.json";
    let model;
    tf.loadGraphModel(modelURL)
        .then(m => {
            model = m;
            debugDiv.innerText += 'Model loaded.\n';
        })
        .catch(err => {
            debugDiv.innerText += 'Model load error: ' + err.message + '\n';
        });

    // Video URLs for each class
    const videoURLs = [
        "https://www.bilibili.com/video/BV1UT42167xb?t=1.0", // classId 0
        "https://www.bilibili.com/video/BV1Nb4y1Z7tZ?t=0.1"  // classId 1
        // Add more as needed
    ];

    // Overlay video and plane
    const overlayVideo = document.getElementById('overlay-video');
    const videoPlane = document.getElementById('video-plane');

    // Main detection loop
    setInterval(async () => {
        try {
            if (!model) {
                resultDiv.innerText = 'Model not loaded yet.';
                debugDiv.innerText += 'Model not loaded yet.\n';
                return;
            }
            if (video.readyState !== 4) {
                resultDiv.innerText = 'Camera not ready.';
                debugDiv.innerText += 'Camera not ready.\n';
                return;
            }

            // Get camera frame
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Run image classification
            const prediction = await model.predict(tf.browser.fromPixels(canvas));
            const classId = prediction.argMax(-1).dataSync()[0];

            // Show corresponding video
            if (classId !== null && videoURLs[classId]) {
                overlayVideo.src = videoURLs[classId];
                videoPlane.setAttribute('visible', 'true');
                overlayVideo.play();
                resultDiv.innerText = `识别结果: 类别 ${classId}`;
                debugDiv.innerText += `ClassId: ${classId}, Video: ${videoURLs[classId]}\n`;
            } else {
                videoPlane.setAttribute('visible', 'false');
                overlayVideo.pause();
                resultDiv.innerText = '未识别到有效类别';
                debugDiv.innerText += 'No valid class detected.\n';
            }
        } catch (err) {
            resultDiv.innerText = '识别错误';
            debugDiv.innerText += 'Detection error: ' + err.message + '\n';
        }
    }, 2000);
};