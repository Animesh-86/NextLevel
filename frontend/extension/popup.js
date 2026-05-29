document.addEventListener('DOMContentLoaded', async () => {
  // Get current tab info
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  document.getElementById('title').value = tab.title || '';
  document.getElementById('url').value = tab.url || '';

  document.getElementById('saveBtn').addEventListener('click', async () => {
    const title = document.getElementById('title').value;
    const url = document.getElementById('url').value;
    const notes = document.getElementById('notes').value;
    const category = document.getElementById('category').value;
    const urgency = document.getElementById('urgency').value;
    const tagsInput = document.getElementById('tags').value;
    const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(Boolean) : [];
    
    const btnText = document.getElementById('btnText');
    const loader = document.getElementById('loader');
    const status = document.getElementById('status');
    const saveBtn = document.getElementById('saveBtn');

    // UI Loading state
    btnText.style.display = 'none';
    loader.style.display = 'inline-block';
    saveBtn.disabled = true;

    try {
      // Send message to background script to handle the actual API call
      // Background scripts can handle cross-origin requests and cookies better
      chrome.runtime.sendMessage(
        { 
          action: "SAVE_LINK", 
          payload: { title, url, description: notes, category, urgency, tags } 
        }, 
        (response) => {
          loader.style.display = 'none';
          
          if (response && response.success) {
            status.style.display = 'block';
            status.innerText = response.queued ? '✅ Queued for background saving!' : '✅ Saved successfully!';
            setTimeout(() => window.close(), 1500);
          } else {
            btnText.style.display = 'inline';
            saveBtn.disabled = false;
            status.style.display = 'block';
            status.style.color = '#ef4444'; // Red 500
            status.innerText = '❌ Failed to save. Are you logged in?';
          }
        }
      );
    } catch (error) {
      console.error(error);
      btnText.style.display = 'inline';
      loader.style.display = 'none';
      saveBtn.disabled = false;
    }
  });
});
