// Initialize WebSocket connection with auto-reconnect
(function() {
  const roomname = document.body.dataset.roomname;
  function connect() {
    window.chatSocket = new WebSocket(
      `${location.protocol.replace('http','ws')}//${location.host}/ws/chat/${roomname}/`
    );
    chatSocket.onopen = () => console.log('WebSocket connected');
    chatSocket.onerror = err => console.error('WebSocket error:', err);
    chatSocket.onclose = () => {
      console.warn('WebSocket closed, reconnecting in 2s...');
      setTimeout(connect, 2000);
    };
  }
  // kick off connection
  connect();
})();
