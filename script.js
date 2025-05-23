window.onload = () => {
    const button = document.querySelector('button[data-action="change"]');
    button.innerText = '﹖';

    let places = staticLoadPlaces();
    renderPlaces(places);

    // Start camera feed for OCR
    const video = document.getElementById('camera-feed');
    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
        video.srcObject = stream;
    });

    // UI element to show recognized text
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
    recognizedTextDiv.innerText = '识别文字将在这里显示...';
    document.body.appendChild(recognizedTextDiv);

    // Run OCR every 2 seconds
    setInterval(async () => {
        if (video.readyState !== 4) return; // Wait until video is ready

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Use 'chi_sim' for Simplified Chinese, or 'eng' for English
        const { data: { text } } = await Tesseract.recognize(canvas, 'chi_sim');
        recognizedTextDiv.innerText = text.trim() ? text : '未检测到文字';

        if (text.includes('你的目标文本')) {
            // Show video overlay
            const videoPlane = document.getElementById('video-plane');
            videoPlane.setAttribute('visible', 'true');
            document.getElementById('overlay-video').play();
            // Optionally, position the plane based on detection
        }
    }, 2000);
};

function staticLoadPlaces() {
    let latitude = 22.3755709;
    let longitude = 114.1253388;
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function(position) {
            latitude = position.coords.latitude;
            longitude = position.coords.longitude;
        }, function(error) {
            console.error('Error getting location', error);
        });
    } else {
        alert("Geolocation is not supported by your browser.");
    }

    return [
        {
            name: 'Pokèmon',
            location: {
                lat: latitude,
                lng: longitude,
            },
        },
    ];
}

var models = [
    {
        url: './assets/magnemite/scene.gltf',
        scale: '0.5 0.5 0.5',
        info: 'Magnemite, Lv. 5, HP 10/10',
        rotation: '0 180 0',
    },
    {
        url: './assets/articuno/scene.gltf',
        scale: '0.2 0.2 0.2',
        rotation: '0 180 0',
        info: 'Articuno, Lv. 80, HP 100/100',
    },
    {
        url: './assets/dragonite/scene.gltf',
        scale: '0.08 0.08 0.08',
        rotation: '0 180 0',
        info: 'Dragonite, Lv. 99, HP 150/150',
    },
];

var modelIndex = 0;
var setModel = function (model, entity) {
    if (model.scale) {
        entity.setAttribute('scale', model.scale);
    }

    if (model.rotation) {
        entity.setAttribute('rotation', model.rotation);
    }

    if (model.position) {
        entity.setAttribute('position', model.position);
    }

    entity.setAttribute('gltf-model', model.url);

    const div = document.querySelector('.instructions');
    div.innerText = model.info;
};

function renderPlaces(places) {
    let scene = document.querySelector('a-scene');

    places.forEach((place) => {
        let latitude = place.location.lat;
        let longitude = place.location.lng;

        let model = document.createElement('a-entity');
        model.setAttribute('gps-entity-place', `latitude: ${latitude}; longitude: ${longitude};`);

        setModel(models[modelIndex], model);

        model.setAttribute('animation-mixer', '');

        document.querySelector('button[data-action="change"]').addEventListener('click', function () {
            var entity = document.querySelector('[gps-entity-place]');
            modelIndex++;
            var newIndex = modelIndex % models.length;
            setModel(models[newIndex], entity);
        });

        scene.appendChild(model);
    });
}