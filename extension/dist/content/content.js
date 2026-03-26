// src/content/content.ts
var readingState = {
  isReading: false,
  isPaused: false,
  currentText: "",
  currentWord: 0,
  words: [],
  voiceIndex: 0,
  speed: 1
};
var highlightOverlay = null;
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
function extractText() {
  const selection = window.getSelection();
  if (selection && selection.toString().length > 0) {
    return selection.toString();
  }
  const bodyText = document.body.innerText;
  return bodyText || "No text found on this page";
}
function tokenizeWords(text) {
  return text.match(/\S+(?:\s+)?/g) || [];
}
function highlightWord(wordIndex) {
  if (!highlightOverlay) return;
  highlightOverlay.innerHTML = "";
  if (wordIndex >= readingState.words.length) {
    return;
  }
  const word = readingState.words[wordIndex];
  const textWithoutHtml = readingState.currentText;
  const position = textWithoutHtml.substring(0, wordIndex).split(" ").reduce((pos, w) => {
    return pos + w.length + 1;
  }, 0);
  const highlight = document.createElement("div");
  highlight.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #FFD700;
    color: #000;
    padding: 8px 16px;
    border-radius: 4px;
    font-weight: bold;
    font-size: 14px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    max-width: 80%;
    word-break: break-word;
  `;
  highlight.textContent = `Reading: ${word.trim()}`;
  highlightOverlay.appendChild(highlight);
}
function startTTS(text, voiceIndex, speed) {
  if ("speechSynthesis" in window) {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speed;
    const voices = speechSynthesis.getVoices();
    if (voices.length > voiceIndex && voiceIndex > 0) {
      utterance.voice = voices[voiceIndex];
    }
    readingState.isReading = true;
    readingState.isPaused = false;
    readingState.currentWord = 0;
    readingState.voiceIndex = voiceIndex;
    readingState.speed = speed;
    let lastWordIndex = 0;
    utterance.onboundary = (event) => {
      if (event.name === "word") {
        const charIndex = event.charIndex || 0;
        let wordIndex = 0;
        let charCount = 0;
        for (let i = 0; i < readingState.words.length; i++) {
          if (charCount >= charIndex) {
            wordIndex = i;
            break;
          }
          charCount += readingState.words[i].length;
        }
        if (wordIndex !== lastWordIndex) {
          readingState.currentWord = wordIndex;
          highlightWord(wordIndex);
          lastWordIndex = wordIndex;
        }
      }
    };
    utterance.onend = () => {
      readingState.isReading = false;
      readingState.isPaused = false;
      if (highlightOverlay) {
        highlightOverlay.innerHTML = "";
      }
      chrome.runtime.sendMessage({ action: "readingEnded" });
    };
    utterance.onerror = (event) => {
      console.error("Speech error:", event.error);
      readingState.isReading = false;
      chrome.runtime.sendMessage({ action: "readingEnded" });
    };
    speechSynthesis.speak(utterance);
  }
}
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case "startReading": {
      const text = extractText();
      if (!text || text.length === 0) {
        sendResponse({ status: "notext" });
        return;
      }
      readingState.currentText = text;
      readingState.words = tokenizeWords(text);
      createHighlightOverlay();
      startTTS(text, message.voiceIndex, message.speed);
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
        startTTS(readingState.currentText, readingState.voiceIndex, message.speed);
      }
      sendResponse({ status: "speedUpdated" });
      break;
    }
    case "updateVoice": {
      if (readingState.isReading && "speechSynthesis" in window) {
        speechSynthesis.cancel();
        startTTS(readingState.currentText, message.voiceIndex, readingState.speed);
      }
      sendResponse({ status: "voiceUpdated" });
      break;
    }
    case "getReadingState": {
      sendResponse({
        isReading: readingState.isReading,
        isPaused: readingState.isPaused
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
