window.GIPHY_API_KEY = window.GIPHY_API_KEY || 'iwk3auLWkalhPs6hda7OauGxzVZ4A9Ba';

// Fixed GIF functionality for chat application

// Function to directly load GIFs without relying on other code
function loadGifsDirectly() {
  console.log('Loading trending GIFs directly');
  
  // Reset search results
  const resultsContainer = document.getElementById('gifResults');
  if (resultsContainer) {
      resultsContainer.style.display = 'none';
      resultsContainer.innerHTML = '';
  }
  
  const trendingGifsContainer = document.getElementById('trendingGifs');
  if (!trendingGifsContainer) return;

  // Make sure trending container is visible
  trendingGifsContainer.style.display = 'flex';
  trendingGifsContainer.style.flexWrap = 'wrap';
  
  // Check if we already have content in the trending container
  // Only consider valid content (not loading indicators or error messages)
  const hasRealContent = trendingGifsContainer.querySelectorAll('.gif-item').length > 0;
  if (hasRealContent) {
    console.log('Trending GIFs already loaded, found ' + trendingGifsContainer.querySelectorAll('.gif-item').length + ' items');
    return; // Skip loading if we already have GIFs displayed
  }
  
  // Show loading indicator with unique identifier
  const loadingId = 'gif-loading-' + Date.now();
  trendingGifsContainer.innerHTML = `<div id="${loadingId}" class="col-12 text-center my-3"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Загрузка популярных GIF...</p></div>`;
  
  // Use a simpler fetch with explicit timeouts and debug
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
  
  // Log the API key to check if it's available (just mask it partially for security)
  const maskedKey = GIPHY_API_KEY ? 
    GIPHY_API_KEY.substring(0, 4) + '...' + GIPHY_API_KEY.substring(GIPHY_API_KEY.length - 4) : 
    'undefined';
  console.log('Using Giphy API key:', maskedKey);
  
  fetch(`https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=12&rating=g`, {
    signal: controller.signal,
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    },
    cache: 'no-cache' // Prevent caching issues
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
      
      // Check if the API key is missing or invalid
      if (!GIPHY_API_KEY || GIPHY_API_KEY === 'YOUR_GIPHY_API_KEY') {
        errorMessage = 'API ключ Giphy не настроен. Пожалуйста, добавьте действительный ключ.';
      }
      
      trendingGifsContainer.innerHTML = 
        '<div class="col-12 text-center p-3">' +
          '<p class="mb-3">Ошибка загрузки: ' + errorMessage + '</p>' +
          '<button type="button" class="btn btn-outline-primary" onclick="loadGifsDirectly()">Попробовать снова</button>' +
          '<button type="button" class="btn btn-outline-secondary ms-2" onclick="useFallbackGifs()">Использовать резервные GIF</button>' +
          '<p class="mt-3 text-muted">Или введите текст в поле поиска выше для поиска GIF</p>' +
        '</div>';
      
      // Call useFallbackGifs after a short delay if the API fails
      setTimeout(() => {
        if (!trendingGifsContainer.querySelector('.gif-item')) {
          // Only use fallback if no GIFs were loaded
          console.log('API failed, using fallback GIFs');
          useFallbackGifs();
        }
      }, 1000);
    });
}

// Function to search GIFs directly
function searchGifsDirectly(query) {
  console.log('Searching GIFs for:', query);
  
  // Get containers first to avoid redeclarations
  const resultsContainer = document.getElementById('gifResults');
  const trendingContainer = document.getElementById('trendingGifs');
  
  // Handle empty query
  if (!query || query.trim() === '') {
    console.log('Empty search query, showing trending GIFs instead');
    // If query is empty, show trending GIFs instead
    
    if (trendingContainer) {
      trendingContainer.style.display = 'flex';
      trendingContainer.style.flexWrap = 'wrap';
      
      // Hide results container
      if (resultsContainer) {
        resultsContainer.style.display = 'none';
        resultsContainer.innerHTML = ''; // Clear any previous search results
      }
      
      // If trending container is empty, load trending GIFs
      if (!trendingContainer.querySelectorAll('.gif-item').length) {
        loadGifsDirectly();
      }
    }
    return;
  }
  
  // Valid search query - proceed with search
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
    },
    cache: 'no-cache' // Prevent caching issues
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

