const img = [].slice.apply(document.getElementsByTagName('img'), null);
const text = [].slice.apply(document.getElementsByTagName('p'), null);
let im;
let volume = 0.0;

let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let microphoneStream = null;
let analyserNode = audioCtx.createAnalyser();
const frequencyDisplayElement = document.querySelector('#frequency');

let timerInterval;

const data = {
    minti: {
        id: 0,
        mill: 0,
        sec: 0,
        min: 0,
        minHeight: 63,
        maxHeight: 37,
        last: 0,
        vektor: 0.011,
    },
    pipetta: {
        id: 1,
        mill: 0,
        sec: 0,
        min: 0,
        minHeight: 71,
        maxHeight: 40,
        last: 0,
        vektor: 0.013,
    },
};

function createAudioMeter(audioContext, clipLevel, averaging, clipLag) {
    var processor = audioContext.createScriptProcessor(512);
    processor.onaudioprocess = volumeAudioProcess;
    processor.clipping = false;
    processor.lastClip = 0;
    processor.volume = 0;
    processor.clipLevel = clipLevel || 0.98;
    processor.averaging = averaging || 0.95;
    processor.clipLag = clipLag || 750;

    // this will have no effect, since we don't copy the input to the output,
    // but works around a current Chrome bug.
    processor.connect(audioContext.destination);

    processor.checkClipping =
        function () {
            if (!this.clipping)
                return false;
            if ((this.lastClip + this.clipLag) < window.performance.now())
                this.clipping = false;
            return this.clipping;
        };

    processor.shutdown =
        function () {
            this.disconnect();
            this.onaudioprocess = null;
        };

    return processor;
}

function volumeAudioProcess(event) {
    var buf = event.inputBuffer.getChannelData(0);
    var bufLength = buf.length;
    var sum = 0;
    var x;

    // Do a root-mean-square on the samples: sum up the squares...
    for (var i = 0; i < bufLength; i++) {
        x = buf[i];
        if (Math.abs(x) >= this.clipLevel) {
            this.clipping = true;
            this.lastClip = window.performance.now();
        }
        sum += x * x;
    }

    // ... then take the square root of the sum.
    var rms = Math.sqrt(sum / bufLength);

    // Now smooth this out with the averaging factor applied
    // to the previous sample - take the max here because we
    // want "fast attack, slow release."
    this.volume = Math.max(rms, this.volume * this.averaging);
}

function startPitchDetection() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
            microphoneStream = audioCtx.createMediaStreamSource(stream);
            microphoneStream.connect(analyserNode);

            let meter = createAudioMeter(audioCtx);
            microphoneStream.connect(meter);

            im = setInterval(() => {
                volume = meter.volume;
            }, 1);
        })
        .catch((err) => {
            console.log(err);
        });
}

let startTime;

function startTimer(character) {
    clearInterval(timerInterval);
    startTime = performance.now();
    timerInterval = setInterval(() => {
        updateTimer(character);
    }, 10);
}

function updateTimer(character) {
    const elapsedTime = performance.now() - startTime;
    const totalSeconds = Math.floor(elapsedTime / 1000);
    data[character].min = Math.floor(totalSeconds / 60);
    data[character].sec = totalSeconds % 60;
    data[character].mill = Math.floor((elapsedTime % 1000) / 10);

    text[data[character].id].innerText = formatTime(character);
}
function formatTime(character) {
    const formatNumber = (n) => n < 10 ? '0' + n : n;
    return `${formatNumber(data[character].min)}:${formatNumber(data[character].sec)}:${formatNumber(data[character].mill)}`;
}

function rise(character) {
    if (img) {
        clearInterval(timerInterval);
        startTimer(character);

        startPitchDetection();
        data[character].last = data[character].minHeight;
        let i = setInterval(() => {
            img[data[character].id].style.backgroundPosition = "top " + data[character].last + "vh right";
            if (volume >= 0.003) {
                data[character].last = data[character].last - (data[character].vektor * 0.0001);

                if (data[character].last <= data[character].maxHeight) {
                    clearInterval(i);
                    clearInterval(im);
                    clearInterval(timerInterval);
                }
            } else if (data[character].minHeight >= data[character].last) {
                data[character].last = data[character].last + 0.0025;
            }
        }, 1)
    }
}

function createBubble(position, size, speed, rlspeed, high, difference) {
    var b = document.createElement("div")
    b.classList = "bubble";
    b.style.left = position;
    b.style.width = size + "vw";
    b.style.height = size + "vw";
    b.animate({ opacity: ["0.7", "0"], bottom: [(-size + "vw"), high] }, { duration: speed });
    b.animate({ transform: ["translateX(-" + difference + ")", "translateX(" + difference + ")"] }, { duration: rlspeed, iterations: Infinity, direction: "alternate", easing: "cubic-bezier(0.5, 0, 0.5, 1)" });

    document.getElementById("bubbles").appendChild(b);

    setTimeout(function () {
        b.remove();
    }, (speed - 100));
}

function newBubble() {
    setTimeout(function () {
        createBubble((rndNumber(2, 98, 2)) + "vw", rndNumber(0.01, 4, 2), rndNumber(5000, 10000, 0), rndNumber(2000, 5000, 0), (rndNumber(30, 80, 0)) + "vh", (rndNumber(0.01, 2, 2)) + "vw");
        newBubble();
    }, rndNumber(50, 750, 0))
}

function rndNumber(min, max, decimal) {
    if (decimal == 0) {
        decimal++;
    } else if (decimal >= 1) {
        decimal = Math.pow(10, decimal);
    }

    min = min * decimal;
    max = max * decimal;

    return (Math.floor(Math.random() * (max - min) + min) / decimal)
}

window.onload = function () { newBubble() }