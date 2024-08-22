import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import * as Sentry from '@sentry/react';  // Import Sentry

function InviteUser({ jwtToken, conversationId, onInviteSuccess }) {
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInvite = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`https://chatify-api.up.railway.app/invite/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ conversationId })
      });

      if (!response.ok) {
        throw new Error('Failed to invite user');
      }

      setSuccess('User invited successfully');
      onInviteSuccess();
      setUserId('');
    } catch (error) {
      setError('Failed to invite user. Please try again.');
      console.error('Error inviting user:', error);
      Sentry.captureException(error);  // Capture the error with Sentry
    }
  };

  return (
    <Form onSubmit={handleInvite}>
      <Form.Group>
        <Form.Control
          type="text"
          placeholder="Enter user ID to invite"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          required
        />
      </Form.Group>
      <Button type="submit" variant="primary" className="mt-2">
        Invite User
      </Button>
      {error && <Alert variant="danger" className="mt-2">{error}</Alert>}
      {success && <Alert variant="success" className="mt-2">{success}</Alert>}
    </Form>
  );
}

export default Sentry.withProfiler(Sentry.withErrorBoundary(InviteUser, { fallback: "An error has occurred" }));
