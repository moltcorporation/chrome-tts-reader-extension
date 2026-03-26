// src/popup/popup.ts
var API_BASE = "https://chrome-tts-reader-extension-moltcorporation.vercel.app";
var ttsState = {
  isPlaying: false,
  isPaused: false,
  selectedVoice: "",
  speed: 1
};
var isPro = false;
var userId = "";
var playBtn = document.getElementById("playBtn");
var pauseBtn = document.getElementById("pauseBtn");
var stopBtn = document.getElementById("stopBtn");
var voiceSelect = document.getElementById(
  "voiceSelect"
);
var speedSlider = document.getElementById(
  "speedSlider"
);
var speedValue = document.getElementById("speedValue");
var status = document.getElementById("status");
var proBadge = document.getElementById("proBadge");
var proFeatures = document.getElementById("proFeatures");
var upgradeBanner = document.getElementById("upgradeBanner");
var upgradeBtn = document.getElementById("upgradeBtn");
var addToQueueBtn = document.getElementById("addToQueueBtn");
var queueList = document.getElementById("queueList");
var savePositionBtn = document.getElementById("savePositionBtn");
var resumePositionBtn = document.getElementById("resumePositionBtn");
var savedPosition = document.getElementById("savedPosition");
var viewStatsBtn = document.getElementById("viewStatsBtn");
var statsModal = document.getElementById("statsModal");
var closeStatsBtn = document.getElementById("closeStatsBtn");
var statsContent = document.getElementById("statsContent");
var autoSkipNav = document.getElementById(
  "autoSkipNav"
);
async function getUserId() {
  const stored = await chrome.storage.local.get(["ttsUserId"]);
  if (stored.ttsUserId) return stored.ttsUserId;
  const id = "tts_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  await chrome.storage.local.set({ ttsUserId: id });
  return id;
}
async function checkSubscription() {
  try {
    const res = await fetch(
      `${API_BASE}/api/subscription/check?userId=${encodeURIComponent(userId)}`
    );
    const data = await res.json();
    return data.isPro === true;
  } catch {
    return false;
  }
}
function updateProUI() {
  if (isPro) {
    proBadge.classList.remove("hidden");
    proFeatures.classList.remove("hidden");
    upgradeBanner.classList.add("hidden");
  } else {
    proBadge.classList.add("hidden");
    proFeatures.classList.add("hidden");
    upgradeBanner.classList.remove("hidden");
  }
}
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
  const localStored = await chrome.storage.local.get(["autoSkipNav"]);
  if (localStored.autoSkipNav !== void 0) {
    autoSkipNav.checked = localStored.autoSkipNav;
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
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "updateSpeed",
          speed: value
        });
      }
    });
  }
});
voiceSelect.addEventListener("change", (e) => {
  ttsState.selectedVoice = e.target.value;
  chrome.storage.sync.set({ selectedVoice: ttsState.selectedVoice });
  if (ttsState.isPlaying) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "updateVoice",
          voiceIndex: parseInt(ttsState.selectedVoice) || 0
        });
      }
    });
  }
});
playBtn.addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(
        tabs[0].id,
        {
          action: "startReading",
          voiceIndex: parseInt(ttsState.selectedVoice) || 0,
          speed: ttsState.speed,
          autoSkipNav: isPro && autoSkipNav.checked,
          isPro
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
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "pauseReading" });
      updateUI(true, true);
      status.textContent = "Paused";
    }
  });
});
stopBtn.addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
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
chrome.runtime.onMessage.addListener((message) => {
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
upgradeBtn.addEventListener("click", async () => {
  try {
    upgradeBtn.textContent = "Loading...";
    const res = await fetch(`${API_BASE}/api/stripe/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    });
    const data = await res.json();
    if (data.url) {
      chrome.tabs.create({ url: data.url });
    } else {
      status.textContent = "Could not start checkout";
    }
  } catch {
    status.textContent = "Checkout error";
  } finally {
    upgradeBtn.textContent = "Upgrade to Pro";
  }
});
autoSkipNav.addEventListener("change", () => {
  chrome.storage.local.set({ autoSkipNav: autoSkipNav.checked });
});
var readingQueue = [];
async function loadQueue() {
  const stored = await chrome.storage.local.get(["readingQueue"]);
  readingQueue = stored.readingQueue || [];
  renderQueue();
}
function renderQueue() {
  if (readingQueue.length === 0) {
    queueList.innerHTML = '<span class="queue-empty">No pages queued</span>';
    return;
  }
  queueList.innerHTML = "";
  readingQueue.forEach((item, i) => {
    const div = document.createElement("div");
    div.className = "queue-item";
    div.innerHTML = `
      <span class="queue-item-title" title="${item.url}">${item.title || item.url}</span>
      <button class="queue-item-remove" data-index="${i}">&times;</button>
    `;
    queueList.appendChild(div);
  });
  queueList.querySelectorAll(".queue-item-remove").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const index = parseInt(
        e.target.getAttribute("data-index") || "0"
      );
      readingQueue.splice(index, 1);
      chrome.storage.local.set({ readingQueue });
      renderQueue();
    });
  });
}
addToQueueBtn.addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      const item = {
        url: tabs[0].url || "",
        title: tabs[0].title || "Untitled"
      };
      if (!readingQueue.some((q) => q.url === item.url)) {
        readingQueue.push(item);
        chrome.storage.local.set({ readingQueue });
        renderQueue();
      }
    }
  });
});
savePositionBtn.addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "getReadingState" },
        async (response) => {
          if (response?.isReading || response?.currentWord !== void 0) {
            const url = tabs[0].url || "";
            const title = tabs[0].title || "";
            const position = response.currentWord || 0;
            const totalWords = response.totalWords || 0;
            await chrome.storage.local.set({
              savedReadingPosition: { url, title, position, totalWords }
            });
            try {
              await fetch(`${API_BASE}/api/positions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, url, title, position, totalWords })
              });
            } catch {
            }
            savedPosition.textContent = `${title} \u2014 word ${position}/${totalWords}`;
            resumePositionBtn.disabled = false;
            status.textContent = "Position saved";
          } else {
            status.textContent = "Start reading first";
          }
        }
      );
    }
  });
});
resumePositionBtn.addEventListener("click", async () => {
  const stored = await chrome.storage.local.get(["savedReadingPosition"]);
  const pos = stored.savedReadingPosition;
  if (!pos) return;
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      if (tabs[0].url === pos.url && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "startReading",
          voiceIndex: parseInt(ttsState.selectedVoice) || 0,
          speed: ttsState.speed,
          resumeFromWord: pos.position,
          autoSkipNav: isPro && autoSkipNav.checked,
          isPro
        });
        updateUI(true, false);
        status.textContent = `Resuming from word ${pos.position}...`;
      } else {
        chrome.tabs.update(tabs[0].id, { url: pos.url });
        status.textContent = "Navigating to saved page...";
      }
    }
  });
});
async function loadSavedPosition() {
  const stored = await chrome.storage.local.get(["savedReadingPosition"]);
  const pos = stored.savedReadingPosition;
  if (pos) {
    savedPosition.textContent = `${pos.title} \u2014 word ${pos.position}/${pos.totalWords}`;
    resumePositionBtn.disabled = false;
  }
}
viewStatsBtn.addEventListener("click", async () => {
  statsModal.classList.remove("hidden");
  statsContent.innerHTML = "<p>Loading...</p>";
  try {
    const res = await fetch(
      `${API_BASE}/api/stats?userId=${encodeURIComponent(userId)}`
    );
    const data = await res.json();
    const stats = data.stats || [];
    if (stats.length === 0) {
      statsContent.innerHTML = "<p>No reading stats yet. Start reading to track your progress!</p>";
      return;
    }
    const totals = stats.reduce(
      (acc, s) => {
        acc.pages += s.pagesRead || 0;
        acc.words += s.wordsRead || 0;
        acc.minutes += s.minutesListened || 0;
        return acc;
      },
      { pages: 0, words: 0, minutes: 0 }
    );
    let html = `
      <div class="stat-total">
        <div class="stat-total-item">
          <span class="stat-total-value">${totals.pages}</span>
          <span class="stat-total-label">Pages</span>
        </div>
        <div class="stat-total-item">
          <span class="stat-total-value">${totals.words.toLocaleString()}</span>
          <span class="stat-total-label">Words</span>
        </div>
        <div class="stat-total-item">
          <span class="stat-total-value">${totals.minutes}</span>
          <span class="stat-total-label">Minutes</span>
        </div>
      </div>
    `;
    stats.forEach(
      (s) => {
        html += `
        <div class="stat-row">
          <span class="stat-date">${s.date}</span>
          <span class="stat-values">
            ${s.pagesRead}p &middot; ${s.wordsRead}w &middot; ${s.minutesListened}m
          </span>
        </div>
      `;
      }
    );
    statsContent.innerHTML = html;
  } catch {
    statsContent.innerHTML = "<p>Failed to load stats</p>";
  }
});
closeStatsBtn.addEventListener("click", () => {
  statsModal.classList.add("hidden");
});
document.addEventListener("DOMContentLoaded", async () => {
  userId = await getUserId();
  await loadPreferences();
  populateVoices();
  speechSynthesis.onvoiceschanged = populateVoices;
  isPro = await checkSubscription();
  await chrome.storage.local.set({ isPro });
  updateProUI();
  if (isPro) {
    await loadQueue();
    await loadSavedPosition();
  }
});
