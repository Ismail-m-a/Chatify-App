import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faRightFromBracket, faRightToBracket, faUser, faSquareXmark } from '@fortawesome/free-solid-svg-icons';
import { faRocketchat } from '@fortawesome/free-brands-svg-icons';
import { AuthContext } from '../AuthContext'; // Import the AuthContext
import '../css/SideNav.css';

function SideNav() {
  const [isOpen, setIsOpen] = useState(false); // State to manage the sidebar open/close state
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useContext(AuthContext); // Use the context

  // Toggle the sidebar open/close state
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Handle logout: clear user data and navigate to login page
  const handleLogout = () => {
    logout();
    navigate('/login'); // Redirect to login page
  };

  return (
    <div className='navbar'>
      {/* Sidebar container */}
      <div className={`sidenav ${isOpen ? 'open' : ''}`}>
        {/* Button to close the sidebar */}
        <button className="closebtn" onClick={toggleMenu}>
          <FontAwesomeIcon icon={faSquareXmark} />
        </button>

        {/* Conditionally render user section only if authenticated */}
        {isAuthenticated && user && (
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
            <button onClick={() => navigate('/login')}><FontAwesomeIcon icon={faRightToBracket} /> Login</button>
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
