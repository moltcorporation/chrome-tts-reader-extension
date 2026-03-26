const API_BASE =
  "https://chrome-tts-reader-extension-moltcorporation.vercel.app";

interface ReadingState {
  isReading: boolean;
  isPaused: boolean;
  currentText: string;
  currentWord: number;
  totalWords: number;
  words: string[];
  voiceIndex: number;
  speed: number;
  isPro: boolean;
  startTime: number;
}

let readingState: ReadingState = {
  isReading: false,
  isPaused: false,
  currentText: "",
  currentWord: 0,
  totalWords: 0,
  words: [],
  voiceIndex: 0,
  speed: 1,
  isPro: false,
  startTime: 0,
};

let highlightOverlay: HTMLElement | null = null;

// NAV_SELECTORS: elements to skip when auto-skip-nav is enabled
const NAV_SELECTORS = [
  "nav",
  "header",
  "footer",
  '[role="navigation"]',
  '[role="banner"]',
  '[role="contentinfo"]',
  ".navbar",
  ".nav",
  ".header",
  ".footer",
  ".sidebar",
  ".menu",
  ".breadcrumb",
  ".pagination",
  "#cookie-banner",
  ".cookie-notice",
];

// Create highlight overlay
function createHighlightOverlay() {
  if (highlightOverlay) {
    highlightOverlay.remove();
  }
  highlightOverlay = document.createElement("div");
  highlightOverlay.id = "__tts_overlay";
  highlightOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    pointer-events: none;
    z-index: 2147483647;
  `;
  document.body.appendChild(highlightOverlay);
}

// Extract text from page, optionally skipping nav elements
function extractText(autoSkipNav: boolean): string {
  const selection = window.getSelection();
  if (selection && selection.toString().length > 0) {
    return selection.toString();
  }

  if (autoSkipNav) {
    // Try to find main content area first
    const mainContent =
      document.querySelector("main") ||
      document.querySelector("article") ||
      document.querySelector('[role="main"]') ||
      document.querySelector(".content") ||
      document.querySelector("#content");

    if (mainContent) {
      return mainContent.innerText || "";
    }

    // Fall back to body but skip nav elements
    const clone = document.body.cloneNode(true) as HTMLElement;
    NAV_SELECTORS.forEach((sel) => {
      clone.querySelectorAll(sel).forEach((el) => el.remove());
    });
    return clone.innerText || "";
  }

  return document.body.innerText || "No text found on this page";
}

// Split text into words
function tokenizeWords(text: string): string[] {
  return text.match(/\S+(?:\s+)?/g) || [];
}

// Highlight current word (Pro: word-level highlight)
function highlightWord(wordIndex: number) {
  if (!highlightOverlay) return;
  highlightOverlay.innerHTML = "";

  if (wordIndex >= readingState.words.length) return;

  const word = readingState.words[wordIndex];

  const highlight = document.createElement("div");
  highlight.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${readingState.isPro ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "#FFD700"};
    color: ${readingState.isPro ? "#fff" : "#000"};
    padding: 8px 16px;
    border-radius: 4px;
    font-weight: bold;
    font-size: 14px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    max-width: 80%;
    word-break: break-word;
  `;
  highlight.textContent = word.trim();
  highlightOverlay.appendChild(highlight);
}

// Report reading stats for Pro users
async function reportStats(wordsRead: number) {
  if (!readingState.isPro) return;

  try {
    const stored = await chrome.storage.local.get(["ttsUserId"]);
    const userId = stored.ttsUserId;
    if (!userId) return;

    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const minutesListened = Math.round(
      (Date.now() - readingState.startTime) / 60000
    );

    await fetch(`${API_BASE}/api/stats`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        date,
        pagesRead: 1,
        wordsRead,
        minutesListened: Math.max(1, minutesListened),
      }),
    });
  } catch {
    // Stats reporting is best-effort
  }
}

