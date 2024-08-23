import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faRightFromBracket, faRightToBracket, faUser, faSquareXmark } from '@fortawesome/free-solid-svg-icons';
import { faRocketchat } from '@fortawesome/free-brands-svg-icons';
import { faTachometerAlt } from '@fortawesome/free-solid-svg-icons'; // Import icon for Dashboard
import '../css/SideNav.css';

function SideNav() {
  const [user, setUser] = useState(null); 
  const [isOpen, setIsOpen] = useState(false); 
  const [isAuthenticated, setIsAuthenticated] = useState(false); 
  const navigate = useNavigate();

  // Function to check if user is authenticated
  const checkAuthentication = () => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      loadUserData(); 
      setIsAuthenticated(false);
      setUser(null); 
    }
  };

  const loadUserData = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      const userObject = Array.isArray(parsedUser) ? parsedUser[0] : parsedUser; 
      setUser(userObject); 
    }
  };

 
  useEffect(() => {
    checkAuthentication();
  }, []);

  // Handle logout: 
  const handleLogout = () => {
    localStorage.removeItem('token'); 
    localStorage.removeItem('user'); 
    setIsAuthenticated(false); 
    setUser(null); 
    navigate('/login'); // Redirect to login page
  };

  // Handle clicks on protected routes
  const handleProtectedClick = (path) => {
    if (isAuthenticated) {
      navigate(path);
    } else {
      navigate('/login', { state: { protectedRoute: true } });
    }
  };


  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className='navbar'>
      {/* Sidebar container */}
      <div className={`sidenav ${isOpen ? 'open' : ''}`}>
        {/* Button to close the sidebar */}
        <button className="closebtn" onClick={toggleMenu}>
          <FontAwesomeIcon icon={faSquareXmark} />
        </button>

      
        {isAuthenticated && user && (
          <div className="user-section">
            <img className="side-icon" src={user.avatar} alt={user.username} />
            <p className="username">{user.username}</p>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="nav-buttons">
          <button onClick={() => handleProtectedClick('/profile')}><FontAwesomeIcon icon={faUser} /> Profile</button>
          <button onClick={() => handleProtectedClick('/chat')}><FontAwesomeIcon icon={faRocketchat} /> Chat</button>
          {isAuthenticated ? (
            <button onClick={handleLogout}><FontAwesomeIcon icon={faRightFromBracket} /> Logout</button>
          ) : (
            <button onClick={() => navigate('/login')}><FontAwesomeIcon icon={faRightToBracket} /> Login </button>
          )}
        </div>
      </div>

      {/* Button to open the sidebar */}
      <div
        tabIndex={0}
        onClick={toggleMenu}
        role="button"
        className="btn btn-ghost"
      >
        <FontAwesomeIcon icon={faBars} className="h-5 w-5" />
      </div>
    </div>
  );
}

export default SideNav;
