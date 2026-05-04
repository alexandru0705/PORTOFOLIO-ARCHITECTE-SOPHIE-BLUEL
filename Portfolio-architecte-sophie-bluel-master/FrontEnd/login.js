console.log("Login script loaded!");

const loginForm = document.getElementById('login-form');
const errorMessage = document.getElementById('error-message');

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault(); // Prevents the page from refreshing

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('http://localhost:5678/api/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const data = await response.json();
            // Store the token so we can stay logged in
            localStorage.setItem('token', data.token);
            // Redirect to home page
            window.location.href = 'index.html';
        } else {
            // Show the error message we hid earlier
            errorMessage.style.display = 'block';
        }
    } catch (error) {
        errorMessage.classList.remove("hidden"); 
    }
});