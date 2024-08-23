import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as Sentry from '@sentry/react';

import Register from './pages/Register';
import Login from './pages/Login';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
// import Dashboard from './pages/Dashboard';
import OtherUserProfile from './pages/OtherUserProfile';
import ProtectedRoute from './components/ProtectedRoute';
import SideNav from './components/SideNav';

import './App.css';

function App() {
  return (
    <Sentry.ErrorBoundary fallback={"An error has occurred"}>
      <Router>
        <div className="app-container">
          <SideNav />
          <div className="content-wrapper">
            <Routes>
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route element={<ProtectedRoute />}>
                {/* <Route path="/dashboard" element={<Dashboard />} /> */}
                <Route path="/chat" element={<Chat />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/user/:userId" element={<OtherUserProfile />} />
              </Route>
              <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
          </div>
        </div>
      </Router>
    </Sentry.ErrorBoundary>
  );
}

export default App;
