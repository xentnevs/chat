// Fix for the displayGifsDirectly function
function displayGifsDirectly(gifs, container) {
  console.log('Displaying GIFs:', gifs.length);
  container.innerHTML = '';
  
  if (!gifs || gifs.length === 0) {
    container.innerHTML = '<div class="col-12 text-center my-4"><p>Нет доступных GIF для отображения</p></div>';
    return;
  }
  
  gifs.forEach((gif, index) => {
    try {
      // Verify gif object structure
      if (!gif || !gif.images || !gif.images.fixed_height || !gif.images.fixed_height.url) {
        console.error('Invalid GIF data structure for item', index, gif);
        return;
      }
      
      const gifUrl = gif.images.fixed_height.url;
      const col = document.createElement('div');
      col.className = 'col-6 col-md-4 col-lg-3 mb-3';
      
      const gifItem = document.createElement('div');
      gifItem.className = 'gif-item';
      gifItem.style.cursor = 'pointer';
      gifItem.style.borderRadius = '8px';
      gifItem.style.overflow = 'hidden';
      gifItem.style.marginBottom = '10px';
      gifItem.style.position = 'relative';
      gifItem.style.minHeight = '100px';
      gifItem.style.background = '#f0f0f0';
      gifItem.style.zIndex = '2002'; // Ensure high z-index
      gifItem.style.pointerEvents = 'auto'; // Ensure clickable
      gifItem.dataset.gifUrl = gifUrl;
      gifItem.dataset.title = gif.title || 'GIF';
      
      // Add loading indicator for each image
      const loading = document.createElement('div');
      loading.className = 'gif-loading';
      loading.style.position = 'absolute';
      loading.style.top = '50%';
      loading.style.left = '50%';
      loading.style.transform = 'translate(-50%, -50%)';
      loading.innerHTML = '<div class="spinner-border spinner-border-sm" role="status"></div>';
      gifItem.appendChild(loading);
      
      const img = document.createElement('img');
      img.src = gifUrl;
      img.alt = gif.title || 'GIF';
      img.style.width = '100%';
      img.style.display = 'block';
      img.style.opacity = '0';
      img.style.transition = 'opacity 0.3s';
      
      // Show image once loaded
      img.onload = function() {
        loading.remove();
        img.style.opacity = '1';
      };
      
      // Handle image errors
      img.onerror = function() {
        loading.remove();
        img.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22200%22%20height%3D%22200%22%20viewBox%3D%220%200%20200%20200%22%3E%3Crect%20fill%3D%22%23ddd%22%20width%3D%22200%22%20height%3D%22200%22%2F%3E%3Ctext%20fill%3D%22%23666%22%20font-family%3D%22sans-serif%22%20font-size%3D%2220%22%20dy%3D%220.35em%22%20text-anchor%3D%22middle%22%20x%3D%22100%22%20y%3D%22100%22%3EОшибка загрузки%3C%2Ftext%3E%3C%2Fsvg%3E';
        img.style.opacity = '1';
      };
      
      gifItem.appendChild(img);
      col.appendChild(gifItem);
      container.appendChild(col);
      
      // Add click handler directly to the GIF item
      gifItem.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('GIF clicked:', this.dataset.gifUrl);
        sendGifDirectly(this.dataset.gifUrl);
        closeGifModal();
      };
      
      // Add touch and mouse interaction feedback
      gifItem.addEventListener('mousedown', function() {
        this.style.transform = 'scale(0.95)';
      });
      
      gifItem.addEventListener('mouseup', function() {
        this.style.transform = 'scale(1)';
      });
      
      gifItem.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
      });
      
      // Add touch events for mobile
      gifItem.addEventListener('touchstart', function(e) {
        this.style.transform = 'scale(0.95)';
      }, {passive: true});
      
      gifItem.addEventListener('touchend', function(e) {
        this.style.transform = 'scale(1)';
        e.preventDefault();
        sendGifDirectly(this.dataset.gifUrl);
        closeGifModal();
      });
      
    } catch (err) {
      console.error('Error creating GIF element:', err);
    }
  });
}

