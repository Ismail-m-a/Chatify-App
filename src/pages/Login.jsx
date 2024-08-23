import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import '../css/Login.css';
import { toast, ToastContainer } from 'react-toastify';
import * as Sentry from '@sentry/react'; // Import Sentry
import { AuthContext } from '../AuthContext'; // Import AuthContext

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [csrfToken, setCsrfToken] = useState('');
  const [error, setError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useContext(AuthContext); // Use login function from AuthContext

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        console.info('Försöker hämta CSRF-token'); // Informationslogg
        const response = await axios.patch(`https://chatify-api.up.railway.app/csrf`);
        setCsrfToken(response.data.csrfToken);
        console.info('CSRF-token hämtad:', response.data.csrfToken); // Informationslogg
      } catch (error) {
        console.error('Misslyckades med att hämta CSRF-token:', error);
        setError('Misslyckades med att hämta CSRF-token');
        Sentry.captureException(error); // Capture error with Sentry
      }
    };

    fetchCsrfToken();
  }, []);

  useEffect(() => {
    if (location.state && location.state.registrationSuccess) {
      console.info('Registrering lyckades, visar meddelande'); // Informationslogg
      toast.info('Welcome, please login your new profile');
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const decodeJWT = (token) => {
    try {
      console.info('Dekodar JWT-token'); // Informationslogg
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Fel vid dekodning av token:', error);
      Sentry.captureException(error); // Capture error with Sentry
      return null;
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();
    if (!trimmedUsername || !trimmedPassword) {
      setError('Ange både användarnamn och lösenord.');
      return;
    }

    console.info('Försöker logga in användare:', trimmedUsername); // Informationslogg

    const payload = {
      username: trimmedUsername,
      password: trimmedPassword,
      csrfToken,
    };

    try {
      const response = await axios.post(`https://chatify-api.up.railway.app/auth/token`, payload);
      if (response.data && response.data.token) {
        console.info('Inloggning lyckades, hämtar användardata'); // Informationslogg
        const token = response.data.token;
        localStorage.setItem('token', token);

        const tokenPayload = decodeJWT(token);
        const userId = tokenPayload.id;
        localStorage.setItem('userId', userId); // Store userId in localStorage

        const userResponse = await axios.get(`https://chatify-api.up.railway.app/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (userResponse.data) {
          console.info('Användardata hämtad, omdirigerar till chatt'); // Informationslogg
          localStorage.setItem('user', JSON.stringify(userResponse.data));

          // Use the login function from AuthContext to update the global user state
          login(userResponse.data);

          const redirectTo = location.state?.from?.pathname || '/chat';
          navigate(redirectTo);

          // Clear input fields after successful login
          setUsername('');
          setPassword('');
        } else {
          setError('Misslyckades med att hämta användardata.');
          Sentry.captureMessage('Misslyckades med att hämta användardata efter inloggning'); // Capture message with Sentry
        }
      }
    } catch (error) {
      console.error('Inloggningsfel:', error);
      setError(error.response?.data?.message || 'Fel användarnamn eller lösenord, försök igen!');
      Sentry.captureException(error); // Capture error with Sentry
    }
  };

  return (
    <>
      <div className="login-body">
        <ToastContainer />
        <h2>Logga in på Chatify</h2>
        <div className='login-container'>
          <form onSubmit={handleLogin}>
            <strong>Användarnamn</strong><input type="text" placeholder="Användarnamn👤" value={username} onChange={(e) => setUsername(e.target.value)} required />
            <strong>Lösenord</strong><input type="password" placeholder="Lösenord🔐" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit">Logga in</button>
          </form>
          {error && <p className='error'>{error}</p>}
          <p>Har du inget konto? <Link to="/register">Registrera</Link></p>
        </div>
        {location.state && location.state.protectedRoute && (
          <div className="alert alert-warning text-center mt-3">
            Vänligen logga in först.
          </div>
        )}
      </div>
    </>
  );
}

export default Sentry.withProfiler(Sentry.withErrorBoundary(Login, { fallback: "Ett fel inträffade" }));
