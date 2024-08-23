import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import { AuthProvider } from './AuthContext';

Sentry.init({
  dsn: 'https://144c918fdc47b3facd45ab6f0d10b518@o4507777786970112.ingest.de.sentry.io/4507777877540944',
  tracesSampleRate: 1.0,
});



ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
