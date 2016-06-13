/* Copyright 2013 Chris Wilson

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

/**
 * Mod by Shu Ding
 */

window.AudioContext = window.AudioContext || window.webkitAudioContext;

var audioContext    = new AudioContext();
var audioInput      = null, realAudioInput = null, inputPoint = null;
var analyserContext = null;
var canvasWidth, canvasHeight;

function updateAnalysers() {
  if (!analyserContext) {
    var canvas  = document.getElementById("analyser");
    canvasWidth = canvas.width = ~~(window.innerWidth / 2) * 2;
    canvasHeight = canvas.height = ~~(window.innerHeight / 2) * 2;
    analyserContext = canvas.getContext('2d');

    var canvasHeightHalf = canvasHeight / 2;
  }

  var heightR = [], heightG = [], heightB = [];

  function draw()
  // analyzer draw code here
  {
    var SPACING      = 20;
    var numBars      = Math.round(canvasWidth / SPACING);
    var freqByteData = new Uint8Array(analyserNode.frequencyBinCount);

    analyserNode.getByteFrequencyData(freqByteData);

    analyserContext.clearRect(0, 0, canvasWidth, canvasHeight);
    var multiplier = analyserNode.frequencyBinCount / numBars / 3;

    // Draw rectangle for each frequency bin.
    var pointsR = [{
      x: 0,
      y: canvasHeightHalf
    }];
    var pointsG = [{
      x: 0,
      y: canvasHeightHalf
    }];
    var pointsB = [{
      x: 0,
      y: canvasHeightHalf
    }];

    var idG = 2, idB = 1;
    var rs = 1;

    //console.log(numBars, '!');
    for (var i = 0; i < numBars; ++i) {
      var magnitude = 0;
      var offset    = Math.floor(i * multiplier * 3);
      // gotta sum/average the block, or we miss narrow-bandwidth spikes
      for (var j = 0; j < multiplier; j++) {
        magnitude += freqByteData[offset + j];
      }
      rs = (rs * 5 + Math.random()) / 6;
      magnitude = magnitude / multiplier / 2.7;// * Math.log(i / 10 + 1.3 + rs) / 1.1;
      //magnitude = magnitude * (1 - Math.exp(-1 - i)) * (1 - Math.exp(-1 - i));
      //magnitude *= magnitude;

      heightR[i] = ((heightR[i] || (canvasHeightHalf - magnitude)) * 3 + canvasHeightHalf - magnitude) / 4;

      var id = (numBars >> 1) + (i % 2 ? -(i >> 1) : ~~(i / 2) + 1);

      pointsR[id] = {
        x: id * SPACING + SPACING,
        y: heightR[i]
      };

      magnitude = 0;
      for (j = Math.ceil(multiplier); j < multiplier * 2; j++) {
        magnitude += freqByteData[offset + j];
      }
      magnitude = magnitude / multiplier / 2.3; //* Math.log(i / 10 + 1.3) / 2;

      heightG[i] = ((heightG[i] || (canvasHeightHalf - magnitude)) * 3 + canvasHeightHalf - magnitude) / 4;

      id = (numBars >> 1) + (i % 2 ? -(i >> 1) : ~~(i / 2) + 1);

      pointsG[id] = {
        y: heightG[i],
        x: id * SPACING + SPACING + SPACING / 2
      };

      magnitude = 0;
      for (j = Math.ceil(multiplier * 2); j < multiplier * 3; j++) {
        magnitude += freqByteData[offset + j];
      }
      magnitude = magnitude / multiplier / 2.3;

      heightB[i] = ((heightB[i] || (canvasHeightHalf - magnitude)) * 3 + canvasHeightHalf - magnitude) / 4;

      id = (numBars >> 1) + (i % 2 ? -(i >> 1) : ~~(i / 2) + 1);

      pointsB[id] = {
        y: heightB[i],
        x: id * SPACING + SPACING / 2
      };
    }

    analyserContext.lineCap                  = 'round';
    analyserContext.globalCompositeOperation = 'screen';

    function drawC(color, points) {
      analyserContext.fillStyle = color;
      analyserContext.beginPath();
      analyserContext.moveTo(points[0].x, points[0].y);

      for (i = 1; i < numBars - 1; i++) {
        var xc = (points[i].x + points[i + 1].x) / 2;
        var yc = (points[i].y + points[i + 1].y) / 2;
        analyserContext.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }
      // curve through the last two points
      analyserContext.quadraticCurveTo(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
      analyserContext.closePath();
      analyserContext.fill();

      analyserContext.beginPath();
      analyserContext.moveTo(points[0].x, canvasHeight - points[0].y);

      for (i = 1; i < numBars - 1; i++) {
        xc = (points[i].x + points[i + 1].x) / 2;
        yc = canvasHeight - (points[i].y + points[i + 1].y) / 2;
        analyserContext.quadraticCurveTo(points[i].x, canvasHeight - points[i].y, xc, yc);
      }
      // curve through the last two points
      analyserContext.quadraticCurveTo(points[i].x, canvasHeight - points[i].y, points[i + 1].x, canvasHeight - points[i + 1].y);
      analyserContext.closePath();
      analyserContext.fill();
    }

    drawC('rgb(255, 78, 92)', pointsR);
    drawC('rgb(47, 255, 169)', pointsG);
    drawC('rgb(14, 119, 255)', pointsB);

    window.requestAnimationFrame(draw);
  }

  window.requestAnimationFrame(draw);
}

function gotStream(stream) {
  inputPoint = audioContext.createGain();

  // Create an AudioNode from the stream.
  realAudioInput = audioContext.createMediaStreamSource(stream);
  audioInput     = realAudioInput;
  audioInput.connect(inputPoint);

  //audioInput = convertToMono( input );

  analyserNode         = audioContext.createAnalyser();
  analyserNode.fftSize = 1024;
  inputPoint.connect(analyserNode);

  //audioRecorder = new Recorder(inputPoint);

  zeroGain = audioContext.createGain();

  zeroGain.gain.value = 0.0;
  inputPoint.connect(zeroGain);
  zeroGain.connect(audioContext.destination);
  updateAnalysers();
}

function initAudio() {
  if (!navigator.getUserMedia) {
    navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
  }
  if (!navigator.cancelAnimationFrame) {
    navigator.cancelAnimationFrame = navigator.webkitCancelAnimationFrame || navigator.mozCancelAnimationFrame;
  }
  if (!navigator.requestAnimationFrame) {
    navigator.requestAnimationFrame = navigator.webkitRequestAnimationFrame || navigator.mozRequestAnimationFrame;
  }

  navigator.getUserMedia({
    "audio": {
      "mandatory": {
        "googEchoCancellation": "false",
        "googAutoGainControl":  "false",
        "googNoiseSuppression": "false",
        "googHighpassFilter":   "false"
      },
      "optional":  []
    },
  }, gotStream, function (e) {
    alert('Error getting audio');
    console.log(e);
  });
}

window.addEventListener('load', initAudio);
