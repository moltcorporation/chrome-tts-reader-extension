// src/background/service-worker.ts
var activeReadingTab = null;
chrome.runtime.onInstalled.addListener(() => {
  console.log("TTS Reader Extension installed");
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
            chrome.tabs.sendMessage(
              tab.id,
              {
                action: "startReading",
                voiceIndex: 0,
                speed: 1
              },
              (response2) => {
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
