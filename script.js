// script.js

// Function to show the popup with the given image
function showPopup(imageSrc) {
    const popup = document.getElementById('popup');
    const popupImage = document.getElementById('popup-image');
    popupImage.src = imageSrc; // Set the image source
    popup.style.display = 'block'; // Show the popup
    document.body.classList.add('popup-active'); // Add class to body to disable scrolling and darken background
}

// Function to hide the popup
function hidePopup() {
    const popup = document.getElementById('popup');
    popup.style.display = 'none'; // Hide the popup
    document.body.classList.remove('popup-active'); // Remove class to re-enable scrolling and restore background
}

// Function to redirect the user to a specific URL in a new window
function redirectTo(url) {
    window.open(url, '_blank'); // Opens the URL in a new tab or window
}