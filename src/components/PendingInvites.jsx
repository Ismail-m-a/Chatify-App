import React from 'react';
import { ListGroup, Button, Container, Row, Col } from 'react-bootstrap';
import * as Sentry from '@sentry/react'; // Importera Sentry

function PendingInvites({ invites = [], onConversationStart }) {
 // Invites skall vara en array
  if (!Array.isArray(invites)) {
    try {
      invites = JSON.parse(invites).reduce((inv, current) => {
        const exists = inv.find(item => item.username === current.username);
        if (!exists) inv.push(current);
        return inv;
      }, []);
      if (!Array.isArray(invites)) {
        invites = [];
      }
    } catch (e) {
      Sentry.captureException(e); // Fånga error med Sentry
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
    <Container>
      <Row>
        <Col>
          {invites.length === 0 ? (
            <div className="text-center my-3">No pending invites</div>
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
        </Col>
      </Row>
    </Container>
  );
}

export default Sentry.withProfiler(Sentry.withErrorBoundary(PendingInvites, { fallback: "An error has occurred" }));
