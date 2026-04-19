import { createMediaCapture } from "../components/mediaCapture.js";

export function createDomMediaCaptureView(prefix) {
  const mediaCapture = createMediaCapture();
  
  const elements = {
    typeSelect: document.getElementById(`${prefix}Type`),
    textInput: document.getElementById(`${prefix}TextInput`),
    imageInput: document.getElementById(`${prefix}ImageInput`),
    audioInput: document.getElementById(`${prefix}AudioInput`),
    videoInput: document.getElementById(`${prefix}VideoInput`),
    
    contentText: document.getElementById(`${prefix}Content`) || document.getElementById(`${prefix}ContentText`),
    
    captureImageBtn: document.getElementById(`${prefix}CaptureImage`),
    uploadImageBtn: document.getElementById(`${prefix}UploadImage`),
    urlImageBtn: document.getElementById(`${prefix}UrlImage`),
    imagePreview: document.getElementById(`${prefix}ImagePreview`),
    imageUrl: document.getElementById(`${prefix}ImageUrl`),
    
    recordAudioBtn: document.getElementById(`${prefix}RecordAudio`),
    urlAudioBtn: document.getElementById(`${prefix}UrlAudio`),
    audioPreview: document.getElementById(`${prefix}AudioPreview`),
    audioProgress: document.getElementById(`${prefix}AudioProgress`),
    audioUrl: document.getElementById(`${prefix}AudioUrl`),
    
    recordVideoBtn: document.getElementById(`${prefix}RecordVideo`),
    urlVideoBtn: document.getElementById(`${prefix}UrlVideo`),
    videoPreview: document.getElementById(`${prefix}VideoPreview`),
    videoProgress: document.getElementById(`${prefix}VideoProgress`),
    videoUrl: document.getElementById(`${prefix}VideoUrl`),
  };

  let currentMediaUrl = null;
  let isRecording = false;

  function showInput(type) {
    elements.textInput?.classList.add("hidden");
    elements.imageInput?.classList.add("hidden");
    elements.audioInput?.classList.add("hidden");
    elements.videoInput?.classList.add("hidden");

    if (elements.contentText) {
      elements.contentText.removeAttribute("required");
    }

    currentMediaUrl = null;

    switch (type) {
      case "text":
        elements.textInput?.classList.remove("hidden");
        if (elements.contentText) {
          elements.contentText.setAttribute("required", "");
        }
        break;
      case "image":
        elements.imageInput?.classList.remove("hidden");
        break;
      case "audio":
        elements.audioInput?.classList.remove("hidden");
        break;
      case "video":
        elements.videoInput?.classList.remove("hidden");
        break;
    }
  }

  async function handleCaptureImage() {
    try {
      elements.imagePreview.innerHTML = '<video autoplay style="max-width: 100%; border-radius: 8px;"></video>';
      const video = elements.imagePreview.querySelector("video");
      
      const file = await mediaCapture.captureImageFromCamera(video);
      const url = await mediaCapture.uploadFile(file);
      
      currentMediaUrl = url;
      elements.imagePreview.innerHTML = `<img src="${url}" style="max-width: 100%; border-radius: 8px;" />`;
      elements.imageUrl.classList.add("hidden");
    } catch (error) {
      alert(error.message);
      elements.imagePreview.innerHTML = "";
    }
  }

  async function handleUploadImage() {
    try {
      const file = await mediaCapture.selectImageFromDisk();
      const url = await mediaCapture.uploadFile(file);
      
      currentMediaUrl = url;
      elements.imagePreview.innerHTML = `<img src="${url}" style="max-width: 100%; border-radius: 8px;" />`;
      elements.imageUrl.classList.add("hidden");
    } catch (error) {
      alert(error.message);
    }
  }

  function handleUrlImage() {
    elements.imageUrl.classList.toggle("hidden");
    if (!elements.imageUrl.classList.contains("hidden")) {
      elements.imagePreview.innerHTML = "";
      currentMediaUrl = null;
    }
  }

  async function handleRecordAudio() {
    if (isRecording) {
      mediaCapture.stopRecording();
      isRecording = false;
      elements.recordAudioBtn.textContent = "🎤 Grabar audio (máx 30s)";
      elements.audioProgress.classList.add("hidden");
      return;
    }

    try {
      isRecording = true;
      elements.recordAudioBtn.textContent = "⏹️ Detener grabación";
      elements.audioProgress.classList.remove("hidden");
      elements.audioUrl.classList.add("hidden");

      const file = await mediaCapture.recordAudio((elapsed, max) => {
        const percent = (elapsed / max) * 100;
        elements.audioProgress.style.width = `${percent}%`;
        elements.audioProgress.textContent = `${Math.floor(elapsed / 1000)}s / ${max / 1000}s`;
      });

      const url = await mediaCapture.uploadFile(file);
      currentMediaUrl = url;
      
      elements.audioPreview.innerHTML = `<audio controls src="${url}" style="width: 100%;"></audio>`;
      elements.recordAudioBtn.textContent = "🎤 Grabar audio (máx 30s)";
      elements.audioProgress.classList.add("hidden");
      isRecording = false;
    } catch (error) {
      alert(error.message);
      elements.recordAudioBtn.textContent = "🎤 Grabar audio (máx 30s)";
      elements.audioProgress.classList.add("hidden");
      isRecording = false;
    }
  }

  function handleUrlAudio() {
    elements.audioUrl.classList.toggle("hidden");
    if (!elements.audioUrl.classList.contains("hidden")) {
      elements.audioPreview.innerHTML = "";
      currentMediaUrl = null;
    }
  }

  async function handleRecordVideo() {
    if (isRecording) {
      mediaCapture.stopRecording();
      isRecording = false;
      elements.recordVideoBtn.textContent = "🎥 Grabar video (máx 30s)";
      elements.videoProgress.classList.add("hidden");
      return;
    }

    try {
      isRecording = true;
      elements.recordVideoBtn.textContent = "⏹️ Detener grabación";
      elements.videoProgress.classList.remove("hidden");
      elements.videoUrl.classList.add("hidden");
      
      elements.videoPreview.innerHTML = '<video autoplay muted style="max-width: 100%; border-radius: 8px;"></video>';
      const video = elements.videoPreview.querySelector("video");

      const file = await mediaCapture.recordVideo(video, (elapsed, max) => {
        const percent = (elapsed / max) * 100;
        elements.videoProgress.style.width = `${percent}%`;
        elements.videoProgress.textContent = `${Math.floor(elapsed / 1000)}s / ${max / 1000}s`;
      });

      const url = await mediaCapture.uploadFile(file);
      currentMediaUrl = url;
      
      elements.videoPreview.innerHTML = `<video controls src="${url}" style="max-width: 100%; border-radius: 8px;"></video>`;
      elements.recordVideoBtn.textContent = "🎥 Grabar video (máx 30s)";
      elements.videoProgress.classList.add("hidden");
      isRecording = false;
    } catch (error) {
      alert(error.message);
      elements.recordVideoBtn.textContent = "🎥 Grabar video (máx 30s)";
      elements.videoProgress.classList.add("hidden");
      isRecording = false;
    }
  }

  function handleUrlVideo() {
    elements.videoUrl.classList.toggle("hidden");
    if (!elements.videoUrl.classList.contains("hidden")) {
      elements.videoPreview.innerHTML = "";
      currentMediaUrl = null;
    }
  }

  function getContent() {
    const type = elements.typeSelect.value;
    
    if (type === "text") {
      return elements.contentText.value;
    }
    
    if (type === "image") {
      return currentMediaUrl || elements.imageUrl.value;
    }
    
    if (type === "audio") {
      return currentMediaUrl || elements.audioUrl.value;
    }
    
    if (type === "video") {
      return currentMediaUrl || elements.videoUrl.value;
    }
    
    return "";
  }

  function reset() {
    currentMediaUrl = null;
    isRecording = false;
    
    if (elements.contentText) elements.contentText.value = "";
    if (elements.imageUrl) elements.imageUrl.value = "";
    if (elements.audioUrl) elements.audioUrl.value = "";
    if (elements.videoUrl) elements.videoUrl.value = "";
    
    if (elements.imagePreview) elements.imagePreview.innerHTML = "";
    if (elements.audioPreview) elements.audioPreview.innerHTML = "";
    if (elements.videoPreview) elements.videoPreview.innerHTML = "";
    
    mediaCapture.stopStream();
    showInput("text");
  }

  function init() {
    if (elements.typeSelect) {
      elements.typeSelect.addEventListener("change", () => {
        showInput(elements.typeSelect.value);
      });
    }

    if (elements.captureImageBtn) {
      elements.captureImageBtn.addEventListener("click", handleCaptureImage);
    }
    if (elements.uploadImageBtn) {
      elements.uploadImageBtn.addEventListener("click", handleUploadImage);
    }
    if (elements.urlImageBtn) {
      elements.urlImageBtn.addEventListener("click", handleUrlImage);
    }

    if (elements.recordAudioBtn) {
      elements.recordAudioBtn.addEventListener("click", handleRecordAudio);
    }
    if (elements.urlAudioBtn) {
      elements.urlAudioBtn.addEventListener("click", handleUrlAudio);
    }

    if (elements.recordVideoBtn) {
      elements.recordVideoBtn.addEventListener("click", handleRecordVideo);
    }
    if (elements.urlVideoBtn) {
      elements.urlVideoBtn.addEventListener("click", handleUrlVideo);
    }

    showInput("text");
  }

  return {
    init,
    getContent,
    reset,
  };
}
