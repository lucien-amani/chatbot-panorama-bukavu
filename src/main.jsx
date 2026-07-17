import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import App from './App.jsx';
import './index.css';

// ── SURCHARGE GLOBALE DE window.alert POUR FACILITER LA COPIE ──
window.alert = function (message) {
  const dialog = document.createElement('div');
  dialog.className = 'custom-alert-overlay';
  dialog.innerHTML = `
    <div class="custom-alert-box">
      <div class="custom-alert-header">
        <span class="custom-alert-icon">⚠️</span>
        <h3>Notification Système</h3>
      </div>
      <div class="custom-alert-body">
        <div class="custom-alert-text">${String(message).replace(/\n/g, '<br/>')}</div>
      </div>
      <div class="custom-alert-footer">
        <button class="custom-alert-copy-btn" type="button">📋 Copier le message</button>
        <button class="custom-alert-close-btn" type="button">Fermer</button>
      </div>
    </div>
  `;
  document.body.appendChild(dialog);

  const closeBtn = dialog.querySelector('.custom-alert-close-btn');
  const copyBtn = dialog.querySelector('.custom-alert-copy-btn');

  const close = () => {
    dialog.classList.add('fade-out');
    setTimeout(() => dialog.remove(), 200);
  };

  closeBtn.onclick = close;

  copyBtn.onclick = () => {
    navigator.clipboard.writeText(message).then(() => {
      copyBtn.innerText = '✅ Copié dans le presse-papiers !';
      copyBtn.style.background = '#10b981';
      copyBtn.style.color = '#fff';
      setTimeout(() => {
        copyBtn.innerText = '📋 Copier le message';
        copyBtn.style.background = '';
        copyBtn.style.color = '';
      }, 2000);
    }).catch(err => {
      console.error('Erreur lors de la copie', err);
    });
  };

  dialog.onclick = (e) => {
    if (e.target === dialog) close();
  };
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
