let stream;
let recorder;
let recordedChunks = [];
const videoElement = document.getElementById('videoElement');
const audioElement = document.getElementById('audioElement');
const startRecordingButton = document.getElementById('startRecording');
const stopRecordingButton = document.getElementById('stopRecording');

// Check for browser compatibility
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        .then(function (mediaStream) {
            stream = mediaStream;
            videoElement.srcObject = mediaStream;
            videoElement.play();
        })
        .catch(function (error) {
            console.log("Error accessing media devices: ", error);
        });
}

// Speech Recognition
const recognition = new webkitSpeechRecognition();
recognition.continuous = true;
recognition.interimResults = false;
recognition.lang = 'en-US';

recognition.onresult = function(event) {
    const transcript = event.results[event.results.length - 1][0].transcript;
    
    if (transcript.toLowerCase() === 'start recording') {
        startRecording();
    } else if (transcript.toLowerCase() === 'stop recording') {
        stopRecording();
    }
};

// Start recording
function startRecording() {
    recordedChunks = [];

    try {
        recorder = new MediaRecorder(stream);
    } catch (error) {
        console.log("Error creating MediaRecorder: ", error);
        return;
    }

    recorder.ondataavailable = function (e) {
        recordedChunks.push(e.data);
    };

    recorder.start();
    startRecordingButton.disabled = true;
    stopRecordingButton.disabled = false;
}

// Stop recording
function stopRecording() {
    if (!recorder || recorder.state === 'inactive') {
        console.log("No active recording.");
        return;
    }

    recorder.stop();
    startRecordingButton.disabled = false;
    stopRecordingButton.disabled = true;
}

// Save recording on server
recorder.addEventListener('dataavailable', function (e) {
    recordedChunks.push(e.data);
});

recorder.addEventListener('stop', function () {
    const blob = new Blob(recordedChunks);
    const blobUrl = URL.createObjectURL(blob);

    if (blob.type.indexOf('audio') === 0) {
        audioElement.src = blobUrl;
        audioElement.controls = true;
    } else if (blob.type.indexOf('video') === 0) {
        videoElement.src = blobUrl;
        videoElement.controls = true;
    }

    const formData = new FormData();
    formData.append('file', blob, 'recording.webm'); // Change the filename and extension as needed

    fetch('server-url', {
        method: 'POST',
        body: formData
    })
    .then(function (response) {
        console.log('Recording saved successfully.');
    })
    .catch(function (error) {
        console.log('Error saving recording: ', error);
    });
});

// Start/Stop recording based on voice commands
recognition.start();
