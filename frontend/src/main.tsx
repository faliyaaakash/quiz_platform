import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles.css'
import 'react-day-picker/dist/style.css';

import { GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

console.log('🚀 main.tsx: Loading application...');
console.log('🔑 GOOGLE_CLIENT_ID detected:', GOOGLE_CLIENT_ID ? 'YES' : 'NO');

const rootElement = document.getElementById('root');
if (!rootElement) {
    console.error('❌ CRITICAL: #root element not found in DOM!');
} else {
    console.log('✅ Found #root element, mounting React...');
    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            {GOOGLE_CLIENT_ID ? (
                <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                    <App />
                </GoogleOAuthProvider>
            ) : (
                <App />
            )}
        </React.StrictMode>,
    );
}
