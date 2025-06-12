document.addEventListener('DOMContentLoaded', () => {
  const fileBtn = document.getElementById('fileButton');
  const fileInput = document.getElementById('fileInput');
  const roomname = document.body.dataset.roomname;

  fileBtn.onclick = () => fileInput.click();

  fileInput.onchange = async () => {
    const file = fileInput.files[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    form.append('roomname', roomname);
    // upload to Django
    const res = await fetch(window.uploadFileURL, {
      method: 'POST',
      body: form,
      credentials: 'include',
      headers: {
        'X-CSRFToken': document.querySelector('meta[name="csrf-token"]').content
      }
    });
    const data = await res.json();
    if (data.file_url) {
      // send WS event
      window.chatSocket.send(JSON.stringify({
        type: 'file_message',
        file_path: data.file_path,
        file_url: data.file_url,
        filename: data.filename
      }));
    }
    fileInput.value = '';
  };
  
  window.chatSocket.addEventListener('message', event => {
    const data = JSON.parse(event.data);
    if (data.type !== 'file_message') return;
    const chatbox = document.getElementById('chatbox');
    // Skip if already rendered
    if (chatbox.querySelector(`[data-message-id="${data.message_id}"]`)) return;
    const isImage = /\.(png|jpe?g|gif)$/i.test(data.file_url);
    const contentHtml = isImage
      ? `<div class="img-container">
           <img src="${data.file_url}" alt="${data.filename}">
         </div>`
      : `<div class="file-container">
           <a href="${data.file_url}" download="${data.filename}">
             <i class="fas fa-file"></i> ${data.filename}
           </a>
         </div>`;
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message ' +
      (data.sender === document.body.dataset.username ? 'sent' : 'received');
    msgDiv.dataset.messageId = data.message_id;    msgDiv.innerHTML = `
      <div class="message-inner">
        ${contentHtml}
        <span class="message-time">${data.timestamp}</span>
      </div>`;
      
    // Check if we need to add a date separator
    if (window.addDateSeparatorIfNeeded) {
      // Get today's date in YYYY-MM-DD format
      const today = new Date();
      const dateStr = today.getFullYear() + '-' + 
                    String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(today.getDate()).padStart(2, '0');
      window.addDateSeparatorIfNeeded(msgDiv, dateStr);
    }
    
    chatbox.appendChild(msgDiv);
    chatbox.scrollTop = chatbox.scrollHeight;
  });
});
