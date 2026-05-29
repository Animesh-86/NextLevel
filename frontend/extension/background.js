// The URL of your NextLevel application
// Change this to your production URL when you deploy!
const APP_URL = "http://localhost:3000";

// Set up context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "save-to-nextlevel",
    title: "Save selected text to NextLevel",
    contexts: ["selection"]
  });
});

// Handle context menu clicks (saving highlighted text)
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "save-to-nextlevel") {
    const selectedText = info.selectionText;
    const pageUrl = tab.url;
    const pageTitle = tab.title;

    await enqueueCapture({
      type: 'text',
      title: `Highlight from: ${pageTitle}`,
      rawContent: selectedText,
      description: `Source: ${pageUrl}`
    });
  }
});

// Handle messages from the popup (saving links)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "SAVE_LINK") {
    enqueueCapture({
      type: 'link',
      title: request.payload.title,
      rawContent: request.payload.url,
      description: request.payload.description,
      category: request.payload.category,
      urgency: request.payload.urgency,
      tags: request.payload.tags
    }).then(() => {
      sendResponse({ success: true, queued: true });
    });
    return true; 
  }
});

// Alarm listener to retry flushing the queue
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "retryFlush") {
    flushQueue();
  }
});

async function enqueueCapture(data) {
  const result = await chrome.storage.local.get({ captureQueue: [] });
  const queue = result.captureQueue;
  queue.push(data);
  await chrome.storage.local.set({ captureQueue: queue });
  console.log(`Queued capture. Queue size: ${queue.length}`);
  
  // Attempt to flush immediately
  flushQueue();
}

let isFlushing = false;

async function flushQueue() {
  if (isFlushing) return;
  isFlushing = true;

  try {
    const result = await chrome.storage.local.get({ captureQueue: [] });
    let queue = result.captureQueue;

    if (queue.length === 0) {
      chrome.alarms.clear("retryFlush");
      isFlushing = false;
      return;
    }

    const cookie = await chrome.cookies.get({ url: APP_URL, name: 'token' });
    if (!cookie || !cookie.value) {
      console.error("No authentication token found. Please log in to NextLevel.");
      // We don't retry automatically for auth failures, but the item stays in queue
      isFlushing = false;
      return;
    }

    // Process items one by one
    while (queue.length > 0) {
      const item = queue[0];
      
      try {
        const response = await fetch(`${APP_URL}/api/captures`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${cookie.value}`
          },
          body: JSON.stringify(item)
        });

        if (response.ok) {
          queue.shift(); // Remove successful item
          await chrome.storage.local.set({ captureQueue: queue });
          console.log("Successfully saved a capture from the queue.");
        } else {
          console.error("Failed to save capture, server responded with:", response.status);
          throw new Error("Server error"); // Trigger catch block to retry later
        }
      } catch (error) {
        console.warn("Network error or server asleep. Scheduling retry in 1 minute.");
        chrome.alarms.create("retryFlush", { delayInMinutes: 1 });
        break; // Stop processing and wait for the alarm
      }
    }
  } finally {
    isFlushing = false;
  }
}
