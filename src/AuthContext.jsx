import React, { createContext, useState, useContext, useEffect } from 'react';

// Kontext för autentisering
const AuthContext = createContext();


export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
   const [user, setUser] = useState(() => {
    // Safely parse the user data, default to an empty object if undefined
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : {};
  });

  const login = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    setIsAuthenticated(true);
  };

  // Logga ut användaren genom att ta bort token och användardata från localStorage och uppdatera state
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser({});
    setIsAuthenticated(false);
  };

   // Function to update the authentication status and user data
   const updating = () => {
    console.log('Updating authentication status...');
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(storedUser));
    } else {
      logout();
    }
  };

  // Effect to listen for changes in user data and trigger sideNav update
  useEffect(() => {
    updating();
  }, [user.username, user.avatar]); // listen for changes to username and avatar

  // autentiseringsstatus och funktioner till resten av appen
  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, updating , user}}>
      {children}
    </AuthContext.Provider>
  );
};
