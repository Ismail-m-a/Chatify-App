import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as Sentry from '@sentry/react';

import Register from './pages/Register';
import Login from './pages/Login';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import OtherUserProfile from './pages/OtherUserProfile';
import ProtectedRoute from './components/ProtectedRoute';
import SideNav from './components/SideNav';
import Footer from './components/Footer'; 

import './App.css';

function App() {
  const isAuthenticated = !!localStorage.getItem('token'); 

  return (
    <Sentry.ErrorBoundary fallback={"An error has occurred"}>
      <Router>
        <div className="app-container">
          {isAuthenticated && <SideNav />}
          <div className={`content-wrapper ${!isAuthenticated ? 'no-sidenav' : ''}`}>
            <Routes>
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/chat" element={<Chat />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/user/:userId" element={<OtherUserProfile />} />
              </Route>
              <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
          </div>
        </div>
      </Router>
      <Footer />
    </Sentry.ErrorBoundary>
  );
}

export default App;
