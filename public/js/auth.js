document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    // Toggle views
    document.getElementById('showRegister')?.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        document.getElementById('formTitle').innerText = 'Create Account';
        document.getElementById('formSubtitle').innerText = 'Join the AquaSmart Network';
    });

    document.getElementById('showLogin')?.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
        document.getElementById('formTitle').innerText = 'Welcome Back';
        document.getElementById('formSubtitle').innerText = 'Login to your centralized dashboard.';
    });

    // Login Handle
    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const data = await apiCall('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            handleAuthSuccess(data);
        } catch (error) {
            // Toast automatically handled in apiCall
        }
    });

    // Register Handle
    registerForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('regName').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const role = document.getElementById('regRole').value;

        try {
            const data = await apiCall('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ name, email, password, role })
            });

            handleAuthSuccess(data);
        } catch (error) {
            // Error handled in API
        }
    });

    const handleAuthSuccess = (data) => {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data));
        showToast(`Welcome ${data.name}! Redirecting...`);
        
        setTimeout(() => {
            window.location.href = `${data.role.toLowerCase()}.html`;
        }, 1000);
    };
});
