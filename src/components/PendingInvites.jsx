import React from 'react';
import { ListGroup, Button } from 'react-bootstrap';
import * as Sentry from '@sentry/react'; // Import Sentry

function PendingInvites({ invites = [], onConversationStart }) {
  // Ensure that invites is an array
  if (!Array.isArray(invites)) {
      try {
          invites = JSON.parse(invites);
          if (!Array.isArray(invites)) {
              invites = [];
          }
      } catch (e) {
          Sentry.captureException(e); // Capture the error with Sentry
          console.error('Failed to parse invites:', e);
          invites = [];
      }
  }

  console.log('Invites received in PendingInvites component:', invites);

  const acceptInvite = (invite) => {
      console.log('Accepting invite for conversationId:', invite.conversationId);
      Sentry.captureMessage(`Accepting invite for conversationId: ${invite.conversationId}`, {
        level: 'info',
        extra: { invite }
      });
      onConversationStart(invite);
  };

  return (
      <div>
          {invites.length === 0 ? (
              <div>No pending invites</div>
          ) : (
              <ListGroup variant="flush">
                  {invites.map((invite) => {
                      console.log(`You have received an invite from ${invite.username} for conversationId: ${invite.conversationId}`);
                      Sentry.captureMessage(`Invite received from ${invite.username} for conversationId: ${invite.conversationId}`, {
                        level: 'info',
                        extra: { invite }
                      });
                      return (
                          <ListGroup.Item key={invite.conversationId} className="d-flex justify-content-between align-items-center">
                              <span>You've been invited to a conversation by {invite.username}</span>
                              <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => acceptInvite(invite)}
                              >
                                  Accept
                              </Button>
                          </ListGroup.Item>
                      );
                  })}
              </ListGroup>
          )}
      </div>
  );
}

export default Sentry.withProfiler(Sentry.withErrorBoundary(PendingInvites, { fallback: "An error has occurred" }));
