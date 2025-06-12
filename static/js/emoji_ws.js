// Handle emoji functionality with API Ninjas
document.addEventListener('DOMContentLoaded', function() {
    // Core variables
    const chatSocket = window.chatSocket;
    const apiKey = 'E+dhnS9zqYq6bEaBkcuCYQ==jXS3CWqav8WrFNgr';
    const username = document.body.dataset.username;
    const chatbox = document.getElementById('chatbox');
    
    // Get references to emoji elements
    const emojiButton = document.getElementById('emojiButton');
    const searchBtn = document.getElementById('emoji-search-btn');
    const searchInput = document.getElementById('emoji-search-input');
    const resultsContainer = document.getElementById('emoji-results');
    const loadingIndicator = document.getElementById('emoji-loading');
    
    function searchEmojis(query) {
        loadingIndicator.style.display = 'block';
        resultsContainer.innerHTML = '';
        
        fetch(`https://api.api-ninjas.com/v1/emoji?name=${encodeURIComponent(query)}`, {
            method: 'GET',
            headers: {
                'X-Api-Key': apiKey,
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            loadingIndicator.style.display = 'none';
            
            if (data && data.length > 0) {
                data.forEach(emoji => {
                    const emojiBtn = document.createElement('button');
                    emojiBtn.className = 'btn btn-light emoji-item';
                    emojiBtn.innerHTML = emoji.character;
                    emojiBtn.dataset.emoji = emoji.character;
                    emojiBtn.dataset.name = emoji.name;
                    emojiBtn.addEventListener('click', () => sendEmoji(emoji));
                    resultsContainer.appendChild(emojiBtn);
                });
            } else {
                resultsContainer.innerHTML = '<p class="text-center w-100">Эмоции не найдены</p>';
            }
        })
        .catch(error => {
            console.error('Error fetching emojis:', error);
            loadingIndicator.style.display = 'none';
            resultsContainer.innerHTML = '<p class="text-center w-100 text-danger">Ошибка при загрузке эмодзи</p>';
        });
    }
    
    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            searchEmojis(query);
        }
    });
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchBtn.click();
        }
    });
    
    // Show some default emojis when the modal is opened
    document.getElementById('emojiModal').addEventListener('shown.bs.modal', () => {
        if (resultsContainer.innerHTML === '') {
            searchEmojis('smile');
        }
    });
    
    // Add support for category buttons
    document.querySelectorAll('.emoji-category').forEach(button => {
        button.addEventListener('click', function() {
            const category = this.dataset.category;
            if (category) {
                searchEmojis(category);
            }
        });
    });
      // Function to send emoji through WebSocket
    function sendEmoji(emoji) {
        const modal = bootstrap.Modal.getInstance(document.getElementById('emojiModal'));
        modal.hide();
        
        // Ensure proper Unicode handling when sending the emoji
        chatSocket.send(JSON.stringify({
            type: 'emoji_message',
            emoji_code: emoji.character,
            emoji_name: emoji.name
        }));
    }      // Handle incoming emoji messages
    chatSocket.addEventListener('message', function(e) {
        const data = JSON.parse(e.data);
        if (data.type === 'emoji_message') {
            const div = document.createElement('div');
            const sent = data.sender === username;
            div.className = 'message ' + (sent ? 'sent' : 'received');
            div.setAttribute('data-message-id', data.message_id);
            
            // Create elements directly instead of using innerHTML for better Unicode support
            const messageInner = document.createElement('div');
            messageInner.className = 'message-inner';
            
            const messageContent = document.createElement('div');
            messageContent.className = 'message-content emoji-message';
            
            const emojiCharacter = document.createElement('span');
            emojiCharacter.className = 'emoji-character';
            // Directly set the Unicode emoji character
            emojiCharacter.textContent = data.emoji_code;
            
            const emojiName = document.createElement('span');
            emojiName.className = 'emoji-name';
            emojiName.textContent = data.message;
            
            const messageTime = document.createElement('span');
            messageTime.className = 'message-time';
            messageTime.textContent = data.timestamp;
            
            messageContent.appendChild(emojiCharacter);
            messageContent.appendChild(emojiName);            messageInner.appendChild(messageContent);
            messageInner.appendChild(messageTime);
            div.appendChild(messageInner);
            
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
