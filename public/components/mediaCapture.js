import { API_BASE_URL } from "../config.js";

export function createMediaCapture() {
  let currentStream = null;
  let mediaRecorder = null;
  let recordedChunks = [];
  let recordingStartTime = null;
  const MAX_DURATION = 30000;

  async function uploadFile(file) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Error al subir archivo");
    }

    return `${API_BASE_URL}${data.url}`;
  }

  function stopStream() {
    if (currentStream) {
      currentStream.getTracks().forEach((track) => track.stop());
      currentStream = null;
    }
  }

  async function captureImageFromCamera(videoElement) {
    try {
      currentStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
      });

      videoElement.srcObject = currentStream;
      await videoElement.play();

      return new Promise((resolve, reject) => {
        const captureBtn = document.createElement("button");
        captureBtn.textContent = "📸 Capturar foto";
        captureBtn.className = "btn-primary";
        captureBtn.type = "button";

        captureBtn.onclick = () => {
          const canvas = document.createElement("canvas");
          canvas.width = videoElement.videoWidth;
          canvas.height = videoElement.videoHeight;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(videoElement, 0, 0);

          canvas.toBlob((blob) => {
            stopStream();
            const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
            resolve(file);
          }, "image/jpeg", 0.9);
        };

        videoElement.parentElement.appendChild(captureBtn);
      });
    } catch (error) {
      stopStream();
      throw new Error("No se pudo acceder a la cámara: " + error.message);
    }
  }

  async function selectImageFromDisk() {
    return new Promise((resolve, reject) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";

      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          resolve(file);
        } else {
          reject(new Error("No se seleccionó ningún archivo"));
        }
      };

      input.click();
    });
  }

  async function recordAudio(onProgress) {
    try {
      currentStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordedChunks = [];

      mediaRecorder = new MediaRecorder(currentStream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };

      return new Promise((resolve, reject) => {
        mediaRecorder.onstop = () => {
          const blob = new Blob(recordedChunks, { type: "audio/webm" });
          const file = new File([blob], "audio.webm", { type: "audio/webm" });
          stopStream();
          resolve(file);
        };

        mediaRecorder.start();
        recordingStartTime = Date.now();

        const interval = setInterval(() => {
          const elapsed = Date.now() - recordingStartTime;
          if (onProgress) {
            onProgress(elapsed, MAX_DURATION);
          }

          if (elapsed >= MAX_DURATION) {
            clearInterval(interval);
            mediaRecorder.stop();
          }
        }, 100);
      });
    } catch (error) {
      stopStream();
      throw new Error("No se pudo acceder al micrófono: " + error.message);
    }
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
  }

  async function recordVideo(videoElement, onProgress) {
    try {
      currentStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      });

      videoElement.srcObject = currentStream;
      await videoElement.play();

      recordedChunks = [];
      mediaRecorder = new MediaRecorder(currentStream, {
        mimeType: "video/webm",
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };

      return new Promise((resolve, reject) => {
        mediaRecorder.onstop = () => {
          const blob = new Blob(recordedChunks, { type: "video/webm" });
          const file = new File([blob], "video.webm", { type: "video/webm" });
          stopStream();
          resolve(file);
        };

        mediaRecorder.start();
        recordingStartTime = Date.now();

        const interval = setInterval(() => {
          const elapsed = Date.now() - recordingStartTime;
          if (onProgress) {
            onProgress(elapsed, MAX_DURATION);
          }

          if (elapsed >= MAX_DURATION) {
            clearInterval(interval);
            mediaRecorder.stop();
          }
        }, 100);
      });
    } catch (error) {
      stopStream();
      throw new Error("No se pudo acceder a la cámara/micrófono: " + error.message);
    }
  }

  return {
    uploadFile,
    captureImageFromCamera,
    selectImageFromDisk,
    recordAudio,
    recordVideo,
    stopRecording,
    stopStream,
  };
}