// Fix for the searchGifsDirectly function
function searchGifsDirectly(query) {
  console.log('Searching GIFs for:', query);
  
  if (!query || query.trim() === '') {
    console.log('Empty search query, showing trending GIFs instead');
    // If query is empty, show trending GIFs instead
    const trendingContainer = document.getElementById('trendingGifs');
    if (trendingContainer) {
      trendingContainer.style.display = 'flex';
      trendingContainer.style.flexWrap = 'wrap';
      
      // If trending container is empty, load trending GIFs
      if (trendingContainer.children.length === 0) {
        loadGifsDirectly();
      }
    }
    
    // Hide results container
    const resultsContainer = document.getElementById('gifResults');
    if (resultsContainer) {
      resultsContainer.style.display = 'none';
    }
    return;
  }
  
  const resultsContainer = document.getElementById('gifResults');
  if (!resultsContainer) {
    console.error('GIF results container not found');
    return;
  }
  
  // Show loading indicator with unique ID
  const loadingId = 'search-loading-' + Date.now();
  resultsContainer.innerHTML = `<div id="${loadingId}" class="col-12 text-center my-3"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Поиск GIF для "${query}"...</p></div>`;
  
  // Make the results container visible
  resultsContainer.style.display = 'flex';
  resultsContainer.style.flexWrap = 'wrap';
  
  // Hide trending GIFs when showing search results
  const trendingContainer = document.getElementById('trendingGifs');
  if (trendingContainer) {
    trendingContainer.style.display = 'none';
  }
  
  // Use AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
  
  // API call to Giphy
  fetch(`https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=12&rating=g`, {
    signal: controller.signal,
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  })
    .then(response => {
      clearTimeout(timeoutId);
      console.log('Search API response:', response.status, response.statusText);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(`Ошибка авторизации Giphy API. Проверьте ключ API.`);
        } else if (response.status === 429) {
          throw new Error(`Превышен лимит запросов к Giphy API. Попробуйте позже.`);
        } else {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
      }
      return response.json();
    })
    .then(data => {
      console.log('Search results:', data);
      
      // Always remove loading indicator first
      const loadingElement = document.getElementById(loadingId);
      if (loadingElement) {
        loadingElement.remove();
      }
      
      if (data.data && Array.isArray(data.data)) {
        // Display search results
        displayGifsDirectly(data.data, resultsContainer);
        
        // If no results found
        if (data.data.length === 0) {
          resultsContainer.innerHTML = `
            <div class="col-12 text-center my-4">
              <p>По запросу "${query}" ничего не найдено</p>
              <button type="button" class="btn btn-outline-primary mt-2" onclick="loadGifsDirectly()">Показать популярные GIF</button>
            </div>`;
        } else {
          // Add search summary
          const countDiv = document.createElement('div');
          countDiv.className = 'col-12 text-center mt-2 mb-3';
          countDiv.innerHTML = `<p class="text-muted small">Найдено ${data.data.length} GIF по запросу "${query}"</p>`;
          resultsContainer.prepend(countDiv);
        }
      } else {
        resultsContainer.innerHTML = `
          <div class="col-12 text-center">
            <p>Ошибка получения результатов</p>
            <button type="button" class="btn btn-outline-primary mt-2" onclick="loadGifsDirectly()">Показать популярные GIF</button>
          </div>`;
      }
    })
    .catch(error => {
      console.error('Error searching GIFs:', error);
      
      let errorMessage = error.message || 'Неизвестная ошибка';
      if (error.name === 'AbortError') {
        errorMessage = 'Превышено время ожидания ответа от сервера Giphy.';
      }
      
      resultsContainer.innerHTML = 
        '<div class="col-12 text-center p-3">' +
          '<p class="mb-3">Ошибка поиска: ' + errorMessage + '</p>' +
          '<button type="button" class="btn btn-outline-primary" onclick="searchGifsDirectly(\'' + query.replace(/'/g, "\\'") + '\')">Попробовать снова</button>' +
          '<button type="button" class="btn btn-outline-secondary ms-2" onclick="loadGifsDirectly()">Показать популярные GIF</button>' +
          '<p class="mt-3 text-muted">Если ошибка повторяется, возможно, нужно обновить ключ Giphy API</p>' +
        '</div>';
    });
}

