import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import axios from 'axios';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Card, Form, Button, Image } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import '../css/Chat.css';

function Chat() {
  const { roomId: paramRoomId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState(null);
  const [roomId, setRoomId] = useState(paramRoomId || ''); // Use roomId from params if available
  const [chatRooms, setChatRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.username && parsedUser.avatar) {
          setUser(parsedUser);
        } else {
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
    const fetchChatRooms = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}chat-rooms`);
        setChatRooms(response.data);
      } catch (error) {
        console.error('Failed to fetch chat rooms:', error);
      }
    };

    fetchChatRooms();
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!jwtToken || !roomId) {
        console.error('No token or room ID found, redirecting to login');
        return;
      }
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}chat-rooms/${roomId}/messages`, {
          headers: { Authorization: `Bearer ${jwtToken}` }
        });
        if (!response.ok) {
          throw new Error('Error fetching messages');
        }
        const data = await response.json();
        setMessages(data);
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast.error('Failed to fetch messages.');
      }
    };

    fetchMessages();
  }, [jwtToken, roomId]);

  const addMessage = async () => {
    if (!newMessage.trim()) return;
    if (!user) {
      console.error('User is not defined');
      toast.error('User is not defined');
      return;
    }

    const timestamp = new Date().toISOString();

    const payload = {
      text: newMessage,
      roomId,
      user: {
        username: user.username,
        avatar: user.avatar
      },
      createdAt: timestamp
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}chat-rooms/${roomId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
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
      toast.error('Error: ' + JSON.stringify(err));
    }
  };

  const handleDeleteMessage = async (id) => {
    if (!jwtToken) {
      console.error('No token found, redirecting to login');
      return;
    }
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}messages/${id}`, {
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

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}chat-rooms`, { name: newRoomName });
      setChatRooms([...chatRooms, response.data]);
      setNewRoomName('');
    } catch (error) {
      console.error('Failed to create chat room:', error);
    }
  };

  const handleJoinRoom = (id) => {
    setRoomId(id);
    navigate(`/chat/${id}`);
  };

  // Utility function to format date
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
  };

  // Utility function to format time
  const formatTime = (timestamp) => {
    const time = new Date(timestamp);
    return isNaN(time.getTime()) ? 'Invalid Time' : time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // Concise time format
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
                <i className="fas fa-minus me-3 text-muted"></i>
                <i className="fas fa-comments me-3 text-muted"></i>
                <i className="fas fa-times me-3 text-muted"></i>
              </div>
            </Card.Header>
            <Card.Body className="scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
              {roomId ? (
                <>
                  {messages.map((message, index) => {
                    const timestamp = message.createdAt;
                    const date = new Date(timestamp);
                    const isValidDate = !isNaN(date.getTime());

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
                          <p className="small mb-1"><strong>{user.username || 'Unknown'}</strong></p>
                          <p className="small mb-1 text-muted">{isValidDate ? formatTime(timestamp) : 'Invalid Date'}</p>
                        </div>
                        <div className={`d-flex flex-row justify-content-${message.user?.username === user?.username ? 'end' : 'start'} mb-4 pt-1`}>
                          {message.user?.username !== user?.username && (
                            <Image src={user?.avatar || 'default-avatar.png'} alt="avatar" style={{ width: '45px', height: '45px' }} roundedCircle />
                          )}
                          <div>
                            <p className={`small p-2 ${message.user?.username === user?.username ? 'me-3 text-white bg-warning' : 'ms-3'} mb-3 rounded-3`} style={{ backgroundColor: message.user?.username !== user?.username ? '#f5f6f7' : '' }}>
                              {message.text}
                            </p>
                          </div>
                          {message.user?.username === user?.username && (
                            <Image src={message.user?.avatar || 'default-avatar.png'} alt="avatar" className="chat-avatar" />
                          )}
                        </div>
                      </React.Fragment>
                    );
                  })}
                </>
              ) : (
                <div className="chat-room-selection">
                  <h2>Select a Chat Room</h2>
                  <ul>
                    {chatRooms.map(room => (
                      <li key={room.id}>
                        <button onClick={() => handleJoinRoom(room.id)}>{room.name}</button>
                      </li>
                    ))}
                  </ul>
                  <input
                    type="text"
                    placeholder="New Room Name"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                  />
                  <Button onClick={handleCreateRoom} variant="warning">Create Room</Button>
                </div>
              )}
            </Card.Body>
            {roomId && (
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
            )}
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Chat;
