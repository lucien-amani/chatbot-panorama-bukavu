import { useState, useEffect, useRef, useCallback } from 'react';
import { useChat } from './useChat';


const SunIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21M5.25 5.25l1.59 1.59m10.32 10.32l1.59 1.59M3 12h2.25m13.5 0H21M5.25 18.75l1.59-1.59m10.32-10.32l1.59-1.59M12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9z" />
  </svg>
);

const MoonIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
  </svg>
);

const SendIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
  </svg>
);

const TrashIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const StopIcon = () => (
  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
    <rect x="5" y="5" width="14" height="14" rx="3" />
  </svg>
);

const HistoryIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const MicIcon = ({ recording }) => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
  </svg>
);

const SpeakerIcon = ({ active }) => (
  <svg width="16" height="16" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
  </svg>
);

/* ── Premium Avatars using panorama.png ─────────────────── */
const BotAvatarIcon = () => (
  <div className="avatar bot" style={{ background: 'transparent', border: 'none', padding: 0 }}>
    <img src="/panorama.png" alt="Panorama Assist" className="avatar-img" style={{ borderRadius: '50%' }} />
  </div>
);

const UserAvatarIcon = () => (
  <div className="avatar user" style={{ background: 'var(--border-color)', color: 'var(--text-main)' }}>
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  </div>
);

/* ── Markdown-lite renderer ─────────────────────────────── */
function renderMarkdown(text) {
  let html = text;

  // Temporarily pull out code blocks to avoid applying markdown rules within code blocks
  const codeBlocks = [];
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (match, lang, code) => {
    const id = `__CODE_BLOCK_${codeBlocks.length}__`;

    // Escape HTML inside code block
    const escapedCode = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    // Safe base64 encoding to prevent encoding/decoding crashes on non-ascii characters
    const encodedCode = btoa(unescape(encodeURIComponent(code.trim())));

    const blockHtml = `
      <div class="code-block-wrapper">
        <div class="code-block-header">
          <span class="code-block-lang">${lang || 'code'}</span>
          <button class="copy-code-btn" data-code="${encodedCode}">Copier</button>
        </div>
        <pre><code class="code-block">${escapedCode}</code></pre>
      </div>
    `;
    codeBlocks.push(blockHtml);
    return id;
  });

  // Apply basic markdown formatting
  html = html
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="code-inline">$1</code>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="md-h2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="md-h1">$1</h1>')
    // Lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul class="md-list">$1</ul>')
    // Line breaks
    .replace(/\n\n/g, '</p><p class="md-p">')
    .replace(/\n/g, '<br/>');

  // Insert code blocks back
  codeBlocks.forEach((blockHtml, index) => {
    html = html.replace(`__CODE_BLOCK_${index}__`, blockHtml);
  });

  return `<p class="md-p">${html}</p>`;
}

/* ── Typing indicator ───────────────────────────────────── */
function TypingIndicator() {
  return (
    <div className="message-wrapper">
      <BotAvatarIcon />
      <div className="message-bubble bot">
        <div className="typing-indicator">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
      </div>
    </div>
  );
}

/* ── Message bubble ─────────────────────────────────────── */
function Message({ msg, onToggleSpeech, activeSpeechId }) {
  const isUser = msg.role === 'user';
  const isBot = msg.role === 'bot';
  const isSpeaking = activeSpeechId === msg.id;

  return (
    <div className={`message-wrapper ${isUser ? 'user' : ''}`}>
      {isUser ? <UserAvatarIcon /> : <BotAvatarIcon />}
      <div
        className={`message-bubble ${isUser ? 'user' : 'bot'} ${msg.streaming ? 'stream-cursor' : ''}`}
        style={msg.error ? { borderColor: '#ef4444', color: '#ef4444' } : {}}
      >
        {isBot && (
          <button
            className={`speech-btn ${isSpeaking ? 'active' : ''}`}
            onClick={() => onToggleSpeech(msg.id, msg.text)}
            title={isSpeaking ? "Arrêter la lecture" : "Lire le message"}
            aria-label="Lire le message à haute voix"
          >
            <SpeakerIcon active={isSpeaking} />
          </button>
        )}
        {isBot ? (
          <div
            className="md-content"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text || '') }}
          />
        ) : (
          <span>{msg.text}</span>
        )}
      </div>
    </div>
  );
}

