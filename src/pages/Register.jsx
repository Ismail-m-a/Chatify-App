import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
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
    // generateRandomAvatars();
  }, []);

  const generateRandomAvatars = () => {
    const newAvatars = Array.from({ length: 5 }, () => `https://i.pravatar.cc/300?u=${uuidv4()}`);
    setAvatars(newAvatars);
    setSelectedAvatar(''); // Clear the selected avatar when generating new avatars
  };

  const handleRegister = async () => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}auth/register`, {
        username,
        password,
        email,
        avatar: selectedAvatar,
        csrfToken,
      });
      if (response.data) {
        alert('Registration successful!');
        localStorage.setItem('selectedAvatar', selectedAvatar); // Store the selected avatar
        navigate('/profile'); // Change to '/profile' if that's your profile page route
      }
    } catch (error) {
      setError(error.response.data.message);
    }
  };

  return (
    <div className='container'>
      <h2>Register</h2>
      <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />

      <div className="avatar-section">
        {selectedAvatar ? (
          <div className="selected-avatar">
            <h3>Selected Avatar:</h3>
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
        <button type="button" onClick={generateRandomAvatars}>Generate Avatars</button>
      </div>

      <button onClick={handleRegister}>Register</button>
      {error && <p className='error'>{error}</p>}
    </div>
  );
}

export default Register;
