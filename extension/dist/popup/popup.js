// src/popup/popup.ts
var ttsState = {
  isPlaying: false,
  isPaused: false,
  selectedVoice: "",
  speed: 1
};
var playBtn = document.getElementById("playBtn");
var pauseBtn = document.getElementById("pauseBtn");
var stopBtn = document.getElementById("stopBtn");
var voiceSelect = document.getElementById("voiceSelect");
var speedSlider = document.getElementById("speedSlider");
var speedValue = document.getElementById("speedValue");
var status = document.getElementById("status");
async function loadPreferences() {
  const stored = await chrome.storage.sync.get(["selectedVoice", "speed"]);
  if (stored.selectedVoice) {
    ttsState.selectedVoice = stored.selectedVoice;
    voiceSelect.value = stored.selectedVoice;
  }
  if (stored.speed) {
    ttsState.speed = stored.speed;
    speedSlider.value = String(stored.speed);
    speedValue.textContent = stored.speed.toFixed(1) + "x";
  }
}
function populateVoices() {
  const voices = speechSynthesis.getVoices();
  voiceSelect.innerHTML = '<option value="">Default</option>';
  voices.forEach((voice, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = `${voice.name} (${voice.lang})`;
    voiceSelect.appendChild(option);
  });
  voiceSelect.value = ttsState.selectedVoice;
}
speedSlider.addEventListener("input", (e) => {
  const value = parseFloat(e.target.value);
  ttsState.speed = value;
  speedValue.textContent = value.toFixed(1) + "x";
  chrome.storage.sync.set({ speed: value });
  if (ttsState.isPlaying) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "updateSpeed", speed: value });
      }
    });
  }
});
voiceSelect.addEventListener("change", (e) => {
  ttsState.selectedVoice = e.target.value;
  chrome.storage.sync.set({ selectedVoice: ttsState.selectedVoice });
  if (ttsState.isPlaying) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "updateVoice", voiceIndex: parseInt(ttsState.selectedVoice) || 0 });
      }
    });
  }
});
playBtn.addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0].id) {
      chrome.tabs.sendMessage(
        tabs[0].id,
        {
          action: "startReading",
          voiceIndex: parseInt(ttsState.selectedVoice) || 0,
          speed: ttsState.speed
        },
        (response) => {
          if (response?.status === "reading") {
            updateUI(true, false);
            status.textContent = "Reading...";
          } else if (response?.status === "notext") {
            status.textContent = "No text selected or found";
          }
        }
      );
    }
  });
});
pauseBtn.addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "pauseReading" });
      updateUI(true, true);
      status.textContent = "Paused";
    }
  });
});
stopBtn.addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "stopReading" });
      updateUI(false, false);
      status.textContent = "";
    }
  });
});
function updateUI(isPlaying, isPaused) {
  ttsState.isPlaying = isPlaying;
  ttsState.isPaused = isPaused;
  playBtn.disabled = isPlaying;
  pauseBtn.disabled = !isPlaying || isPaused;
  stopBtn.disabled = !isPlaying;
}
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "readingEnded") {
    updateUI(false, false);
    status.textContent = "Finished";
    setTimeout(() => {
      status.textContent = "";
    }, 2e3);
  } else if (message.action === "readingPaused") {
    updateUI(true, true);
    status.textContent = "Paused";
  } else if (message.action === "readingResumed") {
    updateUI(true, false);
    status.textContent = "Reading...";
  }
});
document.addEventListener("DOMContentLoaded", async () => {
  await loadPreferences();
  populateVoices();
  speechSynthesis.onvoiceschanged = populateVoices;
});
