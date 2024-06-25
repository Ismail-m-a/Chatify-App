import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import '../css/Profile.css'; // Reuse the same CSS file

function OtherUserProfile() {
  const [userProfile, setUserProfile] = useState(null);
  const [error, setError] = useState('');
  const { userId } = useParams();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`https://chatify-api.up.railway.app/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('API Response:', response.data); // Add this line
        setUserProfile(Array.isArray(response.data) ? response.data[0] : response.data);
      } catch (error) {
        setError('Failed to fetch user profile');
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, [userId]);

  if (error) {
    return <div className="profile-container"><p className="error">{error}</p></div>;
  }

  if (!userProfile) {
    return <div className="profile-container">Loading...</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <img className="profile-avatar" src={userProfile.avatar} alt={userProfile.username} />
        <p>Name: {userProfile.username}</p>
        <p>Email: {userProfile.email}</p>
        <p className="profile-id">User ID: {userProfile.id}</p>
      </div>
    </div>
  );
}

export default OtherUserProfile;