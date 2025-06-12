// filepath: static/js/message_handler.js
// Handles incoming WebSocket messages (text edits, deletes, new messages)
document.addEventListener('DOMContentLoaded', () => {
  const chatbox = document.getElementById('chatbox');

  window.registerWSHandler(function(data) {
    switch (data.type) {
      case 'chat_message': {
        // skip if already appended
        if (chatbox.querySelector(`[data-message-id="${data.message_id}"]`)) break;
        const div = document.createElement('div');
        const sent = data.sender === document.body.dataset.username;
        div.className = 'message ' + (sent ? 'sent' : 'received');
        div.setAttribute('data-message-id', data.message_id);
        // build message HTML
        div.innerHTML = `
          <div class="message-inner">
            <div class="message-content">${data.message}</div>
            <span class="message-time">${data.timestamp}</span>
          </div>
          ${sent ? `
          <div class="message-actions">
            <button class="delete-btn" onclick="deleteMessage(${data.message_id})">
              <i class="fas fa-trash"></i>
            </button>
          </div>
          ` : ''}`;
        if (window.addDateSeparatorIfNeeded) {
          const today = new Date();
          const dateStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
          window.addDateSeparatorIfNeeded(div, dateStr);
        }
        chatbox.appendChild(div);
        chatbox.scrollTop = chatbox.scrollHeight;
        break;
      }
      case 'edit_message': {
        const msgEl = chatbox.querySelector(`[data-message-id="${data.message_id}"]`);
        if (msgEl) {
          const contentEl = msgEl.querySelector('.message-content');
          if (contentEl) contentEl.textContent = data.content;
        }
        break;
      }
      case 'delete_message': {
        const msgEl = chatbox.querySelector(`[data-message-id="${data.message_id}"]`);
        if (msgEl) msgEl.remove();
        break;
      }
      default:
        // other message types handled by their own modules
        break;
    }
  });
});
