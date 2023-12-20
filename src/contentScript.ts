
window.addEventListener("message", (event) => {
    console.log("Message received from website")
    if (event.source === window && event.data && event.data.type === "FROM_PAGE") {
        console.log("Message: ", event.data.text);
    }
});

export {}