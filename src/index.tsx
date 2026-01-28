import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

/**
 * Application entry point
 * Renders the main App component into the DOM
 */
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
