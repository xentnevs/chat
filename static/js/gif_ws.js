document.addEventListener('DOMContentLoaded', function() {
  const chatbox = document.getElementById('chatbox');
  const username = document.body.dataset.username;
  const chatSocket = window.chatSocket;
  // Receive GIF messages
  chatSocket.addEventListener('message', function(e) {
    const data = JSON.parse(e.data);
    if (data.type === 'gif_message') {
      // Skip if already rendered
      if (chatbox.querySelector(`[data-message-id="${data.message_id}"]`)) return;
      document.querySelectorAll('.temp-gif').forEach(el => el.remove());
      const div = document.createElement('div');
      const sent = data.sender === username;
      div.className = 'message ' + (sent ? 'sent' : 'received');
      div.setAttribute('data-message-id', data.message_id);
      div.innerHTML = `<div class=\"message-inner\"><div class=\"gif-container\"><img src=\"${data.gif_url}\" class=\"gif-content\"></div><span class=\"message-time\">${data.timestamp}</span></div>`;
      
      // Check if we need to add a date separator
      if (window.addDateSeparatorIfNeeded) {
        // Get today's date in YYYY-MM-DD format
        const today = new Date();
        const dateStr = today.getFullYear() + '-' + 
                      String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                      String(today.getDate()).padStart(2, '0');
        window.addDateSeparatorIfNeeded(div, dateStr);
      }
      
      chatbox.appendChild(div);
      chatbox.scrollTop = chatbox.scrollHeight;
    }
  });
});