// Fix for the loadGifsDirectly function
function loadGifsDirectly() {
  console.log('Loading trending GIFs directly');
  
  // Reset search results
  const resultsContainer = document.getElementById('gifResults');
  if (resultsContainer) {
      resultsContainer.style.display = 'none';
      resultsContainer.innerHTML = '';
  }
  
  const trendingGifsContainer = document.getElementById('trendingGifs');
  if (trendingGifsContainer) {
    // Make sure trending container is visible
    trendingGifsContainer.style.display = 'flex';
    trendingGifsContainer.style.flexWrap = 'wrap';
    
    // Check if we already have content in the trending container
    if (trendingGifsContainer.children.length > 0 && !trendingGifsContainer.querySelector('.text-center')) {
      console.log('Trending GIFs already loaded, skipping fetch');
      return; // Skip loading if we already have GIFs displayed
    }
    
    // Show loading indicator with unique identifier
    const loadingId = 'gif-loading-' + Date.now();
    trendingGifsContainer.innerHTML = `<div id="${loadingId}" class="col-12 text-center my-3"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Загрузка популярных GIF...</p></div>`;
    
    // Use a simpler fetch with explicit timeouts and debug
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    fetch(`https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=12&rating=g`, {
      signal: controller.signal,
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })
      .then(response => {
        clearTimeout(timeoutId);
        console.log('Giphy API response:', response.status, response.statusText);
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error(`Ошибка авторизации Giphy API (код 401). Проверьте ключ API.`);
          } else if (response.status === 429) {
            throw new Error(`Превышен лимит запросов к Giphy API (код 429). Попробуйте позже.`);
          } else {
            throw new Error(`Ошибка при запросе к Giphy API: ${response.status}`);
          }
        }
        return response.json();
      })
      .then(data => {
        console.log('Trending GIFs loaded, data structure:', data);
        
        // Always remove loading indicator first
        const loadingIndicator = document.getElementById(loadingId);
        if (loadingIndicator) {
          loadingIndicator.remove();
        }
        
        if (data && data.data && Array.isArray(data.data)) {
          // Debug data format
          if (data.data.length > 0) {
            console.log('First GIF data sample:', data.data[0]);
          }
          
          displayGifsDirectly(data.data, trendingGifsContainer);
        } else {
          trendingGifsContainer.innerHTML = '<div class="col-12 text-center p-3">Не удалось загрузить GIF: неверный формат данных</div>';
          console.error('Invalid data format from Giphy API:', data);
        }
      })
      .catch(error => {
        console.error('Error loading GIFs:', error);
        
        let errorMessage = error.message || 'Неизвестная ошибка';
        if (error.name === 'AbortError') {
          errorMessage = 'Превышено время ожидания ответа от сервера Giphy.';
        }
        
        trendingGifsContainer.innerHTML = 
          '<div class="col-12 text-center p-3">' +
            '<p class="mb-3">Ошибка загрузки: ' + errorMessage + '</p>' +
            '<button type="button" class="btn btn-outline-primary" onclick="loadGifsDirectly()">Попробовать снова</button>' +
            '<button type="button" class="btn btn-outline-secondary ms-2" onclick="useFallbackGifs()">Использовать резервные GIF</button>' +
            '<p class="mt-3 text-muted">Или введите текст в поле поиска выше для поиска GIF</p>' +
          '</div>';
      });
  }
}

