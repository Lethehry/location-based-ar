window.onload = () => {
    // UI debug block
    let recognizedTextDiv = document.createElement('div');
    recognizedTextDiv.id = 'recognized-text-ui';
    recognizedTextDiv.style.position = 'fixed';
    recognizedTextDiv.style.top = '10%';
    recognizedTextDiv.style.left = '50%';
    recognizedTextDiv.style.transform = 'translateX(-50%)';
    recognizedTextDiv.style.background = 'rgba(0,0,0,0.7)';
    recognizedTextDiv.style.color = '#fff';
    recognizedTextDiv.style.padding = '8px 16px';
    recognizedTextDiv.style.borderRadius = '8px';
    recognizedTextDiv.style.fontSize = '1.1em';
    recognizedTextDiv.style.zIndex = '10000';
    recognizedTextDiv.style.pointerEvents = 'none';
    recognizedTextDiv.innerText = 'Waiting for model and camera...';
    document.body.appendChild(recognizedTextDiv);

    // Start camera feed
    const video = document.getElementById('camera-feed');
    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
        video.srcObject = stream;
    });

    // Load Teachable Machine model
    const modelURL = "model.json";
    let model;
    tf.loadGraphModel(modelURL).then(m => { model = m; });

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
        // Debug: show status
        if (!model) {
            recognizedTextDiv.innerText = 'Model not loaded yet.';
            return;
        }
        if (video.readyState !== 4) {
            recognizedTextDiv.innerText = 'Camera not ready.';
            return;
        }

        // Get camera frame
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        let classId = null;
        let prediction = null;
        let errorMsg = '';

        try {
            prediction = await model.predict(tf.browser.fromPixels(canvas));
            classId = prediction.argMax(-1).dataSync()[0];
        } catch (err) {
            errorMsg = 'Prediction error: ' + err.message;
        }

        // Show corresponding video
        if (classId !== null && videoURLs[classId]) {
            overlayVideo.src = videoURLs[classId];
            videoPlane.setAttribute('visible', 'true');
            overlayVideo.play();
        } else {
            videoPlane.setAttribute('visible', 'false');
            overlayVideo.pause();
        }

        // Show debug info in UI
        recognizedTextDiv.innerText =
            errorMsg
                ? errorMsg
                : `ClassId: ${classId}\nVideo: ${videoURLs[classId] || 'None'}\nModel loaded: ${!!model}\nVideo ready: ${video.readyState === 4}`;
    }, 2000);
};