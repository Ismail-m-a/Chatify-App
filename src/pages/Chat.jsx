import React, { useState, useEffect, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Card, Form, Button, Image, Spinner } from 'react-bootstrap';
import DOMPurify from 'dompurify';
import { v4 as uuidv4 } from 'uuid';
import '../css/Chat.css';
import { useNavigate } from 'react-router-dom';
import debounce from 'lodash/debounce';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState({});
  const [conversationId, setConversationId] = useState('');
  const [lastDisplayedDate, setLastDisplayedDate] = useState(null);
  const navigate = useNavigate();
  const messageRef = useRef(null);
  const inputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        const userObject = Array.isArray(parsedUser) ? parsedUser[0] : parsedUser;
        setUser(parsedUser); // Updated to directly set the parsed user
        if (userObject.username && userObject.avatar) {
          setUser(userObject);
        } else {
          console.error('Parsed user object does not have the expected properties:', userObject);
          setUser(null);
        }
      }

      // Retrieve or generate the shared conversation ID
      const sharedConversationId = '861be4f0-d38c-43a4-bac6-74ad83b5ca5b'; // Example hardcoded shared conversation ID
      setConversationId(sharedConversationId);
      console.log('Using conversation ID:', sharedConversationId);
    } catch (e) {
      console.error('Error parsing user data or generating conversation ID:', e);
      setUser(null);
    }
  }, []);

  const jwtToken = localStorage.getItem('token');
  console.log('JWT Token:', jwtToken); // Log the JWT token

  useEffect(() => {
    const fetchMessages = debounce(async () => {
      if (!jwtToken) {
        console.error('No token found, redirecting to login');
        navigate('/login'); // Redirect to login if no token found
        return;
      }
      setIsLoading(true);
      try {
        const response = await fetch(`https://chatify-api.up.railway.app/messages?conversationId=${conversationId}`, {
          headers: { Authorization: `Bearer ${jwtToken}` }
        });

        if (!response.ok) {
          if (response.status === 429) {
            toast.error('Too many requests, please try again later.');
            return;
          }
          if (response.status === 403) {
            console.error('Forbidden: You do not have access to this resource.');
            toast.error('Forbidden: You do not have access to this resource.');
            return;
          }
          console.error(`Error fetching messages: ${response.statusText}`);
          throw new Error('Error fetching messages');
        }

        const data = await response.json();
        console.log('Fetched messages:', data); // Log fetched messages

        // Extract unique userIds from messages
        const userIds = [...new Set(data.map(message => message.userId))];
        console.log('User IDs in messages:', userIds);

        // Fetch user details for each userId
        const userDetailsPromises = userIds.map(userId => fetchUserDetails(userId));
        const userDetails = await Promise.all(userDetailsPromises);
        const usersMap = userDetails.reduce((acc, user) => {
          if (user && Array.isArray(user) && user.length > 0) {
            acc[user[0].id] = user[0]; // Assuming user details are in the first element of the array
          }
          return acc;
        }, {});
        setUsers(usersMap);

        // Map user details to messages
        const messagesWithUserDetails = data.map(message => ({
          ...message,
          user: usersMap[message.userId]
        }));

        setMessages(messagesWithUserDetails);
        console.log('Messages with user details:', messagesWithUserDetails);
      } catch (error) {
        console.error('Error fetching messages:', error);
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

  const fetchUserDetails = async (userId) => {
    try {
      const response = await fetch(`https://chatify-api.up.railway.app/users/${userId}`, {
        headers: { Authorization: `Bearer ${jwtToken}` }
      });
      if (!response.ok) {
        throw new Error('Error fetching user details');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast.error('Failed to fetch user details.');
      return null;
    }
  };

  const scrollToBottom = () => {
    if (messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const focusInputField = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]); // Scroll to bottom when messages change

  useEffect(() => {
    focusInputField();
  }, [newMessage]);

  const addMessage = async () => {
    if (!newMessage.trim()) return;
    if (!user) {
      console.error('User is not defined');
      toast.error('User is not defined');
      return;
    }

    const sanitizedMessage = DOMPurify.sanitize(newMessage);
    const timestamp = new Date().toISOString();

    const payload = {
      text: sanitizedMessage,
      conversationId,
      userId: user.id, // Use userId instead of the whole user object
      createdAt: timestamp
    };

    console.log('Payload being sent:', payload); // Log the payload

    try {
      const response = await fetch(`https://chatify-api.up.railway.app/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        console.error('Error response from server:', errorResponse);
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      if (data.latestMessage) {
        toast.success('Message sent');
        setNewMessage('');
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
      } else {
        toast.error('Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Error: ' + err.message);
    }
  };

  const handleDeleteMessage = async (id) => {
    if (!jwtToken) {
      console.error('No token found, redirecting to login');
      navigate('/login'); // Redirect to login if no token found
      return;
    }
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
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message.');
    }
  };

  const handleEditMessage = (id) => {
    // Implement edit functionality
    console.log('Edit message ID:', id);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

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

  const shouldDisplayDateDivider = (currentMessage, previousMessage) => {
    if (!previousMessage) {
      return true;
    }

    const currentDateTime = new Date(currentMessage.createdAt);
    const previousDateTime = new Date(previousMessage.createdAt);
    return currentDateTime.getHours() !== previousDateTime.getHours();
  };

  return (
    <Container fluid className="py-5 h-100" style={{ backgroundColor: '#eee' }}>
      <ToastContainer />
      <Row className="d-flex justify-content-center h-100">
        <Col md="8" lg="6" xl="4">
          <Card className="h-100">
            <Card.Header className="d-flex justify-content-between align-items-center p-3" style={{ borderTop: '4px solid #ffa900' }}>
              <h5 className="mb-0">Chat messages</h5>
              <div className="d-flex flex-row align-items-center">
                <Button variant='outline-danger' className='logout' onClick={handleLogout}><FontAwesomeIcon icon={faRightFromBracket} /> Logout </Button>
              </div>
            </Card.Header>
            <Card.Body className="scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
              {isLoading ? (
                <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                  <Spinner animation="border" role="status" variant="primary">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                  <p className="mt-2">Loading chat...</p>
                </div>
              ) : (
                <div className="chat-window">
                  {messages.map((message, index) => {
                    const timestamp = message.createdAt;
                    const date = new Date(timestamp);
                    const isValidDate = !isNaN(date.getTime());
                    const messageUser = users[message.userId] || (message.user && message.user[0]);
                    const username = messageUser?.username || 'Unknown';
                    const avatar = message.user?.avatar || 'default-avatar.png';
                    const isCurrentUser = message.userId === user?.id;
                    const showDateDivider = shouldDisplayDateDivider(message, messages[index - 1]);

                    const MessageMenu = ({ handleDelete, handleEdit }) => {
                      const [isOpen, setIsOpen] = useState(false);

                      const toggleMenu = () => setIsOpen(!isOpen);

                      return (
                        <div className="message-menu">
                          <button className='menu-btn' onClick={toggleMenu}>
                            <i className="fas fa-ellipsis-v"></i>
                          </button>
                          {isOpen && (
                            <ul className="message-menu-options">
                              <Button variant='danger'><li onClick={() => { handleDelete(); setIsOpen(false); }}>Delete</li></Button>
                            </ul>
                          )}
                        </div>
                      );
                    };

                    return (
                      <React.Fragment key={message.id}>
                        {showDateDivider && (
                          <div className="divider align-items-center mb-4">
                            <p className="small mb-1 text-muted" style={{ display: 'inline-block' }}>{isValidDate ? formatDateTime(timestamp) : 'Invalid Date'}</p>
                          </div>
                        )}
                        <div className={`d-flex flex-row justify-content-${isCurrentUser ? 'end' : 'start'} mb-4 pt-1`}>
                          {!isCurrentUser && (
                            <Image src={avatar} title={username} alt={`${username} avatar`} style={{ width: '45px', height: '45px' }} roundedCircle onClick={() => navigate(`/user/${message.userId}`)} className='chat-avatar' />
                          )}
                          <div>
                            <p className={`small p-2 ${isCurrentUser ? 'me-3 text-white bg-primary' : 'ms-3'} mb-3 rounded-3 `} style={{ backgroundColor: !isCurrentUser ? '#f5f6f7' : '' }} title={isValidDate ? formatDateTime(timestamp) : 'Invalid Date'}>
                              {message.text}
                            </p>
                          </div>
                          {isCurrentUser && (
                            <>
                              <MessageMenu handleDelete={() => handleDeleteMessage(message.id)} handleEdit={() => handleEditMessage(message.id)} />
                              <Image src={user?.avatar || 'default-avatar.png'} title={username} alt={`${username} avatar`} roundedCircle onClick={() => navigate(`/profile`)} className="chat-avatar" />
                            </>
                          )}
                        </div>
                      </React.Fragment>
                    );
                  })}
                  <div ref={messageRef} />
                </div>
              )}
            </Card.Body>
            <Card.Footer className="text-muted d-flex justify-content-start align-items-center p-3" id='chat-input'>
              <Form.Control
                ref={inputRef}
                type="text"
                placeholder="Type message"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="form-control me-3"
              />
              <Button onClick={addMessage} variant="warning" className="send-button">
                Send
              </Button>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );

  function handleKeyPress(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addMessage();
    }
  }
}

export default Chat;
