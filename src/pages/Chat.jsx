import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Card, Form, Button, Image } from 'react-bootstrap';
import DOMPurify from 'dompurify';
import { v4 as uuidv4 } from 'uuid';
import '../css/Chat.css';
import { useNavigate } from 'react-router-dom';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState({});
  const conversationId = 'f94a9c70-b2b2-11ec-b909-0242ac120002'; // Hardcoded conversation ID for testing
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        const userObject = Array.isArray(parsedUser) ? parsedUser[0] : parsedUser;
        if (userObject.username && userObject.avatar) {
          setUser(userObject);
        } else {
          console.error('Parsed user object does not have the expected properties:', userObject);
          setUser(null);
        }
      }
    } catch (e) {
      console.error('Error parsing user data:', e);
      setUser(null);
    }
  }, []);

  const jwtToken = localStorage.getItem('token');

  useEffect(() => {
    const fetchMessages = async () => {
      if (!jwtToken) {
        console.error('No token found, redirecting to login');
        return;
      }
      try {
        const response = await fetch(`https://chatify-api.up.railway.app/messages?conversationId=${conversationId}`, {
          headers: { Authorization: `Bearer ${jwtToken}` }
        });
        if (!response.ok) {
          throw new Error('Error fetching messages');
        }
        const data = await response.json();
        console.log('Fetched messages:', data); // Log fetched messages

        // Extract unique userIds from messages
        const userIds = [...new Set(data.map(message => message.userId))];
        
        // Fetch user details for each userId
        const userDetailsPromises = userIds.map(userId => fetchUserDetails(userId));
        const userDetails = await Promise.all(userDetailsPromises);
        const usersMap = userDetails.reduce((acc, user) => {
          acc[user.id] = user;
          return acc;
        }, {});
        setUsers(usersMap);

        // Map user details to messages
        const messagesWithUserDetails = data.map(message => ({
          ...message,
          user: usersMap[message.userId]
        }));

        setMessages(messagesWithUserDetails);
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast.error('Failed to fetch messages.');
      }
    };

    fetchMessages();
  }, [jwtToken]);

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
      user: {
        username: user.username,
        avatar: user.avatar
      },
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
        setMessages(prevMessages => [...prevMessages, { ...data.latestMessage, createdAt: timestamp }]);
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

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
  };

  const formatTime = (timestamp) => {
    const time = new Date(timestamp);
    return isNaN(time.getTime()) ? 'Invalid Time' : time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
                <button onClick={handleLogout}>Logout</button>
              </div>
            </Card.Header>
            <Card.Body className="scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
              {messages.map((message, index) => {
                const timestamp = message.createdAt;
                const date = new Date(timestamp);
                const isValidDate = !isNaN(date.getTime());

                const username = message.user?.username || 'Unknown';
                const avatar = message.user?.avatar || 'default-avatar.png';
                const isCurrentUser = username === user?.username;

                return (
                  <React.Fragment key={message.id}>
                    {index > 0 && formatDate(messages[index - 1].createdAt) !== formatDate(message.createdAt) && (
                      <div className="divider d-flex align-items-center mb-4">
                        <p className="text-center mx-3 mb-0" style={{ color: '#a2aab7' }}>
                          {isValidDate ? formatDate(timestamp) : 'Invalid Date'}
                        </p>
                      </div>
                    )}
                    <div className="d-flex justify-content-between">
                      <p className="small mb-1"><strong>{username}</strong></p>
                      <p className="small mb-1 text-muted">{isValidDate ? formatTime(timestamp) : 'Invalid Date'}</p>
                    </div>
                    <div className={`d-flex flex-row justify-content-${isCurrentUser ? 'end' : 'start'} mb-4 pt-1`}>
                      {!isCurrentUser && (
                        <Image src={avatar} alt="avatar" style={{ width: '45px', height: '45px' }} roundedCircle />
                      )}
                      <div>
                        <p className={`small p-2 ${isCurrentUser ? 'me-3 text-white bg-warning' : 'ms-3'} mb-3 rounded-3`} style={{ backgroundColor: !isCurrentUser ? '#f5f6f7' : '' }}>
                          {message.text}
                        </p>
                      </div>
                      {isCurrentUser && (
                        <>
                          <Image src={avatar} alt="avatar" className="chat-avatar" />
                          <Button variant="danger" size="sm" onClick={() => handleDeleteMessage(message.id)}>Delete</Button>
                        </>
                      )}
                    </div>
                  </React.Fragment>
                );
              })}
            </Card.Body>
            <Card.Footer className="text-muted d-flex justify-content-start align-items-center p-3">
              <Form.Control
                type="text"
                placeholder="Type message"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' ? addMessage() : null}
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
}

export default Chat;
