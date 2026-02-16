chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "switchTab") {
    const url = msg.url;
    if (!url) return;

    chrome.tabs.query({ url: url }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.update(tabs[0].id, { active: true });
      } else {
        chrome.tabs.create({ url: url });
      }
    });
  }
});
