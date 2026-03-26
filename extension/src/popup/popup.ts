const API_BASE =
  "https://chrome-tts-reader-extension-moltcorporation.vercel.app";

interface TTSState {
  isPlaying: boolean;
  isPaused: boolean;
  selectedVoice: string;
  speed: number;
}

let ttsState: TTSState = {
  isPlaying: false,
  isPaused: false,
  selectedVoice: "",
  speed: 1,
};

let isPro = false;
let userId = "";

const playBtn = document.getElementById("playBtn")!;
const pauseBtn = document.getElementById("pauseBtn")!;
const stopBtn = document.getElementById("stopBtn")!;
const voiceSelect = document.getElementById(
  "voiceSelect"
)! as HTMLSelectElement;
const speedSlider = document.getElementById(
  "speedSlider"
)! as HTMLInputElement;
const speedValue = document.getElementById("speedValue")!;
const status = document.getElementById("status")!;
const proBadge = document.getElementById("proBadge")!;
const proFeatures = document.getElementById("proFeatures")!;
const upgradeBanner = document.getElementById("upgradeBanner")!;
const upgradeBtn = document.getElementById("upgradeBtn")!;
const addToQueueBtn = document.getElementById("addToQueueBtn")!;
const queueList = document.getElementById("queueList")!;
const savePositionBtn = document.getElementById("savePositionBtn")!;
const resumePositionBtn = document.getElementById("resumePositionBtn")!;
const savedPosition = document.getElementById("savedPosition")!;
const viewStatsBtn = document.getElementById("viewStatsBtn")!;
const statsModal = document.getElementById("statsModal")!;
const closeStatsBtn = document.getElementById("closeStatsBtn")!;
const statsContent = document.getElementById("statsContent")!;
const autoSkipNav = document.getElementById(
  "autoSkipNav"
)! as HTMLInputElement;

// Generate or retrieve user ID
async function getUserId(): Promise<string> {
  const stored = await chrome.storage.local.get(["ttsUserId"]);
  if (stored.ttsUserId) return stored.ttsUserId;
  const id =
    "tts_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  await chrome.storage.local.set({ ttsUserId: id });
  return id;
}

// Check subscription status
async function checkSubscription(): Promise<boolean> {
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

// Update UI based on Pro status
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

// Load preferences from storage
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
  if (localStored.autoSkipNav !== undefined) {
    autoSkipNav.checked = localStored.autoSkipNav;
  }
}

// Populate voice options
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

// Speed slider
speedSlider.addEventListener("input", (e) => {
  const value = parseFloat((e.target as HTMLInputElement).value);
  ttsState.speed = value;
  speedValue.textContent = value.toFixed(1) + "x";
  chrome.storage.sync.set({ speed: value });

  if (ttsState.isPlaying) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "updateSpeed",
          speed: value,
        });
      }
    });
  }
});

// Voice selector
voiceSelect.addEventListener("change", (e) => {
  ttsState.selectedVoice = (e.target as HTMLSelectElement).value;
  chrome.storage.sync.set({ selectedVoice: ttsState.selectedVoice });

  if (ttsState.isPlaying) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "updateVoice",
          voiceIndex: parseInt(ttsState.selectedVoice) || 0,
        });
      }
    });
  }
});

// Play button
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
          isPro,
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

// Pause button
pauseBtn.addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "pauseReading" });
      updateUI(true, true);
      status.textContent = "Paused";
    }
  });
});

// Stop button
stopBtn.addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "stopReading" });
      updateUI(false, false);
      status.textContent = "";
    }
  });
});

function updateUI(isPlaying: boolean, isPaused: boolean) {
  ttsState.isPlaying = isPlaying;
  ttsState.isPaused = isPaused;
  playBtn.disabled = isPlaying;
  pauseBtn.disabled = !isPlaying || isPaused;
  stopBtn.disabled = !isPlaying;
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "readingEnded") {
    updateUI(false, false);
    status.textContent = "Finished";
    setTimeout(() => {
      status.textContent = "";
    }, 2000);
  } else if (message.action === "readingPaused") {
    updateUI(true, true);
    status.textContent = "Paused";
  } else if (message.action === "readingResumed") {
    updateUI(true, false);
    status.textContent = "Reading...";
  }
});

// --- Pro Features ---

// Upgrade button
upgradeBtn.addEventListener("click", async () => {
  try {
    upgradeBtn.textContent = "Loading...";
    const res = await fetch(`${API_BASE}/api/stripe/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
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

// Auto-skip nav toggle
autoSkipNav.addEventListener("change", () => {
  chrome.storage.local.set({ autoSkipNav: autoSkipNav.checked });
});

// Reading queue
interface QueueItem {
  url: string;
  title: string;
}

let readingQueue: QueueItem[] = [];

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
        (e.target as HTMLElement).getAttribute("data-index") || "0"
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
      const item: QueueItem = {
        url: tabs[0].url || "",
        title: tabs[0].title || "Untitled",
      };
      if (!readingQueue.some((q) => q.url === item.url)) {
        readingQueue.push(item);
        chrome.storage.local.set({ readingQueue });
        renderQueue();
      }
    }
  });
});

// Save/Resume position
savePositionBtn.addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "getReadingState" },
        async (response) => {
          if (response?.isReading || response?.currentWord !== undefined) {
            const url = tabs[0].url || "";
            const title = tabs[0].title || "";
            const position = response.currentWord || 0;
            const totalWords = response.totalWords || 0;

            // Save locally
            await chrome.storage.local.set({
              savedReadingPosition: { url, title, position, totalWords },
            });

            // Save to server for Pro users
            try {
              await fetch(`${API_BASE}/api/positions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, url, title, position, totalWords }),
              });
            } catch {
              // Silently fail — local save is the fallback
            }

            savedPosition.textContent = `${title} — word ${position}/${totalWords}`;
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
          isPro,
        });
        updateUI(true, false);
        status.textContent = `Resuming from word ${pos.position}...`;
      } else {
        chrome.tabs.update(tabs[0].id!, { url: pos.url });
        status.textContent = "Navigating to saved page...";
      }
    }
  });
});

// Load saved position display
async function loadSavedPosition() {
  const stored = await chrome.storage.local.get(["savedReadingPosition"]);
  const pos = stored.savedReadingPosition;
  if (pos) {
    savedPosition.textContent = `${pos.title} — word ${pos.position}/${pos.totalWords}`;
    resumePositionBtn.disabled = false;
  }
}

// Stats
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
      statsContent.innerHTML =
        "<p>No reading stats yet. Start reading to track your progress!</p>";
      return;
    }

    const totals = stats.reduce(
      (
        acc: { pages: number; words: number; minutes: number },
        s: { pagesRead: number; wordsRead: number; minutesListened: number }
      ) => {
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
      (s: {
        date: string;
        pagesRead: number;
        wordsRead: number;
        minutesListened: number;
      }) => {
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

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
  userId = await getUserId();
  await loadPreferences();
  populateVoices();
  speechSynthesis.onvoiceschanged = populateVoices;

  // Check Pro status
  isPro = await checkSubscription();

  // Cache Pro status locally for faster startup
  await chrome.storage.local.set({ isPro });

  updateProUI();

  if (isPro) {
    await loadQueue();
    await loadSavedPosition();
  }
});