// Function to open GIF modal with proper visibility of containers
function openGifModal(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  console.log('openGifModal called');
  
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
  
  // Make all GIF items clickable
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
  
  // Reset containers - hide results, show trending
  const resultsContainer = document.getElementById('gifResults');
  const trendingContainer = document.getElementById('trendingGifs');
  
  // Guard containers exist
  if (!resultsContainer || !trendingContainer) {
    console.error('GIF modal containers not found');
    return false;
  }
  
  if (resultsContainer) {
    resultsContainer.style.display = 'none';
    resultsContainer.innerHTML = ''; // Clear any previous search results
  }
  
  if (trendingContainer) {
    trendingContainer.style.display = 'flex';
    trendingContainer.style.flexWrap = 'wrap';
  }
  
  // Load trending GIFs if needed
  if (trendingContainer && trendingContainer.querySelectorAll('.gif-item').length === 0) {
    loadGifsDirectly();
  }
  
  return false;
}

// Function to close the GIF modal
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

// Function to send a GIF message directly
function sendGifDirectly(gifUrl, gifDescription = 'GIF') {
  console.log('Sending GIF directly:', gifUrl, gifDescription);
  
  // Use the existing chatSocket that was initialized at page load
  const payload = JSON.stringify({
    type: 'gif_message',
    gif_url: gifUrl,
    gif_description: gifDescription
  });
  if (window.chatSocket.readyState === WebSocket.OPEN) {
    window.chatSocket.send(payload);
  } else {
    window.chatSocket.addEventListener('open', function() {
      window.chatSocket.send(payload);
    }, { once: true });
  }
}

// Function for displaying GIFs with proper error handling
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

