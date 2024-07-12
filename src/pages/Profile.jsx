import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Button, Container, Spinner, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faPenToSquare, faTrash, faEnvelope, faLock, faIdBadge, faRightFromBracket, faCaretDown, faBars } from '@fortawesome/free-solid-svg-icons';
import { faFacebook, faGithub, faInstagram, faLinkedin, faXTwitter } from '@fortawesome/free-brands-svg-icons';
import { faUser as faRegularUser } from '@fortawesome/free-regular-svg-icons';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const loadUserData = () => {
    setIsLoading(true);
    const storedUser = localStorage.getItem('user');

    setTimeout(() => {
      if (storedUser && storedUser !== 'undefined') {
        try {
          const userData = JSON.parse(storedUser) || [];
          if (userData.length > 0 && userData[0] && typeof userData[0] === 'object' && 'id' in userData[0]) {
            console.log('Stored User:', storedUser); // Debug log
console.log('Parsed User Data:', userData); // Debug log
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
      setIsLoading(false);
    }, 1000); // 1 second delay (adjust as needed)
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
      toast.info('Your profile will be deleted permanently.');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
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
        avatar: selectedAvatar || user.avatar,
      };
  
      if (updatedPassword && updatedPassword !== user.password) {
        updatedData.password = updatedPassword;
      }
  
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
    } else {
      setError('Invalid user data.');
    }
  };

  const handleCloseDeleteModal = () => setShowDeleteModal(false);
  const handleShowDeleteModal = () => setShowDeleteModal(true);

  const generateAvatars = () => {
    const newAvatarUrls = Array.from({ length: 6 }, () => `https://i.pravatar.cc/300?u=${uuidv4()}`);
    setGeneratedAvatars(newAvatarUrls);
  };

  const selectAvatar = (avatarUrl) => {
    setSelectedAvatar(avatarUrl);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  if (isLoading) {
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

  if (error) {
    return <div className="profile-container"><p className="error">{error}</p></div>;
  }

  if (!user) {
    return (
      <Container className="profile-container">
        <p>No user data available. Please log in again.</p>
      </Container>
    );
  }

  return (
    <>
      <ToastContainer />
      <div className="profile-container d-flex justify-content-center align-items-center">
        <Card className="profile-card text-center">
          <div className='d-flex justify-content-end'>
            <div className="d-flex justify-content-end">
            <div className="dropdown">
              <div onClick={toggleDropdown} className="dropbtn">
                {/* <span>{user.username}</span> */}
                <FontAwesomeIcon icon={faBars} />
              </div>
              {showDropdown && (
                <div id="myDropdown" className="dropdown-content">
                  <img className="profile-icon" src={user.avatar} alt={user.username} style={{
                        borderRadius: '50%', // Create a circle shape
                        border: '2px solid blue', // Add a black border with desired width
                        padding: '5px' // Adjust padding for spacing between icon and border (optional)
                    }}/>
                  {/* <FontAwesomeIcon className='profile-icon' icon={faUser} style={{
                        borderRadius: '50%', // Create a circle shape
                        border: '2px solid blue', // Add a black border with desired width
                        padding: '5px' // Adjust padding for spacing between icon and border (optional)
                    }}/> */}
                  {/* <FontAwesomeIcon icon={faCaretDown} /> */}
                  <Button variant="primary" size="sm" onClick={handleUpdate} className="me-2 profile-btn" title="Edit Profile"> <FontAwesomeIcon icon={faPenToSquare} /> Edit profile</Button>
                  <Button variant="danger" size="sm" onClick={handleShowDeleteModal} className="me-2 profile-btn"  title='Delete Profile'> <FontAwesomeIcon icon={faTrash} /> Delete profile</Button>
                  <Button variant='outline-danger' size="sm" className='me-2 profile-btn' onClick={handleLogout}><FontAwesomeIcon icon={faRightFromBracket} /> Log Out</Button>
                  {/* <a href="#">Link 2</a>
                  <a href="#">Link 3</a> */}
                </div>
              )}
            </div>
              {/* <Button variant='outline-danger' className='logout' onClick={handleLogout}><FontAwesomeIcon icon={faRightFromBracket} /> Log Out</Button> */}
            </div>
          </div>
          <h2 className="profile-title">Profile</h2>
          <Card.Body>
            <div className="profile-header d-flex flex-column align-items-center">
              <img className="profile-avatar" src={user.avatar} alt={user.username} />
              <div className="profile-buttons d-flex mt-3">
                <Button variant="primary" size="sm" onClick={handleUpdate} className="me-2" title="Edit Profile"> <FontAwesomeIcon icon={faPenToSquare} /></Button>
                <Button variant="danger" size="sm" onClick={handleShowDeleteModal} title='Delete Profile'> <FontAwesomeIcon icon={faTrash} /></Button>
              </div>
              <div className="text-content text-center soical-media">
              <p>Welcome to my profile</p>
              <p>Follow me on other social media platforms:</p>
              <div></div>
              <div className="social-icons">
                <a href={`https://www.linkedin.com/in/${user.linkedInId}`} target="_blank" rel="noopener noreferrer">
                  <FontAwesomeIcon icon={faLinkedin} />
                </a>
                <a href={`https://www.twitter.com/${user.twitterId}`} target="_blank" rel="noopener noreferrer">
                  <FontAwesomeIcon icon={faXTwitter} />
                </a>
                <a href={`https://www.facebook.com/${user.facebookId}`} target="_blank" rel="noopener noreferrer">
                  <FontAwesomeIcon icon={faFacebook} />
                </a>
                <a href={`https://www.instagram.com/${user.instagramId}`} target="_blank" rel="noopener noreferrer">
                  <FontAwesomeIcon icon={faInstagram} />
                </a>
                <a href={`https://www.github.com/${user.githubId}`} target="_blank" rel="noopener noreferrer">
                  <FontAwesomeIcon icon={faGithub} />
                </a>
              </div>
          </div>
            </div>
            {editMode && <Button onClick={generateAvatars} className="mt-3" size="sm">Generate Avatar</Button>}
            {editMode && generatedAvatars.length > 0 && (
              <div className="generated-avatars mt-3">
                {generatedAvatars.map((avatarUrl, index) => (
                  <img
                    key={index}
                    src={avatarUrl}
                    alt={`Generated Avatar ${index}`}
                    onClick={() => selectAvatar(avatarUrl)}
                    className={`avatar-thumbnail ${selectedAvatar === avatarUrl ? 'selected' : ''}`}
                  />
                ))}
              </div>
            )}
            <div className="text-content text-justify">
              {editMode ? (
                <input
                  type="text"
                  value={updatedUsername}
                  onChange={(e) => setUpdatedUsername(e.target.value)}
                  placeholder="Update Username"
                  className="form-control mt-3"
                />
              ) : (
                <p><FontAwesomeIcon icon={faUser} /> Name: {user.username}</p>
              )}
              {editMode ? (
                <input
                  type="email"
                  value={updatedEmail}
                  onChange={(e) => setUpdatedEmail(e.target.value)}
                  placeholder="Update Email"
                  className="form-control mt-3"
                />
              ) : (
                <p><FontAwesomeIcon icon={faEnvelope} /> Email: {user.email}</p>
              )}
              {editMode ? (
                <input
                  type="password"
                  value={updatedPassword}
                  onChange={(e) => setUpdatedPassword(e.target.value)}
                  placeholder="Update Password"
                  className="form-control mt-3"
                />
              ) : (
                <p><FontAwesomeIcon icon={faLock} /> Password: {updatedPassword.slice(0, 6).replace(/./g, '*')}</p>
              )}
              <p className="profile-id"><FontAwesomeIcon icon={faIdBadge} /> User ID: {user.id}</p>
            </div>
            {editMode ? (
              <div className="d-flex justify-content-between gap-2">
                <Button variant="success" size="sm" onClick={handleSave}>Save</Button>
                <Button variant="secondary" size="sm" onClick={() => setEditMode(false)}>Cancel</Button>
              </div>
            ) : (
              <Button variant="info" size="sm" className="mt-3 go-chat" onClick={() => navigate('/chat')}>Go Chat</Button>
            )}
          </Card.Body>
        </Card>

        <Modal show={showDeleteModal} onHide={handleCloseDeleteModal} backdrop="static" keyboard={false} animation={true}>
          <Modal.Header closeButton className="modal-warning-header">
            <Modal.Title>⚠️ Warning!</Modal.Title>
          </Modal.Header>
          <Modal.Body className="modal-warning-body">
            Are you sure you want to delete your profile? <br /> Your data will be deleted.
            This action cannot be undone.
          </Modal.Body>
          <Modal.Footer className="d-flex justify-content-end">
            <div className='d-flex gap-2'>
              <Button variant="secondary" size="sm" onClick={handleCloseDeleteModal} className="me-2">
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </Modal.Footer>
        </Modal>
      </div>
    </>
  );
}

export default Profile;