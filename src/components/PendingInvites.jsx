import React from 'react';
import { ListGroup, Button, Container, Row, Col } from 'react-bootstrap';
import * as Sentry from '@sentry/react';

function PendingInvites({ invites, onConversationStart }) {
    // Ensure invites is an array
    if (!Array.isArray(invites)) {
        try {
            invites = JSON.parse(invites) || [];
        } catch (e) {
            Sentry.captureException(e); // Capture error with Sentry
            console.error('Failed to parse invites:', e);
            invites = [];
        }
    }

    // Filter invites to ensure each username is unique
    const uniqueInvites = invites.reduce((acc, current) => {
        const exists = acc.find(item => item.username === current.username);
        if (!exists) acc.push(current); // Add the invite only if the username hasn't been added already
        return acc;
    }, []);

    console.log('Unique invites to display:', uniqueInvites);

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
                    {uniqueInvites.length === 0 ? (
                        <div className="text-center my-3">No pending invites</div>
                    ) : (
                        <ListGroup variant="flush">
                            {uniqueInvites.map((invite) => (
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
                            ))}
                        </ListGroup>
                    )}
                </Col>
            </Row>
        </Container>
    );
}

export default Sentry.withProfiler(Sentry.withErrorBoundary(PendingInvites, { fallback: "An error has occurred" }));
