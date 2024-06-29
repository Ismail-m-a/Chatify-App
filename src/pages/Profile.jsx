import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import '../css/Profile.css';

function Profile() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [updatedUsername, setUpdatedUsername] = useState('');
  const [updatedEmail, setUpdatedEmail] = useState('');
  const [updatedPassword, setUpdatedPassword] = useState('');
  const [generatedAvatars, setGeneratedAvatars] = useState([]);
  const navigate = useNavigate();

  const loadUserData = () => {
    const storedUser = localStorage.getItem('user');

    if (storedUser && storedUser !== 'undefined') {
      try {
        const userData = JSON.parse(storedUser) || [];
        if (userData.length > 0 && userData[0] && typeof userData[0] === 'object' && 'id' in userData[0]) {
          const currentUser = userData[0];
          setUser(currentUser);
          setUpdatedUsername(currentUser.username);
          setUpdatedEmail(currentUser.email);
          setUpdatedPassword(currentUser.password);
          setSelectedAvatar(currentUser.avatar);
        } else {
          setError('Invalid user data. Please login again.');
        }
      } catch (e) {
        setError('Error parsing user data. Please login again.');
      }
    } else {
      setError('No user found. Please login again.');
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const updateUser = async (userId, updatedData) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No token found. Please login again.');
      return;
    }

    try {
      const requestData = {
        userId,
        updatedData,
      };

      const response = await axios.put('https://chatify-api.up.railway.app/user', requestData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      console.log('Response from server:', response);
      return response;
    } catch (error) {
      if (error.response && error.response.status === 400) {
        setError('Invalid data. Please check the updated fields and try again.');
      } else {
        setError('Failed to update user data.');
      }
      console.error('Error updating user data:', error);
      throw error;
    }
  };

  const deleteUser = async (userId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No token found. Please login again.');
      return;
    }

    try {
      await axios.delete(`https://chatify-api.up.railway.app/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      localStorage.clear();
      navigate('/login');
    } catch (error) {
      setError('Failed to delete user.');
      console.error('Error deleting user:', error);
    }
  };

  const handleUpdate = () => {
    setEditMode(true);
  };

  const handleSave = async () => {
    try {
      const updatedData = {
        username: updatedUsername,
        email: updatedEmail,
        password: updatedPassword,
        avatar: selectedAvatar || user.avatar,
      };

      if (user && user.id) {
        const response = await updateUser(user.id, updatedData);
        
        if (response && response.status === 200) {
          const updatedUserData = {
            ...user,
            ...updatedData,
          };

          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const userData = JSON.parse(storedUser);
            const updatedUsers = userData.map((u) => u.id === user.id ? updatedUserData : u);
            localStorage.setItem('user', JSON.stringify(updatedUsers));
          }

          setUser(updatedUserData);
          setUpdatedUsername(updatedUserData.username);
          setUpdatedEmail(updatedUserData.email);
          setUpdatedPassword(updatedUserData.password);
          setSelectedAvatar(updatedUserData.avatar);
          setEditMode(false);
          setError('');
          
          loadUserData();
        } else {
          setError('Invalid response from the server.');
        }
      } else {
        setError('Invalid user data.');
      }
    } catch (error) {
      setError('Failed to update user data.');
      console.error('Error updating user data:', error);
    }
  };

  const handleDelete = async () => {
    if (user && user.id) {
      await deleteUser(user.id);
      navigate('/login');
    } else {
      setError('Invalid user data.');
    }
  };

  const generateAvatars = () => {
    const newAvatarUrls = Array.from({ length: 5 }, () => `https://i.pravatar.cc/300?u=${uuidv4()}`);
    setGeneratedAvatars(newAvatarUrls);
  };

  const selectAvatar = (avatarUrl) => {
    setSelectedAvatar(avatarUrl);
  };

  if (error) {
    return <div className="profile-container"><p className="error">{error}</p></div>;
  }

  if (!user) {
    return <div className="profile-container">Loading...</div>;
  }

  return (
    <>
      <div className="profile-container">
        <div className="profile-card">
          <img className="profile-avatar" src={user.avatar} alt={user.username} />
          {editMode && <button onClick={generateAvatars}>Generate Avatar</button>}
          {editMode && generatedAvatars.length > 0 && (
            <div className="generated-avatars">
              {generatedAvatars.map((avatarUrl, index) => (
                <img
                  key={index}
                  src={avatarUrl}
                  alt={`Generated Avatar ${index}`}
                  onClick={() => selectAvatar(avatarUrl)}
                  className={selectedAvatar === avatarUrl ? 'selected' : ''}
                />
              ))}
            </div>
          )}
          {editMode ? (
            <input
              type="text"
              value={updatedUsername}
              onChange={(e) => setUpdatedUsername(e.target.value)}
              placeholder="Update Username"
            />
          ) : (
            <p>Namn: {user.username}</p>
          )}
          {editMode ? (
            <input
              type="email"
              value={updatedEmail}
              onChange={(e) => setUpdatedEmail(e.target.value)}
              placeholder="Update Email"
            />
          ) : (
            <p>E-post: {user.email}</p>
          )}
          {editMode? (
            <input
              type="password"
              value={updatedPassword}
              onChange={(e) => setUpdatedPassword(e.target.value)}
              placeholder="Update Password"
            />
          ) : ( 
            // <p>Lösenord: {user.password.substring(0, 5)}...</p>
            // <p>Lösenord: {updatedPassword.replace(/./g, '*')} {/* Masked representation */}</p>
            // <p>Lösenord: {updatedPassword.slice(0, 6) + '*'.repeat(updatedPassword.length - 6)}</p>
            <p>Lösenord: {updatedPassword.slice(0, 6).replace(/./g, '*')}</p>

            
          )}
          <p className="profile-id">User ID: {user.id}</p>
          {editMode ? (
            <>
              <button onClick={handleSave}>Save</button>
              <button onClick={() => setEditMode(false)}>Cancel</button>
            </>
          ) : (
            <button onClick={handleUpdate}>Update Profile</button>
          )}
          <button onClick={() => window.history.back()}>Go Back</button>
        </div>
      </div>
      <div className="delete-profile">
        <button onClick={handleDelete}>Delete Profile</button>
      </div>
    </>
  );
}

export default Profile;