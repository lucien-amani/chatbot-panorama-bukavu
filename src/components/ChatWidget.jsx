import { useState, useRef, useEffect, useCallback } from 'react';
import { useChat } from '../useChat';
import { getApiKey, saveApiKey, clearApiKey } from '../gemini';

/* ── Icons ─────── */
const BotAvatar = () => (
  <div className="cw-avatar bot">
    <img src="/panorama.png" alt="Panorama Assist" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
  </div>
);
const UserAvatar = () => (
  <div className="cw-avatar user">
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
    </svg>
  </div>
);

function renderMd(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');
}

import { ConciergeBell, Utensils, Waves, Van } from 'lucide-react';

const SUGGESTIONS = [
  { icon: ConciergeBell, label: 'Réserver une chambre' },
  { icon: Utensils, label: 'Voir le menu' },
  { icon: Waves, label: 'Vue lac Kivu' },
  { icon: Van, label: 'Navette aéroport' },
];


export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const { messages, isLoading, sendMessage, clearChat, resetSession } = useChat();
  const [input, setInput] = useState('');
  const endRef = useRef(null);
  const inputRef = useRef(null);

  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');

  // Load key when panel opens or settings is toggled
  useEffect(() => {
    if (open) {
      const stored = localStorage.getItem('panorama_assist_api_key') || localStorage.getItem('hackerbot_api_key') || '';
      setApiKeyInput(stored);
    }
  }, [open, showSettings]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { if (open && !showSettings) setTimeout(() => inputRef.current?.focus(), 200); }, [open, showSettings]);

  const submit = useCallback((e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput('');
  }, [input, isLoading, sendMessage]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    saveApiKey(apiKeyInput);
    resetSession();
    setShowSettings(false);
  };

  const handleResetSettings = () => {
    clearApiKey();
    setApiKeyInput('');
    resetSession();
    setShowSettings(false);
  };

  return (
    <>
      {/* Floating button */}
      <button
        className={`cw-fab ${open ? 'open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label="Ouvrir Panorama Assist"
        title="Panorama Assist"
      >
        {open
          ? <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          : <img src="/panorama.png" alt="Panorama Assist" className="cw-fab-img" />
        }
        <span className="cw-fab-badge" />
      </button>

      {/* Chat panel */}
      <div className={`cw-panel ${open ? 'open' : ''}`}>
        {/* Header */}
        <div className="cw-header">
          <div className="cw-header-info">
            <img src="/panorama.png" alt="Panorama Assist" className="cw-header-logo" />
            <div>
              <div className="cw-header-title">Panorama Assist</div>
              <div className="cw-header-status"><span className="cw-dot" /> En ligne</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button className={`cw-clear-btn ${showSettings ? 'active' : ''}`} onClick={() => setShowSettings(s => !s)} title="Paramètres Clé API">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.991l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button className="cw-clear-btn" onClick={clearChat} title="Effacer l'historique">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916" />
              </svg>
            </button>
          </div>
        </div>

        {showSettings ? (
          <div className="cw-settings">
            <h3 className="cw-settings-title">Paramètres Panorama Assist</h3>
            <p className="cw-settings-desc">
              L'assistant utilise l'API Google Gemini. Si la clé par défaut est bloquée ou signalée comme divulguée, vous pouvez configurer votre propre clé d'API personnelle ci-dessous.
            </p>

            <form onSubmit={handleSaveSettings} className="cw-field-group">
              <label className="cw-label" htmlFor="apiKeyInput">Clé API Gemini</label>
              <input
                id="apiKeyInput"
                type="password"
                className="cw-settings-input"
                placeholder="Entrez votre clé API (AIzaSy...)"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
              />
              
              {localStorage.getItem('panorama_assist_api_key') || localStorage.getItem('hackerbot_api_key') ? (
                <span className="cw-key-badge">Clé API personnalisée active</span>
              ) : (
                <span className="cw-key-badge custom">Clé API par défaut active</span>
              )}

              <div className="cw-settings-buttons">
                <button type="submit" className="cw-btn cw-btn-primary" disabled={!apiKeyInput.trim()}>
                  Sauvegarder
                </button>
                <button type="button" className="cw-btn cw-btn-secondary" onClick={handleResetSettings}>
                  Réinitialiser
                </button>
              </div>
            </form>

            <div style={{ marginTop: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              Vous pouvez obtenir une clé d'API gratuite sur <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-color)', textDecoration: 'underline' }}>Google AI Studio</a>.
            </div>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="cw-messages">
              {messages.length === 0 && (
                <div className="cw-welcome">
                  <img src="/panorama.png" alt="" className="cw-welcome-logo" />
                  <p className="cw-welcome-text">Bonjour ! Je suis votre assistant exclusif.<br />Comment puis-je vous aider ?</p>
                  <div className="cw-chips">
                    {SUGGESTIONS.map(s => {
                      const IconComponent = s.icon;
                      return (
                        <button key={s.label} className="cw-chip" onClick={() => sendMessage(s.label)}>
                          <IconComponent size={14} style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline-block' }} />
                          <span>{s.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {messages.map(msg => (
                <div key={msg.id} className={`cw-msg-wrap ${msg.role === 'user' ? 'user' : ''}`}>
                  {msg.role === 'user' ? <UserAvatar /> : <BotAvatar />}
                  <div className={`cw-bubble ${msg.role}`}>
                    {msg.role === 'bot'
                      ? <div dangerouslySetInnerHTML={{ __html: `<p>${renderMd(msg.text || '')}</p>` }} />
                      : <span>{msg.text}</span>
                    }
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="cw-msg-wrap">
                  <BotAvatar />
                  <div className="cw-bubble bot">
                    <div className="cw-typing">
                      <span /><span /><span />
                    </div>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="cw-input-wrap">
              <form className="cw-form" onSubmit={submit}>
                <textarea
                  ref={inputRef}
                  className="cw-input"
                  rows={1}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Posez votre question…"
                  disabled={isLoading}
                />
                <button type="submit" className="cw-send" disabled={!input.trim() || isLoading}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </>
  );
}
