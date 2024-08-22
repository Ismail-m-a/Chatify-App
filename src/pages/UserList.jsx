// Importera nödvändiga bibliotek och komponenter
import React, { useState, useEffect } from 'react';
import { Card, Button, Spinner, Form, InputGroup, Image } from 'react-bootstrap';
import { toast } from 'react-toastify';
import '../css/UserList.css';
import * as Sentry from '@sentry/react'; // Importera sentry för felspårning
import { useNavigate } from 'react-router-dom';

// UserList-komponenten, tar emot props jwtToken, conversationId och currentUser
function UserList({ jwtToken, conversationId, currentUser }) {  // Acceptera currentUser som prop från Chatten
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [invitingUserId, setInvitingUserId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // useEffect för att hämta användare när komponenten laddas
  useEffect(() => {
    fetchUsers();
  }, []);
  
  // Fetcha användare med hjälp av JWT-token
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://chatify-api.up.railway.app/users', {
        headers: { 'Authorization': `Bearer ${jwtToken}` }
      });
      
      // Hantera svar som inte är OK
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch users:', errorText);
        throw new Error(`Failed to fetch users: ${response.statusText}`);
      }
      
      // Säkerställ att svaret är i JSON-format
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const errorText = await response.text();
        console.error('Unexpected content type:', contentType);
        console.error('Response content:', errorText);
        throw new Error('Unexpected response format');
      }
      
      // Parsar JSON-datan och uppdaterar state
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  // Funktion för att skicka en inbjudan till en användare
  const sendInvite = async (userId, username) => {
    console.log('Attempting to send invite...', { userId, username, conversationId });
    if (!conversationId) {
      toast.error('No conversation selected or created.');
      return;
    }
    setInvitingUserId(userId);
    try {
      const payload = { conversationId };
      console.log('Invite payload:', payload);

      const response = await fetch(`https://chatify-api.up.railway.app/invite/${userId}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const responseBody = await response.json();
      console.log('Server response:', responseBody);
       
      // Hantera svarsfel
      if (!response.ok) {
        if (responseBody.error === 'Invite for this conversation already exists for the user') {
          toast.info('User has already been invited to this conversation.');
        } else {
          throw new Error(`Failed to send invite: ${responseBody.error || response.statusText}`);
        }
      } else {
        toast.success(`Invitation sent successfully.`);
      }
    } catch (error) {
      console.error('Error sending invite:', error);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      toast.error(error.message || 'Failed to send invitation');
    } finally {
      setInvitingUserId(null); // Rensa invitingUserId state
    }
  };
   
  // Filtrera användare baserat på söktermen
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="user-list-card">
      <Card.Header className="user-list-header">User List</Card.Header>
      <Card.Body className="user-list-body">
        <InputGroup className="search-input">
          <InputGroup.Text>
            Search
          </InputGroup.Text>
          <Form.Control
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>
        {isLoading ? (
          <div className="loading-spinner">
            <Spinner animation="border" role="status" variant="primary">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        ) : (
          filteredUsers.map(user => {
            const isCurrentUser = user.userId === currentUser?.id; // Check om user är current user
            return (
              <div key={user.userId} className="user-item d-flex align-items-center">
                <Image 
                  src={user.avatar || 'default-avatar.png'}  // Display user's avatar eller default image
                  alt={`${user.username} avatar`}  // Alt text för avatar
                  roundedCircle  // runda avatar image 
                  className="user-avatar me-2"  //  styling for spacing
                  style={{ width: '40px', height: '40px', cursor: 'pointer' }}  // Set the size of the avatar and cursor to pointer
                  onClick={() => navigate(isCurrentUser ? '/profile' : `/user/${user.userId}`)} // Navigate based on whether the user is current
                />
                <span className="username-Invite flex-grow-1">{user.username}</span>
                <Button 
                  className="invite-button"
                  size="sm" 
                  onClick={() => sendInvite(user.userId, user.username)} 
                  disabled={invitingUserId === user.userId}
                >
                  {invitingUserId === user.userId ? 'Inviting...' : 'Invite'}
                </Button>
              </div>
            );
          })
        )}
      </Card.Body>
    </Card>
  );
}

export default Sentry.withProfiler(Sentry.withErrorBoundary(UserList, { fallback: "An error has occurred" }));
