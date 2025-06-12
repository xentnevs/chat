// filepath: static/js/message_actions.js
// Handles sending new messages, edits, and deletions via WebSocket

document.addEventListener('DOMContentLoaded', () => {
  const submitBtn = document.getElementById('submit_button');
  const inputField = document.getElementById('my_input');
  const chatbox = document.getElementById('chatbox');

  // Send new message or edit existing one
  submitBtn.addEventListener('click', e => {
    e.preventDefault();
    const msg = inputField.value.trim();
    if (!msg) return;

    const editingId = submitBtn.dataset.editing;
    if (editingId) {
      sendWS({ type: 'edit_message', message_id: editingId, content: msg });
      // Optimistically update the message content in the UI
      const msgEl = chatbox.querySelector(`[data-message-id="${editingId}"]`);
      if (msgEl) {
        const contentEl = msgEl.querySelector('.message-content');
        if (contentEl) contentEl.textContent = msg;
      }
      delete submitBtn.dataset.editing;
      submitBtn.textContent = 'Отправить';
    } else {
      sendWS({ type: 'chat_message', message: msg });
    }
    inputField.value = '';
  });

  inputField.addEventListener('keypress', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitBtn.click();
    }
  });

  // Context menu for edit/delete on sent messages
  document.addEventListener('contextmenu', e => {
    const msgEl = e.target.closest('.message.sent');
    if (!msgEl) return;
    e.preventDefault();
    const menu = document.getElementById('messageContextMenu');
    menu.style.top = e.pageY + 'px';
    menu.style.left = e.pageX + 'px';
    menu.classList.add('active');
    menu.dataset.messageId = msgEl.dataset.messageId;
  });

  document.addEventListener('click', e => {
    const menu = document.getElementById('messageContextMenu');
    if (menu.classList.contains('active') && !e.target.closest('#messageContextMenu')) {
      menu.classList.remove('active');
    }
  });

  // Edit action
  document.querySelector('.edit-item').addEventListener('click', () => {
    const menu = document.getElementById('messageContextMenu');
    const messageId = menu.dataset.messageId;
    const msgEl = chatbox.querySelector(`[data-message-id="${messageId}"]`);
    const content = msgEl.querySelector('.message-content').textContent;
    inputField.value = content;
    inputField.focus();
    submitBtn.textContent = 'Сохранить';
    submitBtn.dataset.editing = messageId;
    menu.classList.remove('active');
  });

  // Delete action
  document.querySelector('.delete').addEventListener('click', () => {
    const menu = document.getElementById('messageContextMenu');
    const messageId = menu.dataset.messageId;
    // Remove element immediately
    const msgEl = chatbox.querySelector(`[data-message-id="${messageId}"]`);
    if (msgEl) msgEl.remove();
    sendWS({ type: 'delete_message', message_id: messageId });
    menu.classList.remove('active');
  });

  // Inline delete button handling
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const msgEl = e.target.closest('.message');
      const messageId = msgEl.dataset.messageId;
      // Remove element immediately
      msgEl.remove();
      // Notify server
      sendWS({ type: 'delete_message', message_id: messageId });
    });
  });
});

// Expose deleteMessage for inline delete buttons
window.deleteMessage = function(messageId) {
  // Remove element immediately
  const msgEl = document.querySelector(`[data-message-id=\"${messageId}\"]`);
  if (msgEl) msgEl.remove();
  window.sendWS({ type: 'delete_message', message_id: messageId });
};
