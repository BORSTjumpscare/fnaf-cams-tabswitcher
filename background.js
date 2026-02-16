chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "switchTabToUrl") {
        chrome.tabs.query({}, tabs => {
            const existing = tabs.find(t => t.url && t.url.startsWith(msg.url));
            if (existing) {
                chrome.tabs.update(existing.id, { active: true });
            } else {
                chrome.tabs.create({ url: msg.url });
            }
        });
    }
});
