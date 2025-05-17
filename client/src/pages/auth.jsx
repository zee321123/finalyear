import React, { useState } from 'react';
import LoginForm from '../components/loginform';
import RegisterForm from '../components/registerform';
import './auth.css'; // ✅ Import auth layout

const AuthPage = () => {
  const [isRegistering, setIsRegistering] = useState(false);

  return (
    <div className="auth-page">
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
