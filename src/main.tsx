import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import './index.css';

// Accessibility initialization for Brazilian market compliance
const initializeAccessibility = () => {
  // Set document title and language if not already set
  if (!document.title) {
    document.title = 'AegisWallet - Assistente Financeiro Autônomo';
  }

  // Add high contrast mode detection
  if (window.matchMedia?.('(prefers-contrast: high)').matches) {
    document.documentElement.classList.add('high-contrast');
  }

  // Add reduced motion detection
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('reduce-motion');
  }

  // Set focus trap for screen readers
  document.documentElement.setAttribute('lang', 'pt-BR');

  // Add Brazilian e-MAG compliance metadata
  const meta = document.createElement('meta');
  meta.name = 'eMAG-compliance';
  meta.content = 'Modelo de Acessibilidade para Governo Eletrônico - Versão 3.1';
  document.head.appendChild(meta);
};

// Initialize accessibility before app render
initializeAccessibility();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
