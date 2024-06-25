import React, { useState, useEffect, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Card, Form, Button, Image } from 'react-bootstrap';
import DOMPurify from 'dompurify';
import { v4 as uuidv4 } from 'uuid';
import '../css/Chat.css';
import { useNavigate } from 'react-router-dom';
import debounce from 'lodash/debounce';
// import ScrollToBottom from 'react-scroll-to-bottom';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState({});
  const [conversationId, setConversationId] = useState('');
  const navigate = useNavigate();
  const messageRef = useRef(null);
  const inputRef = useRef(null);


 

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
    const debouncedFetchMessages = debounce(async () => {
      if (!jwtToken) {
        console.error('No token found, redirecting to login');
        navigate('/login'); // Redirect to login if no token found
        return;
      }
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
      }
    }, 1000);

    if (conversationId) {
      debouncedFetchMessages();
    }

    return () => {
      debouncedFetchMessages.cancel();
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

  useEffect (() => {
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
              <div className="chat-window">
                {messages.map((message, index) => {
                  const timestamp = message.createdAt;
                  const date = new Date(timestamp);
                  const isValidDate = !isNaN(date.getTime());
                  
                  const messageUser = users[message.userId] || (message.user && message.user[0]); // Updated to ensure user details are fetched correctly;
                  const username = messageUser?.username || 'Unknown';
                  const avatar = message.user?.avatar || 'default-avatar.png';
                  const isCurrentUser = message.userId === user?.id;

                  console.log(`Message ID: ${message.id}, Username: ${username}, Avatar: ${avatar}, IsCurrentUser: ${isCurrentUser}`);

                  const MessageMenu = ({ handleDelete, handleEdit }) => {
                    const [isOpen, setIsOpen] = useState(false); // State to track menu visibility

                    const toggleMenu = () => setIsOpen(!isOpen);

                    return (
                      <div className="message-menu">
                        <button className='menu-btn' onClick={toggleMenu}>
                          <i className="fas fa-ellipsis-v"></i> {/* Font Awesome icon for 3 dots */}
                        </button>
                        {isOpen && (
                          <ul className="message-menu-options">
                            <li onClick={() => { handleDelete(); setIsOpen(false); }}>Delete</li>
                            <li onClick={() => { handleEdit(); setIsOpen(false); }}>Edit</li>
                          </ul>
                        )}
                      </div>
                    );
                  };

                  return (
                    <React.Fragment key={message.id}>
                      {index > 0 && formatDate(messages[index - 1].createdAt) !== formatDate(message.createdAt) && (
                        <div className="divider d-flex align-items-center mb-4">
                          <p className="text-center mx-3 mb-0" style={{ color: '#a2aab7' }}>
                            {isValidDate ? formatDate(timestamp) : 'Invalid Date'}
                          </p>
                        </div>
                      )}
                      {/* <div className="d-flex justify-content-between">
                        <p className="small mb-1"><strong>{username}</strong></p>
                        
                      </div> */}
                      <div className={`d-flex flex-row justify-content-${isCurrentUser ? 'end' : 'start'} mb-4 pt-1`}>
                        {!isCurrentUser && (
                          
                            <Image src={avatar} alt={`${username} avatar`} style={{ width: '45px', height: '45px' }} roundedCircle onClick={() => navigate(`/user/${message.userId}`)} className='chat-avatar' />
                  
                        )}
                        <div>
                          <p className={`small p-2 ${isCurrentUser ? 'me-3 text-white bg-primary' : 'ms-3'} mb-3 rounded-3 `} style={{ backgroundColor: !isCurrentUser ? '#f5f6f7' : ''  }}>
                            {message.text}
                          </p>
                          <p className="small mb-1 text-muted">{isValidDate ? formatTime(timestamp) : 'Invalid Date'}</p>
                        </div>
                        {isCurrentUser && (
                          <>
                            <MessageMenu handleDelete={() => handleDeleteMessage(message.id)} handleEdit={() => handleEditMessage(message.id)} /> {/* Pass message ID to functions */}
                            <Image src={user?.avatar || 'default-avatar.png'} alt={`${username} avatar`} roundedCircle onClick={() => navigate(`/profile`)} className="chat-avatar" />
                          </>
                        )}
                      </div>
                    </React.Fragment>
                  );
                })}
                <div ref={messageRef} />
              </div>
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
