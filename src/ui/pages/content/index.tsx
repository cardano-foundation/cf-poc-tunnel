window.addEventListener('message', (event) => {
  console.log('event.data');
  console.log(event);
  console.log(event.data);
  chrome.runtime.sendMessage(event.data, (response) => {
    console.log('response');
    console.log(response);

  });
});

export {};
