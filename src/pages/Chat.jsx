import React, { useState, useEffect, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Card, Form, Button, Image, Spinner, Dropdown } from 'react-bootstrap';
import DOMPurify from 'dompurify';
import { v4 as uuidv4 } from 'uuid';
import '../css/Chat.css';
import { useNavigate } from 'react-router-dom';
import debounce from 'lodash/debounce';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRightFromBracket, faPaperPlane, faEllipsisV, faTrash } from '@fortawesome/free-solid-svg-icons';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import UserList from './UserList';
import PendingInvites from '../components/PendingInvites';
import * as Sentry from '@sentry/react';  // Importera Sentry
import { useAuth } from '../AuthContext';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState({});
  const [conversationId, setConversationId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [savedConversations, setSavedConversations] = useState([]);
  const [invites, setInvites] = useState([]);
  const navigate = useNavigate();
  const messageRef = useRef(null);
  const inputRef = useRef(null);
  const headerRef = useRef(null);
  const { logout } = useAuth();

  const jwtToken = localStorage.getItem('token');

  useEffect(() => {
    console.info('Initializing Chat component, clearing previous messages and conversations.');
    setMessages([]);
    setSavedConversations([]);
    setInvites([]);

    const storedUser = localStorage.getItem('user');
    const storedConversations = JSON.parse(localStorage.getItem('savedConversations')) || [];
    const storedInvites = JSON.parse(localStorage.getItem('invites')) || [];

    if (storedUser) {
        console.info('Loading stored user data.');
        const parsedUser = JSON.parse(storedUser);
        const userObject = Array.isArray(parsedUser) ? parsedUser[0] : parsedUser;

        setUser(userObject);

        // Filtrera ut invites som redan är accepterad
        const filteredInvites = userObject.invite || [];
        setInvites(filteredInvites);

        const userConversations = storedConversations.filter(convo =>
            (convo?.inviter === userObject?.id) || (convo?.invitees && convo.invitees.includes(userObject?.id))
        );
        setSavedConversations(userConversations);

        if (userConversations.length > 0) {
            setConversationId(userConversations[0].id);
        } else if (filteredInvites.length > 0) {
            const firstInvite = filteredInvites[0];
            if (firstInvite.conversationId) {
                setConversationId(firstInvite.conversationId);
            }
        }
    }
  }, []);

  // useEffect för att hämta meddelanden när conversationId, jwtToken ändras.
  useEffect(() => {
    const fetchMessages = debounce(async () => {
      if (!jwtToken || !conversationId) {
        console.info('No JWT token or conversationId available, skipping message fetch.');
        return;
      }
      console.info('Fetching messages for conversation ID:', conversationId);
      setIsLoading(true);
      try {
        const response = await fetch(`https://chatify-api.up.railway.app/messages?conversationId=${conversationId}`, {
          headers: { Authorization: `Bearer ${jwtToken}` }
        });

        if (!response.ok) {
          handleFetchError(response);
          return;
        }

        // uppdaterar state, hämta meddelanden och användardetaljer 
        const data = await response.json();
        const userIds = [...new Set(data.map(message => message.userId))];
        const userDetailsPromises = userIds.map(userId => fetchUserDetails(userId));
        const userDetails = await Promise.all(userDetailsPromises);

        const usersMap = userDetails.reduce((acc, user) => {
          if (user && Array.isArray(user) && user.length > 0) {
            acc[user[0].id] = user[0];
          }
          return acc;
        }, {});
        setUsers(usersMap);
        const messagesWithUserDetails = data.map(message => ({
          ...message,
          user: usersMap[message.userId]
        }));

        setMessages(messagesWithUserDetails);
      } catch (error) {
        toast.error('Failed to fetch messages.');
      } finally {
        setIsLoading(false);
      }
    }, 1000);

    if (conversationId) {
      fetchMessages();
    }

    return () => {
      fetchMessages.cancel();
    };
  }, [jwtToken, conversationId]);

  // useEffect för att fokusera när meddelanden uppdateras och hantera scrollning
  useEffect(() => {
    // scrolla chat header
    if (headerRef.current) {
      requestAnimationFrame(() => {
        headerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
    
    // scrolla senaste messages
    if (messageRef.current) {
      setTimeout(() => {
        requestAnimationFrame(() => {
          messageRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        });
      }, 100); 
    }
    
    // Fokusera på inputfältet
    if (inputRef.current) {
      setTimeout(() => {
        requestAnimationFrame(() => {
          inputRef.current.focus();
        });
      }, 200); 
    }
  }, [messages]);
  
  
  // Funktion för att hantera fel vid hämtning av meddelanden
  const handleFetchError = (response) => {
    console.info('Handling fetch error:', response.statusText);
    Sentry.captureException(new Error(`Fetch Error: ${response.statusText}`)); // Fånga error med Sentry
    if (response.status === 429) {
      toast.error('Too many requests, please try again later.');
    } else if (response.status === 403) {
      localStorage.clear();
      toast.error('Session ended. You have been logged out.', {
        onClose: () => {
          logout (); // loggut när sessionstid slutat.
          navigate('/login')
        } 
      });
    } else {
      console.error(`Error fetching messages: ${response.statusText}`);
    }
  };

   // Hämtar användardetaljer baserat på användar-ID
  const fetchUserDetails = async (userId) => {
    console.info('Fetching details for user ID:', userId);
    try {
      const response = await fetch(`https://chatify-api.up.railway.app/users/${userId}`, {
        headers: { Authorization: `Bearer ${jwtToken}` }
      });
      if (!response.ok) {
        throw new Error('Error fetching user details');
      }
      return await response.json();
    } catch (error) {
      Sentry.captureException(error); // Fånga error med Sentry
      toast.error('Failed to fetch user details.');
      return null;
    }
  };

  // Funktion för att skicka meddelande
  const addMessage = async () => {
    if (!newMessage.trim() || !user || !conversationId) return;

    console.info('Adding new message to conversation:', conversationId);
    const sanitizedMessage = DOMPurify.sanitize(newMessage); // Saniterar meddelandet för att förhindra XSS
    const timestamp = new Date().toISOString();

    const payload = {
      text: sanitizedMessage,
      conversationId,
      userId: user.id,
      createdAt: timestamp
    };

    try {
      const response = await fetch(`https://chatify-api.up.railway.app/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      if (data.latestMessage) {
        console.info('Message sent successfully:', data.latestMessage);
        toast.success('Message sent');
        setNewMessage(''); // Rensar inmatningsfältet efter att meddelandet har skickats
        setMessages(prevMessages => [
          ...prevMessages,
          {
            ...data.latestMessage,
            id: data.latestMessage.id || uuidv4(),
            user,
            createdAt: timestamp,
            userId: user.id
          }
        ]);

        updateSavedConversation(conversationId, data.latestMessage); // Uppdaterar den sparade konversationen med senaste medelande

      } else {
        toast.error('Failed to send message');
      }
    } catch (err) {
      Sentry.captureException(err); // Fånga error med Sentry
      console.error('Error adding message:', err);
      toast.error('Error: ' + err.message);
    }
  };

  // Funktion för att updatera den sparade konversationen
  const updateSavedConversation = (conversationId, latestMessage) => {
    console.info('Updating saved conversation with latest message:', latestMessage);
    setSavedConversations((prevConversations) => {
      const updatedConversations = prevConversations.map(convo => {
        if (convo.id === conversationId) {
          return { ...convo, latestMessage };
        }
        return convo;
      });
      localStorage.setItem('savedConversations', JSON.stringify(updatedConversations));
      return updatedConversations;
    });
  };

  // Funktion för att radera ett meddelande baserat på dess ID
  const handleDeleteMessage = async (id) => {
    if (!jwtToken) {
      navigate('/login');
      return;
    }
    toast.info(' You deleted a message  with ID: ' + id);
    console.info('Deleting message with ID:', id);
    try {
      const response = await fetch(`https://chatify-api.up.railway.app/messages/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${jwtToken}` }
      });
      if (!response.ok) {
        throw new Error('Failed to delete message');
      }
      setMessages(messages.filter(message => message.id !== id));
    } catch (error) {
      Sentry.captureException(error); // Fånga error med Sentry
      toast.error('Failed to delete message.');
    }
  };

   // Funktion för att byta till en ny konversation baserat på dess ID
  const handleConversationChange = (newConversationId) => {
    console.info('Switching to new conversation ID:', newConversationId);
    setConversationId(newConversationId);
    saveConversation(newConversationId);
  };

  // Spara konversation i localStorage
  const saveConversation = async (conversationId) => {
    console.info('Saving conversation with ID:', conversationId);
    const conversationExists = savedConversations.some(convo => convo.id === conversationId);

    if (!conversationExists) {
      const newConversation = {
        id: conversationId,
        inviter: user?.id,
        invitees: [user?.id],
      };
      const updatedConversations = [...savedConversations, newConversation];
      setSavedConversations(updatedConversations);
      localStorage.setItem('savedConversations', JSON.stringify(updatedConversations));
    }
  };

  // Funktion för att hantera acceptans av en inbjudan till en konversation
  const handleInviteAcceptance = async (invite) => {
    console.info('Invite accepted for conversation:', invite.conversationId);

    // Spara conversationer både inviter and invitee
    await saveConversation(invite.conversationId);

    // Växla till conversationen kopplade till accepterad invite
    setConversationId(invite.conversationId);

    // Fetcha the senaste messages i conversation
    await fetchMessagesAfterJoining(invite.conversationId);

    // Updatera invites state och ta bort accepterad invite
    setInvites((prevInvites) => {
        const validInvites = Array.isArray(prevInvites) ? prevInvites : [];
        return validInvites.filter(i => i.conversationId !== invite.conversationId);
    });

    // Updatera user object i localStorage spara ändring
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
        const userObject = Array.isArray(storedUser) ? storedUser[0] : storedUser;

        
        if (!Array.isArray(userObject.invite)) {
            userObject.invite = [];
        }

        const updatedInvites = userObject.invite.filter(i => i.conversationId !== invite.conversationId);
        userObject.invite = updatedInvites;
        localStorage.setItem('user', JSON.stringify([userObject]));

        console.info('Updated user invites in localStorage:', userObject.invite);
    }

    // Spara updaterad invites till localStorage, spara state
    localStorage.setItem('invites', JSON.stringify(invites));
  };


  // Hämta meddelanden efter att ha gått med i en konversation
  const fetchMessagesAfterJoining = async (conversationId) => {
    console.info('Fetching messages after joining conversation ID:', conversationId);
    try {
      const response = await fetch(`https://chatify-api.up.railway.app/messages?conversationId=${conversationId}`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      setMessages(data);
    } catch (error) {
      Sentry.captureException(error); // Fånga error med Sentry
      console.error('Error fetching messages:', error);
      toast.error('Failed to fetch messages.');
    }
  };
  
  // Hantera utloggning
  const handleLogout = () => {
    console.info('Logging out user and clearing session data.');
    // Spara conversationer coh invites till localStorage innan logout
    // localStorage.setItem('savedConversations', JSON.stringify(savedConversations));
    // localStorage.setItem('invites', JSON.stringify(invites));
    // localStorage.setItem('user', JSON.stringify(user));
  
    // Radera token från localStorage
    // localStorage.removeItem('token');
    logout();
  
    setMessages([]);
    setSavedConversations([]);
    setInvites([]);
    setConversationId('');
    navigate('/login');
  };
  // Formatera datum och tid
  const formatDateTime = (timestamp) => {
    const dateTime = new Date(timestamp);
    if (isNaN(dateTime.getTime())) {
      return 'Invalid Date';
    }
    const options = {
      hour: 'numeric',
      minute: 'numeric',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    };
    return `${dateTime.toLocaleDateString('en-US', options)} `;
  };
  // Skapa en ny konversation
  const createNewConversation = async () => {
    const newConversationId = uuidv4();
    console.info('Creating new conversation with ID:', newConversationId);
    setConversationId(newConversationId);

    const newConversation = {
      id: newConversationId,
      inviter: user?.id,
      invitees: [user?.id],
    };

    const updatedConversations = [...savedConversations, newConversation];
    setSavedConversations(updatedConversations);
    localStorage.setItem('savedConversations', JSON.stringify(updatedConversations));

    toast.success('New conversation created');
  };

  useEffect(() => {
    console.info('Conversation ID updated to:', conversationId);
  }, [conversationId]);

  // rendera chat
  return (
    <Container fluid className="chat-container">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      <Row className="chat-row">
        <Col md="2" className="conversation-list-column">
          <Dropdown>
            <Dropdown.Toggle variant="secondary" id="dropdown-basic">
              Saved Conversations
            </Dropdown.Toggle>

            <Dropdown.Menu>
              {savedConversations.map((conversation) => (
                <Dropdown.Item key={conversation.id} onClick={() => handleConversationChange(conversation.id)}>
                  {conversation.id}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
          <PendingInvites
            invites={invites}
            onConversationStart={handleInviteAcceptance}
          />
          {conversationId && (
            <UserList
              jwtToken={jwtToken}
              conversationId={conversationId}
              currentUser={user} 
              onConversationChange={handleConversationChange}
            />
          )}
        </Col>
        <Col md="10" lg="8" xl="6" className="chat-column">
          <Card  className="chat-card">
            <Card.Header ref={headerRef} className="chat-header">
              <h5>Chat Messages</h5>
              <div className="chat-actions">
                <Button variant="outline-primary" className="new-chat-btn" onClick={createNewConversation}>
                  + New Chat
                </Button>
                <Button variant="outline-danger" className="logout-btn" onClick={handleLogout}>
                  <FontAwesomeIcon icon={faRightFromBracket} /> Logout
                </Button>
              </div>
            </Card.Header>
            <Card.Body className="chat-body">
              {isLoading ? (
                <div className="loading-spinner">
                  <Spinner animation="border" role="status" variant="primary" />
                  <p>Loading chat...</p>
                </div>
              ) : (
                <TransitionGroup className="chat-messages">
                  {messages.map((message, index) => {
                    const nodeRef = React.createRef(); // Create nodeRef for each message
                    return (
                      <CSSTransition
                        key={message.id}
                        timeout={300}
                        classNames="message"
                        nodeRef={nodeRef} // Pass the ref to CSSTransition
                      >
                        <MessageBubble
                          message={message}
                          isCurrentUser={message.userId === user?.id}
                          showDateDivider={shouldDisplayDateDivider(message, messages[index - 1])}
                          onDelete={() => handleDeleteMessage(message.id)}
                          formatDateTime={formatDateTime}
                          users={users}
                          nodeRef={nodeRef} // Pass the ref to MessageBubble
                        />
                      </CSSTransition>
                    );
                  })}
                </TransitionGroup>
              )}
              <div ref={messageRef} />
            </Card.Body>
            <Card.Footer className="chat-footer">
              <Form onSubmit={(e) => { e.preventDefault(); addMessage(); }} className="message-form">
                <Form.Control
                  ref={inputRef}
                  type="text"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="message-input"
                />
                <Button type="submit" variant="primary" className="send-button">
                  <FontAwesomeIcon icon={faPaperPlane} />
                </Button>
              </Form>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

// Funktion som representerar varje MessageBubbel i chatten
function MessageBubble({ message, isCurrentUser, showDateDivider, onDelete, formatDateTime, users, nodeRef }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const messageUser = users[message.userId] || (message.user && message.user[0]);
  const username = messageUser?.username || 'Unknown';
  const avatar = message.user?.avatar || 'default-avatar.png';
  const navigate = useNavigate();

  return (
    <>
      {showDateDivider && (
        <div className="date-divider">
          <span>{formatDateTime(message.createdAt)}</span>
        </div>
      )}
      <div ref={nodeRef} className={`message-bubble ${isCurrentUser ? 'current-user' : ''}`}>
        <Image
          src={avatar}
          title={username}
          alt={`${username} avatar`}
          className="user-avatar"
          roundedCircle
          onClick={() => navigate(isCurrentUser ? '/profile' : `/user/${message.userId}`)}
        />
        <div className="message-content">
          <p>{message.text}</p>
          <span className="message-time">{formatDateTime(message.createdAt)}</span>
        </div>
        {isCurrentUser && (
          <div className="message-actions">
            <Button size='sm' variant="link" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <FontAwesomeIcon icon={faEllipsisV} />
            </Button>
            {isMenuOpen && (
              <div className="message-menu">
                <Button variant="danger" className='btn-sm' size="sm" onClick={onDelete}>
                  <FontAwesomeIcon icon={faTrash} /> Delete
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// Funktion som visar date divider när medelande har skapats, varje timme ett nyt datumavskiljare
function shouldDisplayDateDivider(currentMessage, previousMessage) {
  if (!previousMessage) {
    return true;
  }
  const currentDateTime = new Date(currentMessage.createdAt);
  const previousDateTime = new Date(previousMessage.createdAt);
  return currentDateTime.toDateString() !== previousDateTime.toDateString();
}

// Exporterar Chat-komponenten, Sentry's withErrorBoundary felrapportering
export default Sentry.withProfiler(Sentry.withErrorBoundary(Chat, { fallback: "An error has occurred" }));
