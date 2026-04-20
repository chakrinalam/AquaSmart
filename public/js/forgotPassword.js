document.addEventListener('DOMContentLoaded', function() {
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const emailInput = document.getElementById('email');

    forgotPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        
        if (!email) {
            showToast('Please enter your email address', 'error');
            return;
        }

        // Show loading state
        const submitButton = forgotPasswordForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Sending...';
        submitButton.disabled = true;

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                showToast('Password reset link sent to your email!', 'success');
                emailInput.value = '';
                
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 3000);
            } else {
                showToast(data.message || 'Failed to send reset link', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Network error. Please try again.', 'error');
        } finally {
            // Reset button state
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    });
});
