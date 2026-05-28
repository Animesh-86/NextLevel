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

    await saveCapture({
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
    saveCapture({
      type: 'link',
      title: request.payload.title,
      rawContent: request.payload.url,
      description: request.payload.description,
      category: request.payload.category,
      urgency: request.payload.urgency,
      tags: request.payload.tags
    }).then(success => {
      sendResponse({ success });
    });
    
    // Return true to indicate we wish to send a response asynchronously
    return true; 
  }
});

async function saveCapture(data) {
  try {
    // We send credentials to ensure NextAuth session cookies are passed along
    const response = await fetch(`${APP_URL}/api/captures`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // This is crucial! It tells Chrome to send your NextLevel login cookies
      // so the API knows who you are without needing a separate API key.
      credentials: 'include',
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      console.error("Failed to save:", await response.text());
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Network error saving capture:", error);
    return false;
  }
}
