document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // Handle Login Form Submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            // Simple validation
            if (!email || !password) {
                utils.showToast('Please fill in all fields', 'error');
                return;
            }

            // Submit request
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Signing In...';

            try {
                const response = await api.post('/auth/login', { email, password });
                
                if (response && response.access_token) {
                    localStorage.setItem('token', response.access_token);
                    localStorage.setItem('user', JSON.stringify(response.user));
                    
                    utils.showToast('Signed in successfully!', 'success');
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1000);
                } else {
                    utils.showToast('Failed to sign in', 'error');
                }
            } catch (error) {
                utils.showToast(error.message || 'Incorrect email or password', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }

    // Handle Register Form Submission
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fullName = document.getElementById('full-name').value;
            const email = document.getElementById('email').value;
            const role = document.getElementById('role').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            // Validations
            if (!fullName || !email || !role || !password || !confirmPassword) {
                utils.showToast('Please fill in all fields', 'error');
                return;
            }

            if (password !== confirmPassword) {
                utils.showToast('Passwords do not match', 'error');
                return;
            }

            if (password.length < 6) {
                utils.showToast('Password must be at least 6 characters long', 'error');
                return;
            }

            // Submit request
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Registering...';

            try {
                const response = await api.post('/auth/register', {
                    email,
                    full_name: fullName,
                    role,
                    password
                });

                if (response) {
                    utils.showToast('Registration successful! Please log in.', 'success');
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 1500);
                }
            } catch (error) {
                utils.showToast(error.message || 'Registration failed. Email might already be taken.', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }
});
