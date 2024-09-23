import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faRightFromBracket, faRightToBracket, faUser, faX } from '@fortawesome/free-solid-svg-icons';
import { faRocketchat } from '@fortawesome/free-brands-svg-icons';
import '../css/SideNav.css';
import { useAuth } from '../AuthContext'; 

function SideNav() {
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, logout, updating } = useAuth();

  // check authentication status och user information
  const checkAuthStatus = () => {
    const storedUser = localStorage.getItem('user');

    if (isAuthenticated && storedUser) {
      let parsedUser = JSON.parse(storedUser);

      // If the user is stored as an array, extract the first element
      if (Array.isArray(parsedUser)) {
        parsedUser = parsedUser[0];
      }

      setUser({
        id: parsedUser.id,
        username: parsedUser.username,
        avatar: parsedUser.avatar || 'default-avatar-url',
      });
    } else {
      setUser(null);
    }
  };

  
  useEffect(() => {
    updating
    checkAuthStatus(); 
  }, [isAuthenticated, updating]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleProtectedRoute = (path) => {
    if (isAuthenticated) {
      navigate(path);
    } else {
      navigate('/login', { state: { protectedRoute: true } });
    }
  };

  return (
    <div className='navbar'>
      <div className={`sidenav ${isOpen ? 'open' : ''}`}>
        <button className="closebtn" onClick={toggleMenu} style={{ display: isOpen ? 'block' : 'none' }}>
          <FontAwesomeIcon icon={faX} />
        </button>
        <div className="user-section" 
          style={{ marginTop: user ? '0' : '20px' }}>
          {user && (
            <>
              <img className="side-icon" src={user.avatar} alt={user.username} />
              <p className="username">{user.username}</p>
            </>
          )}
        </div>
        <div className="nav-buttons">
          <button onClick={() => handleProtectedRoute('/profile')}>
            <FontAwesomeIcon icon={faUser} /> Profile
          </button>
          <button onClick={() => handleProtectedRoute('/chat')}>
            <FontAwesomeIcon icon={faRocketchat} /> Chat
          </button>
          {isAuthenticated ? (
            <button onClick={handleLogout}>
              <FontAwesomeIcon icon={faRightFromBracket} /> Logout
            </button>
          ) : (
            <button onClick={() => navigate('/login')}>
              <FontAwesomeIcon icon={faRightToBracket} /> Login
            </button>
          )}
        </div>
      </div>
      <div
        tabIndex={0}
        onClick={toggleMenu}
        role="button"
        className="btn btn-ghost"
        style={{ display: isOpen ? 'none' : 'flex' }}
      >
        <FontAwesomeIcon icon={isOpen ? faX : faBars} className="h-5 w-5" />
      </div>
    </div>
  );
}

export default SideNav;