// Fix for the sendGifDirectly function
function sendGifDirectly(gifUrl) {
  console.log('Sending GIF directly:', gifUrl);
  
  // Use the existing chatSocket that was initialized at page load
  if (window.chatSocket && chatSocket.readyState === WebSocket.OPEN) {
    // Send the GIF message
    chatSocket.send(JSON.stringify({
      type: 'gif_message',
      gif_url: gifUrl,
      gif_description: 'GIF',
      username: document.querySelector('[data-username]')?.dataset.username || '',
      room_name: document.querySelector('[data-roomname]')?.dataset.roomname || ''
    }));
    
    // Add temporary visual feedback
    const chatbox = document.querySelector("#chatbox");
    if (chatbox) {
      const tempDiv = document.createElement("div");
      tempDiv.className = "message sent temp-gif";
      tempDiv.innerHTML = `<div class="message-inner">
        <div class="gif-container">
          <img src="${gifUrl}" alt="GIF" class="gif-content" onload="this.parentElement.style.background='none'">
        </div>
        <div class="message-info">
          <span class="message-time">Отправка...</span>
        </div>
      </div>`;
      chatbox.appendChild(tempDiv);
      chatbox.scrollTop = chatbox.scrollHeight;
    }
    
    return true;
  } else {
    console.error('WebSocket is not open. Cannot send GIF.');
    alert('Ошибка соединения. Не удалось отправить GIF.');
    return false;
  }
}

// Fix for the openGifModal function
function openGifModal(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  console.log('openGifModal called directly');
  
  const gifModalElement = document.getElementById('gifModal');
  if (!gifModalElement) {
    console.error('GIF modal element not found');
    return;
  }
  
  // Show modal directly using DOM manipulation
  gifModalElement.style.display = 'block';
  gifModalElement.classList.add('show');
  document.body.classList.add('modal-open');
  
  // Make sure the modal has proper z-index and pointer events
  gifModalElement.style.zIndex = '2000';
  gifModalElement.style.pointerEvents = 'auto';
  
  // Create backdrop if needed
  let backdrop = document.querySelector('.modal-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop fade show';
    document.body.appendChild(backdrop);
  }
  
  // Make sure all the GIF items in the modal will have proper clickability
  setTimeout(() => {
    const gifItems = document.querySelectorAll('.gif-item');
    gifItems.forEach(item => {
      item.style.zIndex = '2002';
      item.style.pointerEvents = 'auto';
      item.style.position = 'relative';
      
      // Ensure click event is properly attached
      if (!item.onclick) {
        item.onclick = function(e) {
          e.preventDefault();
          e.stopPropagation();
          console.log('GIF clicked (from openGifModal):', this.dataset.gifUrl);
          sendGifDirectly(this.dataset.gifUrl);
          closeGifModal();
        };
      }
    });
  }, 300);
  
  // Clear search input
  const searchInput = document.getElementById('gifSearchInput');
  if (searchInput) {
    searchInput.value = '';
  }
  
  // Reset containers
  const resultsContainer = document.getElementById('gifResults');
  const trendingContainer = document.getElementById('trendingGifs');
  
  if (resultsContainer) {
    resultsContainer.style.display = 'none';
  }
  
  if (trendingContainer) {
    trendingContainer.style.display = 'flex';
    trendingContainer.style.flexWrap = 'wrap';
  }
  
  // Load GIFs immediately - but only if trending container is empty
  if (trendingContainer && (!trendingContainer.children.length || trendingContainer.querySelector('.text-center'))) {
    loadGifsDirectly();
  }
  
  return false;
}

// Fix for the closeGifModal function
function closeGifModal() {
  console.log('Closing GIF modal');
  
  const gifModalElement = document.getElementById('gifModal');
  if (gifModalElement) {
    gifModalElement.style.display = 'none';
    gifModalElement.classList.remove('show', 'manual-show');
    document.body.classList.remove('modal-open');
    
    // Reset search input
    const searchInput = document.getElementById('gifSearchInput');
    if (searchInput) {
      searchInput.value = '';
    }
    
    // Show trending GIFs again for next time the modal opens
    const resultsContainer = document.getElementById('gifResults');
    const trendingContainer = document.getElementById('trendingGifs');
    
    if (resultsContainer) {
      resultsContainer.style.display = 'none';
    }
    
    if (trendingContainer) {
      trendingContainer.style.display = 'flex';
    }
    
    // Remove backdrop
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) {
      backdrop.remove();
    }
  }
}
