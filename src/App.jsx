import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

import Register from './pages/Register';
import Login from './pages/Login';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import OtherUserProfile from './pages/OtherUserProfile';
import ProtectedRoute from './components/ProtectedRoute';
import SideNav from './components/SideNav';

function App() {
  return (
    <Router>
      <SideNav />
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
    </Router>
  );
}

export default App;
