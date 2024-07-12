import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { ToastContainer, toast } from 'react-toastify';
import { Button } from 'react-bootstrap';
import 'react-toastify/dist/ReactToastify.css'
import '../css/Register.css';

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [avatars, setAvatars] = useState([]);
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [csrfToken, setCsrfToken] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await axios.patch(`${import.meta.env.VITE_API_URL}csrf`);
        setCsrfToken(response.data.csrfToken);
      } catch (error) {
        setError('Failed to fetch CSRF token');
      }
    };

    fetchCsrfToken();
  }, []);

  const generateRandomAvatars = () => {
    const newAvatars = Array.from({ length: 8 }, () => `https://i.pravatar.cc/300?u=${uuidv4()}`);
    setAvatars(newAvatars);
    setSelectedAvatar(''); // Clear the selected avatar when generating new avatars
  };

  const handleRegister = async () => {
    try {
      const trimmedUsername = username.trim();
      const trimmedPassword = password.trim();
      const trimmedEmail = email.trim();

      if (!trimmedUsername || !trimmedPassword || !trimmedEmail) {
        setError('All fields are required ✍️');
        return;
      }
      const response = await axios.post(`${import.meta.env.VITE_API_URL}auth/register`, {
        username: trimmedUsername,
        password: trimmedPassword,
        email: trimmedEmail,
        avatar: selectedAvatar,
        csrfToken,
      });
      if (response.data) {
        toast.success('Your IMA account has been registered successful!');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
        // navigate('/login'); // Navigate to login page after successful registration
      }
    } catch (error) {
      console.error('Error response:', error.response); // Log the error response for debugging
      if (error.response && error.response.data && error.response.data.error) {
        if (error.response.status === 400) {
          setError('The username or email already exists. <a href="/login">Log in</a>.'); // Specific error message for existing user
        } else {
          setError(error.response.data.error); // Show any other error message from the API
        }
      } else {
        setError('Registration failed. Please try again.');
      }
    }
  };

  return (
    <>
    <ToastContainer />
    <div className='container'>
      <h2>Register</h2>
      <strong>Username</strong> <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
      <strong>Password</strong> <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required/>
      <strong>Email</strong> <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required/>

      <div className="avatar-section">
        {selectedAvatar ? (
          <div className="selected-avatar">
            <h3>Selected Avatar</h3>
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
      <Button variant='secondary' type="button" onClick={generateRandomAvatars}>Generate Avatars</Button>
      <Button variant='success' onClick={handleRegister}>Register</Button>

      {error && <p className='error' dangerouslySetInnerHTML={{ __html: error }} />}

    </div>
    </>
  );
}

export default Register;
