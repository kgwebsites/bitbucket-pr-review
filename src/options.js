// Saves options to chrome.storage
function save_options() {
  const theme = document.getElementById('theme').value;
  chrome.storage.sync.set({theme}, () => {
    // Update status to let user know options were saved.
    const status = document.getElementById('status');
    status.textContent = 'Theme saved.';
    setTimeout(() => status.textContent = '', 750);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get({theme: ''}, ({theme}) => {
    document.getElementById('theme').value = theme;
  });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);