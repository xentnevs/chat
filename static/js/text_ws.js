document.addEventListener('DOMContentLoaded', function() {
  const chatbox = document.getElementById('chatbox');
  const username = document.body.dataset.username;

  // Handle incoming text, edit, delete via WebSocket
  registerWSHandler(function(data) {
    const type = data.type;
    if (type === 'chat_message') {
      const div = document.createElement('div');
      const sent = data.sender === username;
      div.className = 'message ' + (sent ? 'sent' : 'received');
      div.setAttribute('data-message-id', data.message_id);
      div.innerHTML = `<div class="message-inner"><div class="message-content">${data.message}</div><span class="message-time">${data.timestamp}</span></div>`;
      if (window.addDateSeparatorIfNeeded) {
        const today = new Date();
        const dateStr = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');
        window.addDateSeparatorIfNeeded(div, dateStr);
      }
      chatbox.appendChild(div);
      chatbox.scrollTop = chatbox.scrollHeight;
    } else if (type === 'edit_message') {
      const msgEl = chatbox.querySelector(`[data-message-id="${data.message_id}"]`);
      if (msgEl) {
        const contentEl = msgEl.querySelector('.message-content');
        if (contentEl) contentEl.textContent = data.content;
      }
    } else if (type === 'delete_message') {
      const msgEl = chatbox.querySelector(`[data-message-id="${data.message_id}"]`);
      if (msgEl) {
        msgEl.querySelector('.message-inner').innerHTML = '<em>Сообщение удалено</em>';
      }
    }
  });

  // Send text / edit
  const submitBtn = document.getElementById('submit_button');
  const inputField = document.getElementById('my_input');
  submitBtn.addEventListener('click', function(e) {
    e.preventDefault();
    const editingId = submitBtn.dataset.editing;
    const msg = inputField.value.trim();
    if (!msg) return;
    if (editingId) {
      chatSocket.send(JSON.stringify({type: 'edit_message', message_id: editingId, content: msg}));
      delete submitBtn.dataset.editing;
      submitBtn.textContent = 'Отправить';
    } else {
      chatSocket.send(JSON.stringify({message: msg}));
    }
    inputField.value = '';
  });
  inputField.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') { e.preventDefault(); submitBtn.click(); }
  });

  // Context menu for edit/delete on sent messages
  document.addEventListener('contextmenu', function(e) {
    const msgEl = e.target.closest('.message.sent');
    if (msgEl) {
      e.preventDefault();
      const menu = document.getElementById('messageContextMenu');
      menu.style.top = e.pageY + 'px';
      menu.style.left = e.pageX + 'px';
      menu.classList.add('active');
      menu.dataset.messageId = msgEl.dataset.messageId;
    }
  });
  document.addEventListener('click', function(e) {
    const menu = document.getElementById('messageContextMenu');
    if (menu.classList.contains('active') && !e.target.closest('#messageContextMenu')) {
      menu.classList.remove('active');
    }
  });
  document.querySelector('.edit-item').addEventListener('click', function() {
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
  document.querySelector('.delete').addEventListener('click', function() {
    const menu = document.getElementById('messageContextMenu');
    const messageId = menu.dataset.messageId;
    chatSocket.send(JSON.stringify({type: 'delete_message', message_id: messageId}));
    menu.classList.remove('active');
  });
});
