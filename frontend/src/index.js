// src/index.js

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Assuming your App component is in App.js or App.jsx
import './index.css'; // This line imports your global CSS with Tailwind

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