// Start text-to-speech
function startTTS(
  text: string,
  voiceIndex: number,
  speed: number,
  resumeFromWord?: number
) {
  if (!("speechSynthesis" in window)) return;

  speechSynthesis.cancel();

  let textToRead = text;
  if (resumeFromWord && resumeFromWord > 0) {
    const words = tokenizeWords(text);
    textToRead = words.slice(resumeFromWord).join("");
  }

  const utterance = new SpeechSynthesisUtterance(textToRead);
  utterance.rate = speed;

  const voices = speechSynthesis.getVoices();
  if (voices.length > voiceIndex && voiceIndex > 0) {
    utterance.voice = voices[voiceIndex];
  }

  readingState.isReading = true;
  readingState.isPaused = false;
  readingState.currentWord = resumeFromWord || 0;
  readingState.voiceIndex = voiceIndex;
  readingState.speed = speed;
  readingState.startTime = Date.now();

  let lastWordIndex = resumeFromWord || 0;
  utterance.onboundary = (event) => {
    if (event.name === "word") {
      const charIndex = event.charIndex || 0;
      let wordIndex = resumeFromWord || 0;
      let charCount = 0;
      const resumeWords = tokenizeWords(textToRead);

      for (let i = 0; i < resumeWords.length; i++) {
        if (charCount >= charIndex) {
          wordIndex = (resumeFromWord || 0) + i;
          break;
        }
        charCount += resumeWords[i].length;
      }

      if (wordIndex !== lastWordIndex) {
        readingState.currentWord = wordIndex;
        highlightWord(wordIndex);
        lastWordIndex = wordIndex;
      }
    }
  };

  utterance.onend = () => {
    const wordsRead = readingState.currentWord - (resumeFromWord || 0);
    readingState.isReading = false;
    readingState.isPaused = false;
    if (highlightOverlay) {
      highlightOverlay.innerHTML = "";
    }
    chrome.runtime.sendMessage({ action: "readingEnded" });
    reportStats(wordsRead);
  };

  utterance.onerror = (event) => {
    console.error("Speech error:", event.error);
    readingState.isReading = false;
    chrome.runtime.sendMessage({ action: "readingEnded" });
  };

  speechSynthesis.speak(utterance);
}

// Handle messages from popup/background
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.action) {
    case "startReading": {
      const autoSkipNav = message.autoSkipNav || false;
      readingState.isPro = message.isPro || false;

      const text = extractText(autoSkipNav);
      if (!text || text.length === 0) {
        sendResponse({ status: "notext" });
        return;
      }

      readingState.currentText = text;
      readingState.words = tokenizeWords(text);
      readingState.totalWords = readingState.words.length;
      createHighlightOverlay();

      startTTS(
        text,
        message.voiceIndex,
        message.speed,
        message.resumeFromWord
      );
      sendResponse({ status: "reading" });
      break;
    }

    case "pauseReading": {
      if ("speechSynthesis" in window) {
        speechSynthesis.pause();
        readingState.isPaused = true;
      }
      sendResponse({ status: "paused" });
      break;
    }

    case "stopReading": {
      if ("speechSynthesis" in window) {
        speechSynthesis.cancel();
      }
      readingState.isReading = false;
      readingState.isPaused = false;
      if (highlightOverlay) {
        highlightOverlay.innerHTML = "";
      }
      sendResponse({ status: "stopped" });
      break;
    }

    case "updateSpeed": {
      if (readingState.isReading && "speechSynthesis" in window) {
        speechSynthesis.cancel();
        startTTS(
          readingState.currentText,
          readingState.voiceIndex,
          message.speed,
          readingState.currentWord
        );
      }
      sendResponse({ status: "speedUpdated" });
      break;
    }

    case "updateVoice": {
      if (readingState.isReading && "speechSynthesis" in window) {
        speechSynthesis.cancel();
        startTTS(
          readingState.currentText,
          message.voiceIndex,
          readingState.speed,
          readingState.currentWord
        );
      }
      sendResponse({ status: "voiceUpdated" });
      break;
    }

    case "getReadingState": {
      sendResponse({
        isReading: readingState.isReading,
        isPaused: readingState.isPaused,
        currentWord: readingState.currentWord,
        totalWords: readingState.totalWords,
      });
      break;
    }

    case "resumeReading": {
      if ("speechSynthesis" in window && readingState.isPaused) {
        speechSynthesis.resume();
        readingState.isPaused = false;
        chrome.runtime.sendMessage({ action: "readingResumed" });
      }
      sendResponse({ status: "resumed" });
      break;
    }
  }
});

console.log("TTS Content script loaded");
