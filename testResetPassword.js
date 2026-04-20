async function testResetPassword() {
    try {
        console.log('Testing reset password API endpoint...');
        
        // Use the token from the email simulation (you can see it in server logs)
        const testToken = '59ca18af06de116afcaea90ebb3d84d5a2d38582';
        const newPassword = 'newpassword123';
        
        const response = await fetch('http://localhost:5000/api/auth/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                token: testToken,
                password: newPassword 
            })
        });

        console.log('Response status:', response.status);
        
        const data = await response.text();
        console.log('Response body:', data);
        
    } catch (error) {
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

testResetPassword();
