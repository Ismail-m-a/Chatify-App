import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Removed unnecessary import
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
    <div>
      <div className={`sidenav ${isOpen ? 'open' : ''}`}>
        <button className="closebtn" onClick={toggleMenu}>
          ×
        </button>
        <button onClick={() => navigate('/profile')}>Profile</button>
        <button onClick={() => navigate('/chat')}>Chat</button>
        {isAuthenticated ? (
          <button onClick={handleLogout}>Logout</button>
        ) : (
          <button onClick={() => navigate('/login')}>Login 🔐</button>
        )}
      </div>
      <span className="openbtn" onClick={toggleMenu}>
        ☰ Open Menu
      </span>
    </div>
  );
}

export default SideNav;
