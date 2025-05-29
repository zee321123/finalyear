// Import necessary hooks and components
import React, { useState } from 'react';
import LoginForm from '../components/loginform'; // Login form componen
import RegisterForm from '../components/registerform'; // Register form component
import './auth.css'; // CSS styles for the authentication page

// Main AuthPage component
const AuthPage = () => {
  const [isRegistering, setIsRegistering] = useState(false);

  return (
    <div className="auth-page">     // Full-page container with animated gradient background
      <div className="auth-container">

        {isRegistering ? <RegisterForm /> : <LoginForm />}
        <button onClick={() => setIsRegistering(!isRegistering)}>
          {isRegistering
            ? 'Already have an account? Login'
            : "Don't have an account? Register"}
        </button>
      </div>
    </div>
  )
};

export default AuthPage;
