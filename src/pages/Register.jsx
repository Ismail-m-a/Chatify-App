// Import necessary libraries and components
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { ToastContainer, toast } from 'react-toastify';
import { Button } from 'react-bootstrap';
import 'react-toastify/dist/ReactToastify.css';
import '../css/Register.css';
import * as Sentry from '@sentry/react';  // Import Sentry for error tracking

const API_URL = import.meta.env.VITE_API_URL;
const API_IMAGE_KEY = import.meta.env.VITE_API_IMAGE_URL;

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [avatars, setAvatars] = useState([]);
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [csrfToken, setCsrfToken] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        console.info('Fetching CSRF token');
        const response = await axios.patch(`${API_URL}csrf`);
        setCsrfToken(response.data.csrfToken);
        console.info('CSRF token fetched:', response.data.csrfToken);
      } catch (error) {
        console.error('Failed to fetch CSRF token:', error);
        setError('Failed to fetch CSRF token');
        Sentry.captureException(error);
      }
    };

    fetchCsrfToken();
  }, []);

  const generateRandomAvatars = () => {
    const newAvatars = Array.from({ length: 8 }, () => `https://i.pravatar.cc/300?u=${uuidv4()}`);
    setAvatars(newAvatars);
    setSelectedAvatar(''); // Clear the selected avatar when generating new avatars
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    try {
      const trimmedUsername = username.trim();
      const trimmedPassword = password.trim();
      const trimmedEmail = email.trim();

      if (!trimmedUsername || !trimmedPassword || !trimmedEmail) {
        setError('All fields are required ✍️');
        return;
      }

      const response = await axios.post(`${API_URL}auth/register`, {
        username: trimmedUsername,
        password: trimmedPassword,
        email: trimmedEmail,
        avatar: selectedAvatar || imageUrl,
        csrfToken,
      }, {
        headers: {
          'X-CSRF-Token': csrfToken,
        },
      });

      if (response.data) {
        toast.success('Your profile has been registered successfully!');
        const token = response.data.token;
        localStorage.setItem('token', token);
        setTimeout(() => {
          navigate('/login', { state: { registrationSuccess: true } });
        }, 3000);
      }
    } catch (error) {
      console.error('Error response:', error.response);
      Sentry.captureException(error);
      if (error.response && error.response.data && error.response.data.error) {
        if (error.response.status === 400) {
          setError('The username or email already exists. <a href="/login">Log in</a>.');
        } else {
          setError(error.response.data.error);
        }
      } else {
        setError('Registration failed. Please try again.');
      }
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('key', API_IMAGE_KEY); // Use API key from .env
    formData.append('image', file);

    const apiUrl = 'https://api.imgbb.com/1/upload';

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      const imageUrl = data.data.url;
      setImageUrl(imageUrl);
      toast.success('Image uploaded successfully!');
    } catch (error) {
      console.error('Upload failed:', error);
      Sentry.captureException(error);
      toast.error('Upload failed: ' + error.toString());
    }
  };

  return (
    <>
      <div className='register-container'>
        <ToastContainer />
        <h2>Register to Chatify</h2>
        <form onSubmit={handleRegister}>
          <strong>Username</strong>
          <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
          <strong>Password</strong>
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <strong>Email</strong>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />

          <div className="avatar-section">
            {selectedAvatar ? (
              <div className="selected-avatar">
                <h6>Selected Avatar</h6>
                <img src={selectedAvatar} alt="Selected Avatar" className="avatar-preview" />
              </div>
            ) : (
              <div className="avatar-selection">
                {avatars.map((avatar, index) => (
                  <img
                    key={index}
                    src={avatar}
                    alt="Avatar"
                    className={`avatar ${avatar === selectedAvatar ? 'selected' : ''}`}
                    onClick={() => setSelectedAvatar(avatar)}
                  />
                ))}
              </div>
            )}
          </div>
          {imageUrl && (
            <div className='upload-image'>
              <h6>Uploaded Image:</h6>
              <div className="image-container">
                <img src={imageUrl} alt="Uploaded" />
              </div>
              <p className='image-url'>URL: <a href={imageUrl} target="_blank" rel="noopener noreferrer">{imageUrl}</a></p>
            </div>
          )}
          <div className="image-buttons">
            <Button className='btn-small' variant='secondary' type="button" onClick={generateRandomAvatars}>Generate Avatars</Button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
            <Button onClick={() => fileInputRef.current.click()} className="btn-small">Upload Image</Button>
          </div>
          <Button variant='success' type="submit">Register</Button>
        </form>
        {error && <p className='error' dangerouslySetInnerHTML={{ __html: error }} />}
        <p>Do you already have an account? <Link to="/login">Login</Link></p>
      </div>
    </>
  );
}

export default Sentry.withProfiler(Sentry.withErrorBoundary(Register, { fallback: "An error has occurred" }));
