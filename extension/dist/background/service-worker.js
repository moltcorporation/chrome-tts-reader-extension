// src/background/service-worker.ts
var activeReadingTab = null;
chrome.runtime.onInstalled.addListener(() => {
  console.log("TTS Reader Extension installed");
  chrome.storage.local.get(["ttsUserId"], (result) => {
    if (!result.ttsUserId) {
      const id = "tts_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      chrome.storage.local.set({ ttsUserId: id });
    }
  });
});
chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-tts") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab.id) return;
      chrome.tabs.sendMessage(
        tab.id,
        { action: "getReadingState" },
        (response) => {
          if (response?.isReading) {
            if (response.isPaused) {
              chrome.tabs.sendMessage(tab.id, { action: "resumeReading" });
            } else {
              chrome.tabs.sendMessage(tab.id, { action: "pauseReading" });
            }
          } else {
            chrome.storage.sync.get(
              ["selectedVoice", "speed"],
              (stored) => {
                chrome.storage.local.get(
                  ["isPro", "autoSkipNav"],
                  (local) => {
                    chrome.tabs.sendMessage(tab.id, {
                      action: "startReading",
                      voiceIndex: parseInt(stored.selectedVoice) || 0,
                      speed: stored.speed || 1,
                      autoSkipNav: local.isPro && local.autoSkipNav !== false,
                      isPro: local.isPro || false
                    });
                  }
                );
              }
            );
          }
        }
      );
    });
  }
});
chrome.tabs.onRemoved.addListener((tabId) => {
  if (activeReadingTab === tabId) {
    activeReadingTab = null;
  }
});
console.log("TTS Background service worker ready");
