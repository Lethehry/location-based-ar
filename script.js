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

// Load the image model and setup the webcam
async function init() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    // load the model and metadata
    // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
    // or files from your local hard drive
    // Note: the pose library adds "tmImage" object to your window (window.tmImage)
    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // Convenience function to setup a webcam
    const flip = false; // whether to flip the webcam
    const width = window.innerWidth;
    const height = window.innerHeight;
    webcam = new tmImage.Webcam(width, height, flip); // width, height, flip
    await webcam.setup({facingMode: "environment"}); // request access to the webcam
    await webcam.play();
    window.requestAnimationFrame(loop);

    // append elements to the DOM
    document.getElementById("webcam-container").appendChild(webcam.canvas);
    labelContainer = document.getElementById("label-container");
    for (let i = 0; i < maxPredictions; i++) { // and class labels
        labelContainer.appendChild(document.createElement("div"));
    }
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
}
;