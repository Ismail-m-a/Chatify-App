import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import '../css/Login.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [csrfToken, setCsrfToken] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await axios.patch(`https://chatify-api.up.railway.app/csrf`);
        setCsrfToken(response.data.csrfToken);
        console.log('Fetched CSRF token:', response.data.csrfToken);
      } catch (error) {
        console.error('Failed to fetch CSRF token:', error);
        setError('Failed to fetch CSRF token');
      }
    };

    fetchCsrfToken();
  }, []);

  const decodeJWT = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  const handleLogin = async () => {
    const payload = {
      username,
      password,
      csrfToken
    };

    try {
      const response = await axios.post(`https://chatify-api.up.railway.app/auth/token`, payload);
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);

        const tokenPayload = decodeJWT(response.data.token);
        const userId = tokenPayload.id;

        const userResponse = await axios.get(`https://chatify-api.up.railway.app/users/${userId}`, {
          headers: { Authorization: `Bearer ${response.data.token}` }
        });

        if (userResponse.data) {
          localStorage.setItem('user', JSON.stringify(userResponse.data));
          navigate('/chat');
        } else {
          setError('Failed to fetch user data.');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || 'Failed to login');
    }
  };

  return (
    <div className='container'>
      <h2>Login 🔐</h2>
      <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button onClick={handleLogin}>Login</button>
      {error && <p className='error'>{error}</p>}
      <p>Don't have an account? <Link to="/register">Register</Link></p>
    </div>
  );
}

export default Login;
