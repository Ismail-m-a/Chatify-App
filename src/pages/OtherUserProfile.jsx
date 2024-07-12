import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, Button, Container, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faIdBadge, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import '../css/Profile.css';
import { faFacebook, faGithub, faInstagram, faLinkedin, faXTwitter } from '@fortawesome/free-brands-svg-icons';

function OtherUserProfile() {
  const [userProfile, setUserProfile] = useState(null);
  const [error, setError] = useState('');
  const { userId } = useParams();
  const navigate = useNavigate();

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
    return <div className="profile-container"><p className="error">{error}</p></div>;
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
  
  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <>
      <div className="profile-container d-flex justify-content-center align-items-center">
        <Card className="profile-card text-center">
        <div className='d-flex justify-content-end'>
            <div className="d-flex justify-content-end">
              <Button variant='outline-danger' className='logout' onClick={handleLogout}><FontAwesomeIcon icon={faRightFromBracket} /> Log Out</Button>
            </div>
          </div>
          <h2 className="profile-title">Profile</h2>
          <Card.Body>
            <div className="profile-header d-flex flex-column align-items-center">
              <img className="profile-avatar" src={userProfile.avatar} alt={userProfile.username} />
            </div>
          <div className="text-content text-center soical-media">
              <p>Welcome to my profile</p>
              <p>Follow me on other social media platforms:</p>
              <div></div>
              <div className="social-icons">
                <a href={`https://www.linkedin.com/in/${userProfile.linkedInId}`} target="_blank" rel="noopener noreferrer">
                  <FontAwesomeIcon icon={faLinkedin} />
                </a>
                <a href={`https://www.twitter.com/${userProfile.twitterId}`} target="_blank" rel="noopener noreferrer">
                  <FontAwesomeIcon icon={faXTwitter} />
                </a>
                <a href={`https://www.facebook.com/${userProfile.facebookId}`} target="_blank" rel="noopener noreferrer">
                  <FontAwesomeIcon icon={faFacebook} />
                </a>
                <a href={`https://www.instagram.com/${userProfile.instagramId}`} target="_blank" rel="noopener noreferrer">
                  <FontAwesomeIcon icon={faInstagram} />
                </a>
                <a href={`https://www.github.com/${userProfile.githubId}`} target="_blank" rel="noopener noreferrer">
                  <FontAwesomeIcon icon={faGithub} />
                </a>
              </div>
          </div>
            <div className="text-content text-justify">
              <p><FontAwesomeIcon icon={faUser} /> Name: {userProfile.username}</p>
              <p><FontAwesomeIcon icon={faEnvelope} /> Email: {userProfile.email}</p>
              <p className="profile-id"><FontAwesomeIcon icon={faIdBadge} /> User ID: {userProfile.id}</p>
            </div>
            <Button 
              variant="info" 
              size="sm" 
              className="mt-3 go-chat" 
              onClick={() => navigate('/chat')}
            >
              Go Chat
            </Button>
          </Card.Body>
        </Card>
      </div>
    </>
  );
}

export default OtherUserProfile;