/* ── Suggestion chips ───────────────────────────────────── */
const SUGGESTIONS = [
  {
    icon: '🛎️',
    title: 'Réserver une chambre',
    desc: 'Tarifs, vue sur le lac Kivu et commodités.',
    query: "🛎️ Réserver une chambre à l'Hôtel Panorama"
  },
  {
    icon: '🍽️',
    title: 'Restauration & Repas',
    desc: 'Découvrir nos plats et options gourmandes.',
    query: "🍽️ Quels sont les repas proposés au restaurant ?"
  },
  {
    icon: '🌊',
    title: 'Cadre & Lac Kivu',
    desc: 'Tout savoir sur le cadre de l\'hôtel à Bukavu.',
    query: "🌊 Vue sur le lac Kivu et commodités des chambres"
  },
  {
    icon: '🇨🇩',
    title: 'Protocoles d\'accueil',
    desc: 'Normes de courtoisie et d\'accueil des hôtes en RDC.',
    query: "🇨🇩 Protocoles d'accueil des hôtes en RDC"
  }
];

/* ── Welcome screen ─────────────────────────────────────── */
function WelcomeScreen({ onSuggestion }) {
  return (
    <div className="welcome-screen">
      <div className="welcome-logo-wrap">
        <img src="/panorama.png" alt="Panorama Assist" className="welcome-logo-img" />
      </div>
      <div>
        <h1 className="welcome-title">Panorama Assist</h1>
        <p className="welcome-subtitle">
          Votre assistant virtuel de haut standing pour l'Hôtel Panorama à Bukavu (RDC).<br />
          Posez vos questions sur les réservations de chambres, les repas et les protocoles d'accueil.
        </p>
      </div>
      <div className="suggestion-chips">
        {SUGGESTIONS.map((s) => (
          <button key={s.title} className="chip" onClick={() => onSuggestion(s.query)}>
            <span className="chip-title">{s.icon} {s.title}</span>
            <span className="chip-desc">{s.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Main App ───────────────────────────────────────────── */
export default function App() {
  const { messages, setMessages, isLoading, error, sendMessage, clearChat, resetSession } = useChat();
  const [input, setInput] = useState('');
  const [isDark, setIsDark] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 900);
  const [customKeyInput, setCustomKeyInput] = useState('');
  
  // History of discussion sessions
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  // Load custom API key on mount
  useEffect(() => {
    setCustomKeyInput(localStorage.getItem('hackerbot_api_key') || '');
  }, []);

  const saveKeyInline = () => {
    if (customKeyInput.trim()) {
      localStorage.setItem('hackerbot_api_key', customKeyInput.trim());
    } else {
      localStorage.removeItem('hackerbot_api_key');
    }
    resetSession();
    clearChat();
  };

  const isQuotaError = error && (
    error.includes('429') || 
    error.toLowerCase().includes('quota') || 
    error.toLowerCase().includes('limit') || 
    error.toLowerCase().includes('exhausted')
  );

  // ── Web Speech API (STT & TTS) ──
  const [isRecording, setIsRecording] = useState(false);
  const [activeSpeechId, setActiveSpeechId] = useState(null);
  const recognitionRef = useRef(null);

  // Clean up any speaking voice on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  // Initialize Speech Recognition on mount
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'fr-FR';

      rec.onstart = () => {
        setIsRecording(true);
      };

      rec.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        if (transcript) {
          setInput((prev) => prev ? prev + ' ' + transcript : transcript);
        }
      };

      rec.onerror = (e) => {
        console.error('Speech recognition error:', e);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const handleToggleRecording = () => {
    if (!recognitionRef.current) {
      alert("La reconnaissance vocale n'est pas supportée par votre navigateur actuel. Veuillez utiliser Google Chrome ou Safari.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      try {
        window.speechSynthesis?.cancel();
        setActiveSpeechId(null);
        recognitionRef.current.start();
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  const handleToggleSpeech = (msgId, text) => {
    if (activeSpeechId === msgId) {
      window.speechSynthesis?.cancel();
      setActiveSpeechId(null);
    } else {
      window.speechSynthesis?.cancel();
      
      const cleanText = text
        .replace(/<\/?[^>]+(>|$)/g, "")
        .replace(/[#*`_~🛎️🍽️🌊🇨🇩📍☕]/g, "")
        .replace(/Copier/g, "")
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);

      // Language detection helper
      if (cleanText.toLowerCase().includes('welcome') || (cleanText.toLowerCase().includes('hotel') && !cleanText.toLowerCase().includes('chambre'))) {
        utterance.lang = 'en-US';
      } else if (cleanText.toLowerCase().includes('habari') || cleanText.toLowerCase().includes('jambo') || (cleanText.toLowerCase().includes('panorama') && cleanText.toLowerCase().includes('kivu'))) {
        utterance.lang = 'sw-TZ';
      } else {
        utterance.lang = 'fr-FR';
      }

      utterance.onend = () => {
        setActiveSpeechId(null);
      };
      utterance.onerror = () => {
        setActiveSpeechId(null);
      };

      setActiveSpeechId(msgId);
      window.speechSynthesis?.speak(utterance);
    }
  };

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Sync dark/light class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('light', !isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 180) + 'px';
    }
  }, [input]);

  // Dynamic session sync based on first question title
  useEffect(() => {
    if (messages.length === 0) return;

    const firstUserMsg = messages.find((m) => m.role === 'user');
    if (!firstUserMsg) return;

    // First question determines session title
    const rawTitle = firstUserMsg.text;
    const title = rawTitle.length > 35 ? rawTitle.substring(0, 35) + '...' : rawTitle;

    setSessions((prev) => {
      let activeId = currentSessionId;
      
      // Generate new active ID if not present
      if (!activeId) {
        activeId = Date.now();
        setCurrentSessionId(activeId);
        return [{ id: activeId, title, messages }, ...prev];
      }

      // If active session exists, update its title and messages
      const exists = prev.some((s) => s.id === activeId);
      if (!exists) {
        return [{ id: activeId, title, messages }, ...prev];
      }

      return prev.map((s) => (s.id === activeId ? { ...s, title, messages } : s));
    });
  }, [messages, currentSessionId]);

  // Global event listener for dynamic Copy Code buttons
  useEffect(() => {
    const handleCopyClick = async (e) => {
      const btn = e.target.closest('.copy-code-btn');
      if (!btn) return;

      const encoded = btn.getAttribute('data-code');
      if (!encoded) return;

      try {
        const decoded = decodeURIComponent(escape(atob(encoded)));
        await navigator.clipboard.writeText(decoded);

        btn.textContent = 'Copié !';
        btn.classList.add('copied');

        setTimeout(() => {
          btn.textContent = 'Copier';
          btn.classList.remove('copied');
        }, 2000);
      } catch (err) {
        console.error('Erreur lors de la copie du code:', err);
      }
    };

    document.addEventListener('click', handleCopyClick);
    return () => document.removeEventListener('click', handleCopyClick);
  }, []);

  const handleSubmit = useCallback(
    (e) => {
      e?.preventDefault();
      if (!input.trim() || isLoading) return;
      sendMessage(input.trim());
      setInput('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    },
    [input, isLoading, sendMessage]
  );

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestion = (text) => {
    setInput(text);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleNewChat = () => {
    clearChat();
    setCurrentSessionId(null);
    if (window.innerWidth <= 900) {
      setIsSidebarOpen(false); // Close sidebar on mobile
    }
  };

  const handleSelectSession = (session) => {
    setMessages(session.messages);
    setCurrentSessionId(session.id);
    resetSession();
    if (window.innerWidth <= 900) {
      setIsSidebarOpen(false); // Close sidebar on mobile
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="app-layout">
      {/* ── Mobile Sidebar Overlay ── */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* ── Brand & History Sidebar ── */}
      <aside className={`brand-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-logo-large">
            <img src="/panorama.png" alt="Panorama Assist" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          </div>
          <h2>Hôtel Panorama</h2>
          <span className="brand-tagline">Panorama Assist</span>
        </div>

        <div className="sidebar-content">
          <button className="new-chat-sidebar-btn" onClick={handleNewChat}>
            <PlusIcon />
            <span>Nouveau chat</span>
          </button>

          <div className="sidebar-section">
            <h3>Historique</h3>
            <div className="history-list">
              {sessions.length === 0 ? (
                <p className="no-history">Aucune discussion en mémoire</p>
              ) : (
                sessions.map((s) => (
                  <button
                    key={s.id}
                    className={`history-item ${s.id === currentSessionId ? 'active' : ''}`}
                    onClick={() => handleSelectSession(s)}
                  >
                    {s.title}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Hôtel Panorama Bukavu</h3>
            <p>Un cadre d'exception au bord du Lac Kivu en RDC. Chambres de prestige, gastronomie locale et internationale, et un accueil d'excellence.</p>
          </div>
        </div>
      </aside>

      {/* ── Main Chat Interface ── */}
      <div className="chat-interface">
        {/* ── Header ── */}
        <header className="app-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              id="sidebar-toggle"
              className="theme-toggle header-btn-layout"
              onClick={() => setIsSidebarOpen((o) => !o)}
              title="Historique & Infos"
              aria-label="Afficher l'historique"
            >
              <HistoryIcon />
              <span className="btn-label-desktop">Historique</span>
            </button>

            <button
              id="new-chat-header"
              className="theme-toggle"
              onClick={handleNewChat}
              title="Nouveau chat"
              aria-label="Démarrer un nouveau chat"
            >
              <PlusIcon />
            </button>
          </div>

          <div className="header-center-title">
            <span>Panorama Assist</span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div className="header-status">
              <span className="status-dot" />
              <span className="status-text-desktop">Panorama Bukavu</span>
            </div>

            <button
              id="theme-toggle"
              className="theme-toggle"
              onClick={() => setIsDark((d) => !d)}
              title={isDark ? 'Mode clair' : 'Mode sombre'}
              aria-label="Basculer le thème"
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </header>

        {/* ── Chat messages ── */}
        <main className="chat-container" id="chat-messages">
          {!hasMessages ? (
            <WelcomeScreen onSuggestion={handleSuggestion} />
          ) : (
            <>
              {messages.map((msg) => (
                <Message
                  key={msg.id}
                  msg={msg}
                  onToggleSpeech={handleToggleSpeech}
                  activeSpeechId={activeSpeechId}
                />
              ))}
              {isLoading && !messages[messages.length - 1]?.streaming && (
                <TypingIndicator />
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </main>

        {/* ── Quota error banner ── */}
        {isQuotaError && (
          <div className="quota-banner" role="alert">
            <div className="quota-banner-icon">⚠️</div>
            <div className="quota-banner-body">
              <strong>Limite de quota atteinte</strong>
              <p>La clé API par défaut a atteint sa limite journalière gratuite (20 req/jour).<br />Saisissez votre propre clé API Google Gemini pour continuer.</p>
              <div className="quota-key-row">
                <input
                  type="password"
                  className="quota-key-input"
                  placeholder="AIzaSy..."
                  value={customKeyInput}
                  onChange={(e) => setCustomKeyInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveKeyInline()}
                  aria-label="Clé API Gemini personnalisée"
                />
                <button className="quota-key-save-btn" onClick={saveKeyInline}>
                  Enregistrer &amp; Réessayer
                </button>
              </div>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="quota-get-key-link"
              >
                Obtenir une clé gratuite sur Google AI Studio →
              </a>
            </div>
          </div>
        )}

        {/* ── Input area ── */}
        <footer className="input-area">
          <form className="input-form" onSubmit={handleSubmit} id="chat-form">
            <div className="input-wrapper-pill">
              {/* Text input */}
              <textarea
                ref={textareaRef}
                id="chat-input"
                className="chat-input"
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Posez votre question sur les chambres, repas ou l'accueil à l'Hôtel Panorama..."
                disabled={isLoading}
                autoFocus
                aria-label="Message"
              />

              {/* Action buttons inside the pill */}
              <div className="pill-actions">
                {/* Clear button */}
                {hasMessages && (
                  <button
                    type="button"
                    id="clear-chat"
                    className="clear-btn"
                    onClick={clearChat}
                    title="Effacer la conversation"
                    aria-label="Effacer la conversation"
                  >
                    <TrashIcon />
                  </button>
                )}

                {/* Microphone button */}
                <button
                  type="button"
                  className={`mic-btn ${isRecording ? 'recording' : ''}`}
                  onClick={handleToggleRecording}
                  title={isRecording ? 'Écoute en cours... Cliquez pour arrêter' : 'Dicter le message'}
                  aria-label="Dicter le message"
                >
                  <MicIcon recording={isRecording} />
                </button>

                {/* Send / Stop button */}
                <button
                  type="submit"
                  id="send-btn"
                  className={`send-btn ${input.trim() ? 'active-input' : ''} ${isLoading ? 'loading' : ''}`}
                  disabled={!input.trim() && !isLoading}
                  title={isLoading ? 'Génération en cours…' : 'Envoyer'}
                  aria-label="Envoyer le message"
                >
                  {isLoading ? <StopIcon /> : <SendIcon />}
                </button>
              </div>
            </div>
          </form>

          <p className="input-hint">
            Panorama Assist · Service d'assistance exclusif · Hôtel Panorama Bukavu, RDC
          </p>
        </footer>
      </div>
    </div>
  );
}
