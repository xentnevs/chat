// Initialize WebSocket and dispatch incoming messages to registered handlers
(function() {
  const roomname = document.body.dataset.roomname;
  let socket;
  const handlers = [];

  function connect() {
    socket = new WebSocket(
      `${location.protocol.replace('http','ws')}//${location.host}/ws/chat/${roomname}/`
    );
    socket.onopen = () => {};
    socket.onerror = () => {};
    socket.onclose = () => setTimeout(connect, 2000);
    socket.onmessage = e => {
      let data;
      try { data = JSON.parse(e.data); } catch(err) { return; }
      handlers.forEach(fn => fn(data));
    };
    window.chatSocket = socket;
    window.sendWS = function(obj) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(obj));
      } else {
        console.warn('Socket not open, retrying...');
        setTimeout(() => window.sendWS(obj), 500);
      }
    };
  }

  // register a callback for incoming WS messages
  window.registerWSHandler = function(fn) {
    if (typeof fn === 'function') handlers.push(fn);
  };

  connect();
})();
