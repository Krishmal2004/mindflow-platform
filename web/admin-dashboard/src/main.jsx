import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './assets/css/index.css'
import App from './App.jsx'

// Add a loading indicator while the app is initializing
const rootElement = document.getElementById('root');
rootElement.innerHTML = `
  <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f5f7fa;">
    <div style="text-align: center;">
      <div style="width: 50px; height: 50px; border: 5px solid #f3f3f3; border-top: 5px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
      <p style="margin-top: 1rem; color: #7f8c8d;">Loading application...</p>
    </div>
  </div>
  <style>
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
`;

// Create root after a short delay to allow the loading indicator to show
setTimeout(() => {
  createRoot(rootElement).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  )
}, 100);