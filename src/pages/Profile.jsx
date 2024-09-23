import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Card, Button, Container, Spinner, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faPenToSquare, faTrash, faEnvelope, faLock, faIdBadge, faRightFromBracket, faBars } from '@fortawesome/free-solid-svg-icons';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../css/Profile.css';
import * as Sentry from '@sentry/react';  // Importera Sentry för att fånga error
import { useAuth } from '../AuthContext';

function Profile() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [updatedUsername, setUpdatedUsername] = useState('');
  const [updatedEmail, setUpdatedEmail] = useState('');
  const [updatedPassword, setUpdatedPassword] = useState('');
  const [generatedAvatars, setGeneratedAvatars] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { logout, updating } = useAuth();
  

  const loadUserData = () => {
    console.info('Laddar användardata...'); // Informationslogg
    setIsLoading(true);
    const storedUser = localStorage.getItem('user');
    const userId = localStorage.getItem('userId');

    setTimeout(() => {
      if (storedUser && storedUser !== 'undefined') {
        try {
          const userData = JSON.parse(storedUser) || [];
          console.debug('User data fetched from localStorage:', userData); // Debug log
          if (userData.length > 0 && userData[0] && typeof userData[0] === 'object' && 'id' in userData[0]) {
            console.debug('Parsed user data:', userData[0]); // Debug log
            const currentUser = userData[0];
            setUser(currentUser);
            setUpdatedUsername(currentUser.username);
            setUpdatedEmail(currentUser.email);
            setUpdatedPassword(currentUser.password);
            setSelectedAvatar(currentUser.avatar);
          } else {
            setError('Ogiltig användardata. Vänligen logga in igen.');
          }
        } catch (e) {
          setError('Fel vid tolkning av användardata. Vänligen logga in igen.');
          Sentry.captureException(e);  // Fånga errors med Sentry
        }
      } else {
        setError('Ingen användare hittades. Vänligen logga in igen.');
      }
      setIsLoading(false);
    }, 1000); // 1 second delay 
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const updateUser = async (userId, updatedData) => {
    console.info('Uppdaterar användardata...'); // Informationslogg
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Ingen token hittades. Vänligen logga in igen.');
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
      console.debug('Response från server vid uppdatering:', response); // Debug log
      return response;
    } catch (error) {
      Sentry.captureException(error);  // Fånga errors under user update
      if (error.response && error.response.status === 400) {
        setError('Ogiltig data. Vänligen kontrollera de uppdaterade fälten och försök igen.');
      } else {
        setError('Misslyckades med att uppdatera användardata.');
      }
      console.error('Fel vid uppdatering av användardata:', error);
      throw error;
    }
  };

  const deleteUser = async (userId) => {
    console.info('Försöker radera användare...'); // Informationslogg
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Ingen token hittades. Vänligen logga in igen.');
      return;
    }

    try {
      await axios.delete(`https://chatify-api.up.railway.app/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      localStorage.clear();
      toast.info('Din profil kommer att raderas permanent.');
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 3000);
    } catch (error) {
      Sentry.captureException(error);  // Capture errors during user deletion
      setError('Misslyckades med att radera användare.');
      console.error('Fel vid radering av användare:', error);
    }
  };

  const handleUpdate = () => {
    console.info('Användaren har gått in i redigeringsläge.'); // Informationslogg
    setEditMode(true);
  };

  const handleSave = async () => {
    console.info('Försöker spara användaruppdateringar...'); // Informationslogg
    try {
      const updatedData = {
        username: updatedUsername,
        email: updatedEmail,
        avatar: selectedAvatar || user.avatar,
      };

      if (imageUrl) {
        updatedData.avatar = imageUrl;
      }
  
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

          updating ();
  
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
          setGeneratedAvatars([]); // radera generated avatar
          setImageUrl(''); // redera image url

          // Visa uppdaterade fält
          const updatedField = [];
          if (updatedUsername !== user.username) updatedField.push('Användarnamn');

          if (updatedEmail !== user.email) updatedField.push('Email');
        
          if (updatedPassword !== user.password) updatedField.push('Lösenord');
        
          if (updatedData.avatar !== user.avatar) updatedField.push('Avatar');
          
          if (updatedField.length > 0) {
            console.info(`Följande fält har uppdaterats: ${updatedField.join(', ')}`); // Informationslogg
            toast.info(`${updatedField.join(', ')} har uppdaterats`);
          } else {
            console.info('Inga ändringar gjordes.'); // Informationslogg
            toast.info('Inga ändringar gjordes');
          }

        } else {
          setError('Ogiltigt svar från servern.');
        }
      } else {
        setError('Ogiltig användardata.');
      }
    } catch (error) {
      Sentry.captureException(error);  // Capture errors during saving user updates
      setError('Misslyckades med att uppdatera användardata.');
      console.error('Fel vid uppdatering av användardata:', error);
    }
  };

  const handleFileChange = async (event) => {
    console.info('Användaren laddar upp en bild.'); // Informationslogg
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('key', 'd90d063f778f89dfef08730a0108753b'); 
    formData.append('image', file);

    const apiUrl = 'https://api.imgbb.com/1/upload';

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Nätverkssvaret var inte OK');
      }

      const data = await response.json();
      const imageUrl = data.data.url;
      console.debug('Bild uppladdad:', imageUrl); // Debug log
      setImageUrl(imageUrl);
      toast.success('Bild uppladdad framgångsrikt!');

      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      Sentry.captureException(error);  // Fånga errors under file upload
      console.error('Uppladdning misslyckades:', error);
      toast.error('Uppladdning misslyckades: ' + error.toString());
    }
  };

  const handleDelete = async () => {
    console.info('Användaren initierade profilradering.'); // Informationslogg
    if (user && user.id) {
      await deleteUser(user.id);
    } else {
      setError('Ogiltig användardata.');
    }
  };

  const handleCancelEdit = () => {
    console.info('Användaren avbröt redigering.'); // Informationslogg
    setEditMode(false);
    setUpdatedUsername(user.username);
    setUpdatedEmail(user.email);
    setUpdatedPassword(user.password);
    setSelectedAvatar(user.avatar);
    setGeneratedAvatars([]);
    setImageUrl('');
  };

  const handleCloseDeleteModal = () => setShowDeleteModal(false);
  const handleShowDeleteModal = () => setShowDeleteModal(true);

  const generateAvatars = () => {
    console.info('Genererar avatarer.'); // Informationslogg
    const newAvatarUrls = Array.from({ length: 6 }, () => `https://i.pravatar.cc/300?u=${uuidv4()}`);
    setGeneratedAvatars(newAvatarUrls);
  };

  const selectAvatar = (avatarUrl) => {
    console.info('Användaren valde en avatar.'); // Informationslogg
    setSelectedAvatar(avatarUrl);
  };

  const handleLogout = () => {
    console.info('Användaren loggar ut.'); // Informationslogg
    logout ();
    navigate('/login');
  };

  const toggleDropdown = () => {
    console.debug('Dropdown-meny till/från.'); // Debug log
    setShowDropdown(!showDropdown);
  };

  if (isLoading) {
    return (
      <Container className="profile-container d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="text-center">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Laddar...</span>
          </Spinner>
          <p className="mt-2">Laddar profil...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    Sentry.captureMessage('Fel vid profilvisning');  // Fånga vid error
    return <div className="profile-container"><p className="error">{error}</p></div>;
  }

  if (!user) {
    return (
      <Container className="profile-container">
        <p>Ingen användardata tillgänglig. Vänligen logga in igen.</p>
      </Container>
    );
  }

  return (
    <>
      <ToastContainer />
      <div className="profile-container d-flex justify-content-center align-items-center">
        <Card className="profile-card text-center shadow-lg p-4">
          <div className='d-flex justify-content-end align-items-center mb-3'>
            <div className="d-flex justify-content-end">
            <div className="dropdown">
              <div onClick={toggleDropdown} className="dropbtn">
                <FontAwesomeIcon icon={faBars} />
              </div>
              {showDropdown && (
                <div id="myDropdown" className="dropdown-content">
                  <img className="profile-icon" src={user.avatar} alt={user.username} style={{
                        borderRadius: '50%', // Create a circle shape
                        border: '2px solid blue', // Add a black border with desired width
                        padding: '5px' // Adjust padding for spacing between icon and border (optional)
                  }}/>
                  <Button variant="primary" size="sm" onClick={handleUpdate} className="me-2 profile-btn" title="Redigera profil"> <FontAwesomeIcon icon={faPenToSquare} /> Redigera profil</Button>
                  <Button variant="danger" size="sm" onClick={handleShowDeleteModal} className="me-2 profile-btn"  title='Radera profil'> <FontAwesomeIcon icon={faTrash} /> Radera profil</Button>
                  <Button variant='outline-danger' size="sm" className='me-2 profile-btn' onClick={handleLogout}><FontAwesomeIcon icon={faRightFromBracket} /> Logga ut</Button>
                </div>
              )}
            </div>
            </div>
          </div>
          <h2 className="profile-title">Profil information</h2>
          <Card.Body>
            <div className="profile-header d-flex flex-column align-items-center">
              <img className="profile-avatar" src={user.avatar} alt={user.username} />
          </div>
          <div className="image-buttons ">
            {editMode && ( <Button onClick={generateAvatars} className="btn-small" size='xs'>Generera avatarer</Button>)}
            {editMode && (
                <>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*"  style={{ display: 'none' }} />
                  <Button onClick={() => fileInputRef.current.click()} className="btn-small" size='xs' >Ladda upp bild</Button>
                </>
              )}
          </div>
              { editMode && imageUrl && (
                <div className='upload-image'>
                  <h6>Uppladdad bild:</h6>
                  <img src={imageUrl} alt="Uppladdad" style={{ maxWidth: '20%', borderRadius: '50%', // Create a circle shape
                    border: '2px solid blue', // Add a black border with desired width
                    padding: '5px' }}
                   />
                  <p>URL: <a href={imageUrl} target="_blank" rel="noopener noreferrer">{imageUrl}</a></p>
                </div>
              )}
            {editMode && generatedAvatars.length > 0 && (
              <div className="generated-avatars mt-3">
                {generatedAvatars.map((avatarUrl, index) => (
                  <img
                    key={index}
                    src={avatarUrl}
                    alt={`Genererad Avatar ${index}`}
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
                  placeholder="Uppdatera användarnamn"
                  className="form-control mt-3"
                />
              ) : (
                <p><FontAwesomeIcon icon={faUser} /> <strong>Namn:</strong> {user.username}</p>
              )}
              {editMode ? (
                <input
                  type="email"
                  value={updatedEmail}
                  onChange={(e) => setUpdatedEmail(e.target.value)}
                  placeholder="Uppdatera email"
                  className="form-control mt-3"
                />
              ) : (
                <p><FontAwesomeIcon icon={faEnvelope} /> <strong>Email:</strong>  {user.email}</p>
              )}
              {editMode ? (
                <input
                  type="password"
                  value={updatedPassword}
                  onChange={(e) => setUpdatedPassword(e.target.value)}
                  placeholder="Uppdatera lösenord"
                  className="form-control mt-3"
                />
              ) : (
                <p><FontAwesomeIcon icon={faLock} /> <strong>Lösenord:</strong>  {updatedPassword.slice(0, 6).replace(/./g, '*')}</p>
              )}
              <p className="profile-id"><FontAwesomeIcon icon={faIdBadge} /> <strong>Användar-ID:</strong>  {user.id}</p>
            </div>
            {editMode ? (
              <div className="d-flex justify-content-center gap-4">
                <Button variant="success" size="sm" onClick={handleSave}>Spara</Button>
                <Button variant="secondary" size="sm" onClick={handleCancelEdit}>Avbryt</Button>
              </div>
            ) : (
              <Button variant="info" size="sm" className="mt-3 go-chat" onClick={() => navigate('/chat')}>Gå till chatt</Button>
            )}
          </Card.Body>
        </Card>

        <Modal show={showDeleteModal} onHide={handleCloseDeleteModal} backdrop="static" keyboard={false} animation={true}>
          <Modal.Header closeButton className="modal-warning-header">
            <Modal.Title>⚠️ Varning!</Modal.Title>
          </Modal.Header>
          <Modal.Body className="modal-warning-body">
            Är du säker på att du vill radera din profil? <br /> Dina data kommer att raderas.
            Denna åtgärd kan inte ångras.
          </Modal.Body>
          <Modal.Footer className="d-flex justify-content-end">
            <div className='d-flex gap-2'>
              <Button variant="secondary" size="sm" onClick={handleCloseDeleteModal} className="me-2">
                Avbryt
              </Button>
              <Button variant="danger" size="sm" onClick={handleDelete}>
                Radera
              </Button>
            </div>
          </Modal.Footer>
        </Modal>
      </div>
    </>
  );
}

export default Sentry.withProfiler(Sentry.withErrorBoundary(Profile, { fallback: "Ett fel har uppstått" }));
