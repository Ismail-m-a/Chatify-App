import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faRightFromBracket, faRightToBracket, faUser, faSquareXmark } from '@fortawesome/free-solid-svg-icons';
import { faRocketchat } from '@fortawesome/free-brands-svg-icons';
import { faTachometerAlt } from '@fortawesome/free-solid-svg-icons'; // Import icon for Dashboard
import '../css/SideNav.css';

function SideNav() {
  const [user, setUser] = useState(null); // State to store user data
  const [isOpen, setIsOpen] = useState(false); // State to manage the sidebar open/close state
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('token'); // Check if user is authenticated

  // Function to load user data from localStorage
  const loadUserData = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      const userObject = Array.isArray(parsedUser) ? parsedUser[0] : parsedUser; // Handle different possible structures of stored user data
      setUser(userObject); // Set user data in state
    }
  };

  // Load user data when the component mounts or when the user logs in
  useEffect(() => {
    console.log('SideNav: User is authenticated');  // Debugging line
    if (isAuthenticated) {
      loadUserData();
    } else {
      console.log('SideNav: User is not authenticated');  // Debugging line
    }
  }, [isAuthenticated]);

  // Handle logout: clear user data and navigate to login page
  const handleLogout = () => {
    localStorage.removeItem('token'); // Clear token from localStorage
    localStorage.removeItem('user'); // Clear user data from localStorage
    setUser(null); // Clear user data from state
    navigate('/login'); // Redirect to login page
  };

  // Toggle the sidebar open/close state
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
        {/* User section showing avatar and username */}
        {user && isAuthenticated && (
          <div className="user-section">
            <img className="side-icon" src={user.avatar} alt={user.username} />
            <p className="username">{user.username}</p>
          </div>
        )}
        {/* Navigation buttons */}
        <div className="nav-buttons">
          <button onClick={() => navigate('/profile')}><FontAwesomeIcon icon={faUser} /> Profile</button>
          <button onClick={() => navigate('/chat')}><FontAwesomeIcon icon={faRocketchat} /> Chat</button>
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
