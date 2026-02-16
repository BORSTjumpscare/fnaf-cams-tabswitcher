chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "switchTab") {
        chrome.tabs.update({ url: msg.url });
    }
});
