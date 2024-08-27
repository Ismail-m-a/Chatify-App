import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, Button, Container, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faIdBadge, faRightFromBracket, faBars } from '@fortawesome/free-solid-svg-icons';
import '../css/Profile.css';
import { faFacebook, faGithub, faInstagram, faLinkedin, faXTwitter } from '@fortawesome/free-brands-svg-icons';
import '../css/Profile.css';
import { useAuth } from '../AuthContext';

function OtherUserProfile() {
  const [userProfile, setUserProfile] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState('');
  const { userId } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth ();

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

    setTimeout(() => {

      fetchUserProfile();
    }, 1000);

  }, [userId]);

  if (error) {
    return <div className="profile-container"><p className="error">{error}</p></div>;
  }

  if (!userProfile) {
    return (
      <Container className="profile-container d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="text-center">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-2">Loading profile...</p>
        </div>
      </Container>
    );
  }
  
  const handleLogout = () => {
    logout ();
    navigate('/login');
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  return (
    <>
      <div className="profile-container d-flex justify-content-center align-items-center">
        <Card className="profile-card text-center shadow-lg p-4">
        <div className='d-flex justify-content-end align-items-center mb-3'>
            <div className="d-flex justify-content-end">
            <div className="dropdown">
              <div onClick={toggleDropdown} className="dropbtn">
                {/* <span>{user.username}</span> */}
                <FontAwesomeIcon icon={faBars} />
              </div>
              {showDropdown && (
                <div id="myDropdown" className="dropdown-content">
                  <img className="profile-icon" src={userProfile.avatar} alt={userProfile.username} style={{
                        borderRadius: '50%', 
                        border: '2px solid blue', 
                        padding: '5px' 
                    }}/>
                 
                  <Button variant='outline-danger' size="sm" className='me-2 profile-btn' onClick={handleLogout}><FontAwesomeIcon icon={faRightFromBracket} /> Log Out</Button>
                  
                </div>
              )}
            </div>
            </div>
          </div>
          <h2 className="profile-title">Profile information</h2>
          <Card.Body>
            <div className="profile-header d-flex flex-column align-items-center">
              <img className="profile-avatar" src={userProfile.avatar} alt={userProfile.username} />
            </div>
            <div className="text-content text-justify">
              <p><FontAwesomeIcon icon={faUser} /> <strong>Name:</strong> {userProfile.username}</p>
              <p><FontAwesomeIcon icon={faEnvelope} /> <strong>Email:</strong>  {userProfile.email}</p>
              <p className="profile-id"><FontAwesomeIcon icon={faIdBadge} /> <strong>User ID:</strong>  {userProfile.id}</p>
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