// Function to use fallback GIFs when the API fails
function useFallbackGifs() {
  console.log('Using fallback GIFs');
  const trendingGifsContainer = document.getElementById('trendingGifs');
  if (!trendingGifsContainer) return;
  
  trendingGifsContainer.innerHTML = '';
  
  // Array of fallback GIFs that are publicly available
  const fallbackGifs = [
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNTU0OGY1MjMyMDM3NDdlZGRlZjk1NWJjNzE0YzczYTFkZTg1ZjQzNyZjdD1n/QBd2kLB5qDmysEXre9/giphy.gif',
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOGQ0YzY5MmItMGQzMS00YzA4LWE1MTUtMTA0OTY4NDJlMWUxZmFlMGE4OTBjOWVjZGE3NDI4NTAxM2Y1OGI3M2YyYjA5MSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26BRv0ThflsHCqDDi/giphy.gif',
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZWU5ZGM1YjkwNDA0NDAzMDc4ZGU0ZTFlNWMwNjdhMDgyZTBmMjc0ZSZjdD1n/5ntdy5Ban1dIY/giphy.gif',
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNzJjZDQ4YmMxYjZjYWI5OGVjM2ZhY2FiYmU2OTUwY2ViZWUwYWJmNCZjdD1n/l0Ex6kAKAoFRsFh6M/giphy.gif',
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNGU0MGVlZDc3ZDNiODkwNDViMmM2NzMxZmM3YWUwNGMwNTIzM2QwMSZjdD1n/21GG7oIOAPGvqfjMs6/giphy.gif',
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYWMyMDQ1MTNjMzhiMmZkYzE2ODc4MmY1ZDNjNGNlZGE5NTI4OGIwZiZjdD1n/l4FGIO2vCfJkakBtC/giphy.gif',
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZmIyOGJkNTI1N2ZlZDAzMjRiODhhYmU2MjliMzE0ZTdhNWU3YWZmOSZjdD1n/Cmr1OMJ2FN0B2/giphy.gif',
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMDgzYjJlOTQ4YzIwZDNiMDQ4MTc5MzRkMWYxZTk0NzU3MTA3Y2Q4NyZjdD1n/YmVNzDnboB0RQEpmLr/giphy.gif',
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMDU1NzVmNmYzM2RhZDQyYzVkZmM2OTkwOTRjNzQwN2I0MTIxNGM1NCZjdD1n/w1ZD3uluzYiOs/giphy.gif'
  ];
  
  fallbackGifs.forEach((gifUrl, index) => {
    const col = document.createElement('div');
    col.className = 'col-6 col-md-4 col-lg-3 mb-3';
    
    const gifItem = document.createElement('div');
    gifItem.className = 'gif-item';
    gifItem.style.cursor = 'pointer';
    gifItem.style.borderRadius = '8px';
    gifItem.style.overflow = 'hidden';
    gifItem.style.marginBottom = '10px';
    gifItem.dataset.gifUrl = gifUrl;
    gifItem.dataset.title = `Fallback GIF ${index + 1}`;
    
    // Add loading indicator
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
    img.alt = `Fallback GIF ${index + 1}`;
    img.style.width = '100%';
    img.style.display = 'block';
    
    img.onload = function() {
      loading.remove();
    };
    
    img.onerror = function() {
      loading.remove();
      img.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22200%22%20height%3D%22200%22%20viewBox%3D%220%200%20200%20200%22%3E%3Crect%20fill%3D%22%23ddd%22%20width%3D%22200%22%20height%3D%22200%22%2F%3E%3Ctext%20fill%3D%22%23666%22%20font-family%3D%22sans-serif%22%20font-size%3D%2220%22%20dy%3D%220.35em%22%20text-anchor%3D%22middle%22%20x%3D%22100%22%20y%3D%22100%22%3EОшибка загрузки%3C%2Ftext%3E%3C%2Fsvg%3E';
    };
    
    gifItem.appendChild(img);
    col.appendChild(gifItem);
    trendingGifsContainer.appendChild(col);
    
    // Add click handler
    gifItem.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Fallback GIF clicked:', this.dataset.gifUrl);
      sendGifDirectly(this.dataset.gifUrl);
      closeGifModal();
    };
  });
  
  // Add a message about using fallbacks
  const messageDiv = document.createElement('div');
  messageDiv.className = 'col-12 text-center mt-3';
  messageDiv.innerHTML = '<p class="text-muted small">Используются резервные GIF из-за недоступности Giphy API</p>';
  trendingGifsContainer.appendChild(messageDiv);
}

// Alias legacy inline function names to fixed implementations
window.loadTrendingGifs = loadGifsDirectly;
window.searchGifs = searchGifsDirectly;
window.displayGifs = displayGifsDirectly;
window.sendGifMessage = sendGifDirectly;
window.showGifModalManually = openGifModal;
window.hideGifModalManually = closeGifModal;

// Document ready function for GIF functionality initialization
document.addEventListener('DOMContentLoaded', function() {
  // Add close button handler
  const closeButtons = document.querySelectorAll('#gifModal .btn-close');
  closeButtons.forEach(button => {
    button.onclick = closeGifModal;
  });
  
  // Close modal when clicking outside
  const gifModal = document.getElementById('gifModal');
  if (gifModal) {
    gifModal.addEventListener('click', function(e) {
      if (e.target === gifModal) {
        closeGifModal();
      }
    });
  }
  
  // Handle search button
  const searchButton = document.getElementById('searchGifBtn');
  if (searchButton) {
    searchButton.onclick = function() {
      const searchInput = document.getElementById('gifSearchInput');
      if (searchInput && searchInput.value.trim()) {
        searchGifsDirectly(searchInput.value.trim());
      }
    };
  }
  
  // Handle enter key in search input
  const searchInput = document.getElementById('gifSearchInput');
  if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter' && this.value.trim()) {
        searchGifsDirectly(this.value.trim());
      }
    });
  }
  
  // GIF button click handler
  const gifButton = document.getElementById('gifButton');
  if (gifButton) {
    gifButton.addEventListener('click', function(e) {
      e.preventDefault();
      openGifModal();
    });
  }
});

