import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Card, Button, Container, Alert, Spinner } from 'react-bootstrap';
import '../css/Profile.css'; // Reuse the same CSS file for additional styling

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
        setUserProfile(Array.isArray(response.data) ? response.data[0] : response.data);
      } catch (error) {
        setError('Failed to fetch user profile');
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, [userId]);

  if (error) {
    return (
      <Container className="profile-container">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (!userProfile) {
    return (
      <Container className="profile-container">
        <Spinner animation="border" role="status">
          <span className="sr-only">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container className="profile-container">
      <Card className="profile-card">
        <Card.Img variant="top" src={userProfile.avatar} alt={userProfile.username} />
        <Card.Body>
          <Card.Title>{userProfile.username}</Card.Title>
          <Card.Text>Email: {userProfile.email}</Card.Text>
          <Card.Text>User ID: {userProfile.id}</Card.Text>
        </Card.Body>
      </Card>
      <Button variant="secondary" onClick={() => window.history.back()}>Go Back</Button>
    </Container>
  );
}

export default OtherUserProfile;
