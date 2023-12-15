// Simplified element selection
const imgs = document.querySelectorAll('img');
const paragraphs = document.querySelectorAll('p');
let intervalMeter, intervalTimer, intervalRise;
let volume = 0.0;

// Audio context setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let microphoneStream = null;
const analyserNode = audioCtx.createAnalyser();
const frequencyDisplayElement = document.querySelector('#frequency');

// Data structure for character information
const data = {
    minti: { id: 0, mill: 0, sec: 0, min: 0, minHeight: 63, maxHeight: 37, last: 0, vektor: 0.011 },
    pipetta: { id: 1, mill: 0, sec: 0, min: 0, minHeight: 71, maxHeight: 40, last: 0, vektor: 0.013 },
};

// Function to create an audio meter
function createAudioMeter(audioContext, clipLevel = 0.98, averaging = 0.95, clipLag = 750) {
    const processor = audioContext.createScriptProcessor(512);
    processor.onaudioprocess = volumeAudioProcess;
    processor.clipping = false;
    processor.lastClip = 0;
    processor.volume = 0;
    processor.clipLevel = clipLevel;
    processor.averaging = averaging;
    processor.clipLag = clipLag;

    processor.connect(audioContext.destination);

    processor.checkClipping = function () {
        if (!this.clipping)
            return false;
        if ((this.lastClip + this.clipLag) < window.performance.now())
            this.clipping = false;
        return this.clipping;
    };

    processor.shutdown = function () {
        this.disconnect();
        this.onaudioprocess = null;
    };

    return processor;
}

// Function to process volume
function volumeAudioProcess(event) {
    const buf = event.inputBuffer.getChannelData(0);
    const bufLength = buf.length;
    let sum = 0;
    let x;

    for (let i = 0; i < bufLength; i++) {
        x = buf[i];
        if (Math.abs(x) >= this.clipLevel) {
            this.clipping = true;
            this.lastClip = window.performance.now();
        }
        sum += x * x;
    }

    const rms = Math.sqrt(sum / bufLength);
    this.volume = Math.max(rms, this.volume * this.averaging);
}

// Function to start pitch detection
function startPitchDetection() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            microphoneStream = audioCtx.createMediaStreamSource(stream);
            microphoneStream.connect(analyserNode);

            const meter = createAudioMeter(audioCtx);
            microphoneStream.connect(meter);

            intervalMeter = setInterval(() => {
                volume = meter.volume;
            }, 1);
        })
        .catch(err => console.log(err));
}

// Timer functions
function startTimer(character) {
    clearInterval(intervalTimer);
    const startTime = performance.now();
    intervalTimer = setInterval(() => {
        updateTimer(character, startTime);
    }, 10);
}

function updateTimer(character, startTime) {
    const elapsedTime = performance.now() - startTime;
    const totalSeconds = Math.floor(elapsedTime / 1000);
    data[character].min = Math.floor(totalSeconds / 60);
    data[character].sec = totalSeconds % 60;
    data[character].mill = Math.floor((elapsedTime % 1000) / 10);

    paragraphs[data[character].id].innerText = formatTime(data[character]);
}

function formatTime(characterData) {
    const formatNumber = n => n < 10 ? `0${n}` : n;
    return `${formatNumber(characterData.min)}:${formatNumber(characterData.sec)}:${formatNumber(characterData.mill)}`;
}

// Rise function with speed customization
function rise(character, speedMultiplier = 0.5) {
    if (imgs.length > 0) {
        clearIntervalAll();
        startTimer(character);
        startPitchDetection();
        data[character].last = data[character].minHeight;

        intervalRise = setInterval(() => {
            imgs[data[character].id].style.backgroundPosition = `top ${data[character].last}vh right`;
            if (volume >= 0.003) {
                data[character].last -= data[character].vektor * 0.0001;
                if (data[character].last <= data[character].maxHeight) {
                    clearIntervalAll();
                }
            } else if (data[character].minHeight >= data[character].last) {
                data[character].last += 0.0025;
            }
        }, 1 * speedMultiplier);
    }
}

// Function to clear all intervals
function clearIntervalAll() {
    clearInterval(intervalMeter);
    clearInterval(intervalTimer);
    clearInterval(intervalRise);
}

// Bubble creation functions
function createBubble(position, size, speed, rlspeed, high, difference) {
    const b = document.createElement("div");
    b.className = "bubble";
    b.style.left = position;
    b.style.width = `${size}vw`;
    b.style.height = `${size}vw`;
    b.animate({ opacity: ["0.7", "0"], bottom: [`${-size}vw`, high] }, { duration: speed });
    b.animate({ transform: [`translateX(-${difference})`, `translateX(${difference})`] }, { duration: rlspeed, iterations: Infinity, direction: "alternate", easing: "cubic-bezier(0.5, 0, 0.5, 1)" });

    document.getElementById("bubbles").appendChild(b);
    setTimeout(() => b.remove(), speed - 100);
}

function newBubble() {
    setTimeout(() => {
        createBubble(`${rndNumber(2, 98, 2)}vw`, rndNumber(0.01, 4, 2), rndNumber(5000, 10000, 0), rndNumber(2000, 5000, 0), `${rndNumber(30, 80, 0)}vh`, `${rndNumber(0.01, 2, 2)}vw`);
        newBubble();
    }, rndNumber(50, 750, 0));
}

function rndNumber(min, max, decimal) {
    decimal = decimal >= 1 ? Math.pow(10, decimal) : 1;
    min *= decimal;
    max *= decimal;
    return Math.floor(Math.random() * (max - min) + min) / decimal;
}

window.onload = function () {
    newBubble();
};