import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/SideNav.css';

function SideNav() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div>
      <div className={`sidenav ${isOpen ? 'open' : ''}`}>
        <button className="closebtn" onClick={toggleMenu}>&times;</button>
        <button onClick={() => navigate('/profile')}>Profile</button>
        <button onClick={() => navigate('/chat')}>Chat</button>
        <button onClick={handleLogout}>Logout</button>
      </div>
      <span className="openbtn" onClick={toggleMenu}>&#9776; Open Menu</span>
    </div>
  );
}

export default SideNav;
