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
  const [generatedAvatars, setGeneratedAvatars] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedSelectedAvatarIndex = localStorage.getItem('selectedAvatarIndex');

    if (storedUser && storedUser !== 'undefined') {
      try {
        const userData = JSON.parse(storedUser) || [];
        if (userData.length > 0 && userData[0] && typeof userData[0] === 'object' && 'id' in userData[0]) {
          setUser(userData[0]);
          setUpdatedUsername(userData[0].username);
          setUpdatedEmail(userData[0].email);
          const userAvatars = userData[0].avatars || [];
          if (storedSelectedAvatarIndex && userAvatars.length > 0) {
            const selectedAvatarIndex = parseInt(storedSelectedAvatarIndex);
            if (selectedAvatarIndex >= 0 && selectedAvatarIndex < userAvatars.length) {
              setSelectedAvatar(userAvatars[selectedAvatarIndex]);
            }
          }
        } else {
          setError('Invalid user data. Please login again.');
        }
      } catch (e) {
        setError('Error parsing user data. Please login again.');
      }
    } else {
      setError('No user found. Please login again.');
    }
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
      return response.data; // Ensure to return the data part of the response
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
        avatar: selectedAvatar,
      };

      if (user && user.id) {
        const response = await updateUser(user.id, updatedData);
        
        if (response) { // Ensure response is defined
          const updatedUserData = response;

          if (updatedUserData && updatedUserData.id) { // Check if updatedUserData is defined and has an id property
            // Update the logged-in user's data in localStorage
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
              const userData = JSON.parse(storedUser);
              const updatedUsers = userData.map((user) => {
                if (user.id === updatedUserData.id) {
                  return updatedUserData;
                }
                return user;
              });
              localStorage.setItem('user', JSON.stringify(updatedUsers));
            }

            setUser(updatedUserData);
            setEditMode(false);
            setError('');
          } else {
            setError('Invalid response from the server.');
          }
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
          <img className="profile-avatar" src={selectedAvatar || user.avatar} alt={user.username} />
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
            <p>Namn: {updatedUsername}</p>
          )}
          {editMode ? (
            <input
              type="email"
              value={updatedEmail}
              onChange={(e) => setUpdatedEmail(e.target.value)}
              placeholder="Update Email"
            />
          ) : (
            <p>E-post: {updatedEmail}</p>
          )}
          <p className="profile-id">User ID: {user.id}</p>
          {editMode ? (
            <button onClick={handleSave}>Save</button>
          ) : (
            <button onClick={handleUpdate}>Update Profile</button>
          )}
        </div>
      </div>
      <div className="delete-profile">
        {editMode ? (
          <button onClick={handleDelete}>Delete Profile</button>
        ) : (
          <button onClick={handleDelete}>Delete Profile</button>
        )}
      </div>
    </>
  );
}

export default Profile;
