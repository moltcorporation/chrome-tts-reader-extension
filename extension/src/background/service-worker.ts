// Track which tab is currently reading
let activeReadingTab: number | null = null;

chrome.runtime.onInstalled.addListener(() => {
  console.log("TTS Reader Extension installed");
});

// Handle keyboard shortcut (Alt+R)
chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-tts") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab.id) return;

      // Get current reading state
      chrome.tabs.sendMessage(
        tab.id,
        { action: "getReadingState" },
        (response) => {
          if (response?.isReading) {
            if (response.isPaused) {
              // Resume
              chrome.tabs.sendMessage(tab.id, { action: "resumeReading" });
            } else {
              // Pause
              chrome.tabs.sendMessage(tab.id, { action: "pauseReading" });
            }
          } else {
            // Start reading
            chrome.tabs.sendMessage(
              tab.id,
              {
                action: "startReading",
                voiceIndex: 0,
                speed: 1,
              },
              (response) => {
                // Handler for response
              }
            );
          }
        }
      );
    });
  }
});

// Handle tab close - clean up
chrome.tabs.onRemoved.addListener((tabId) => {
  if (activeReadingTab === tabId) {
    activeReadingTab = null;
  }
});

console.log("TTS Background service worker ready");