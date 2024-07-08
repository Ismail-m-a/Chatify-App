import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Removed unnecessary import
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faRightFromBracket, faRightToBracket, faUser, faSquareXmark } from '@fortawesome/free-solid-svg-icons';
import { faRocketchat } from '@fortawesome/free-brands-svg-icons';
import '../css/SideNav.css';

function SideNav() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem('token'); // Check if user is authenticated (you can adjust this based on your actual authentication logic)

  const handleLogout = () => {
    localStorage.removeItem('token'); // Clear the authentication token
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className='navbar bg-base-300'>
      <div className={`sidenav ${isOpen ? 'open' : ''}`}>
        <button className="closebtn" onClick={toggleMenu}>
          <FontAwesomeIcon icon={faSquareXmark} />
        </button>
        <button onClick={() => navigate('/profile')}><FontAwesomeIcon icon={faUser} /> Profile</button>
        <button onClick={() => navigate('/chat')}><FontAwesomeIcon icon={faRocketchat} /> Chat</button>
        {isAuthenticated ? (
          <button onClick={handleLogout}><FontAwesomeIcon icon={faRightFromBracket} /> Logout</button>
        ) : (
          <button onClick={() => navigate('/login')}><FontAwesomeIcon icon={faRightToBracket} /> Login </button>
        )}
      </div>
      <div
        tabIndex={0}
        onClick={toggleMenu}
        role="button"
        className="btn btn-ghost" // Ensure full width
      >
        <FontAwesomeIcon icon={faBars} className="h-5 w-5" /> {/* Render icon */}
      </div>
      
    </div>
  );
}

export default SideNav;
