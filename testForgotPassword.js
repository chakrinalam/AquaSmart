async function testForgotPassword() {
    try {
        console.log('Testing forgot password API endpoint...');
        
        const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                email: 'cn7827@srmist.edu.in' // Using the existing user email
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

testForgotPassword();
