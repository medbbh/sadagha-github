import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import './i18n';
import './styles/rtl.css';


createRoot(document.getElementById('root')).render(
  <StrictMode>
      <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
      </BrowserRouter>
  </StrictMode>
)
