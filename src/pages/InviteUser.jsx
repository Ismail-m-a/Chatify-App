// InviteUser.jsx
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Button, Form } from 'react-bootstrap';

const InviteUser = ({ conversationId, jwtToken }) => {
  const [userId, setUserId] = useState('');

  const fetchUserDetails = async (userId) => {
    try {
      const response = await fetch(`https://chatify-api.up.railway.app/users/${userId}`, {
        headers: { Authorization: `Bearer ${jwtToken}` }
      });
      if (!response.ok) {
        throw new Error('User not found');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast.error('Failed to fetch user details.');
      return null;
    }
  };

  const sendInvitation = async () => {
    if (!userId.trim()) {
      toast.error('Please enter a valid user ID');
      return;
    }

    const user = await fetchUserDetails(userId);
    if (!user) {
      toast.error('User not found');
      return;
    }

    try {
      const response = await fetch(`https://chatify-api.up.railway.app/invitations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ conversationId, userId })
      });

      if (!response.ok) {
        throw new Error('Failed to send invitation');
      }

      toast.success('Invitation sent successfully');
      setUserId('');
    } catch (err) {
      console.error('Error sending invitation:', err);
      toast.error('Error: ' + err.message);
    }
  };

  return (
    <div className="invite-user">
      <Form.Control
        type="text"
        placeholder="Enter user ID to invite"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        className="form-control me-3"
      />
      <Button onClick={sendInvitation} variant="warning" className="send-button">
        Invite
      </Button>
    </div>
  );
};

export default InviteUser;
