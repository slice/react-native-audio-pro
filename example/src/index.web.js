import React from 'react';
import { createRoot } from 'react-dom/client';
import SimpleWebExample from './SimpleWebExample';

// Set up styles for web
const style = document.createElement('style');
style.textContent = `
  html, body, #root {
    height: 100%;
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  #root {
    display: flex;
    flex-direction: column;
  }
`;
document.head.appendChild(style);

// Initialize web app using React 18+ API
const rootElement = document.getElementById('root');
const root = createRoot(rootElement);
root.render(<SimpleWebExample />);
