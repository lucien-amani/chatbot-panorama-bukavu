import { useState, useRef, useEffect, useCallback } from 'react';
import { createChatSession, sendMessageStream } from './gemini';
import { chambresApi } from './lib/api';

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chambresData, setChambresData] = useState([]);
  const chatRef = useRef(null);

  // Keep a reference to the latest messages to avoid dependency cycles in sendMessage
  const messagesRef = useRef([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Charger les données des chambres au démarrage — injectées dans le system prompt
  useEffect(() => {
    chambresApi.liste()
      .then(data => {
        setChambresData(data);
        chatRef.current = null; // Reset session pour la recréer avec les nouvelles données
      })
      .catch(() => {
        // Si l'API est indisponible, le chatbot continuera sans données de chambres
        setChambresData([]);
      });
  }, []);

  // Initialise ou réutilise la session Gemini (avec données chambres)
  const getSession = useCallback(() => {
    if (!chatRef.current) {
      chatRef.current = createChatSession(chambresData);
    }
    return chatRef.current;
  }, [chambresData]);

  const sendMessage = useCallback(async (userText) => {
    if (!userText.trim() || isLoading) return;

    setError(null);

    const userMsg = { id: Date.now(), role: 'user', text: userText };
    setMessages((prev) => [...prev, userMsg]);

    const botId = Date.now() + 1;
    setMessages((prev) => [
      ...prev,
      { id: botId, role: 'bot', text: '', streaming: true },
    ]);
    setIsLoading(true);

    try {
      // Fetch fresh room data before sending message to get real-time status/price/availability
      let freshRooms = chambresData;
      try {
        freshRooms = await chambresApi.liste();
        setChambresData(freshRooms);
      } catch (fetchErr) {
        console.warn('Could not fetch fresh room data, using cached data:', fetchErr);
      }

      // Re-create the Gemini session with the fresh room data, preserving existing history
      let history = [];
      if (chatRef.current) {
        try {
          history = chatRef.current.getHistory();
        } catch (histErr) {
          console.warn('Could not get history from current chat session:', histErr);
        }
      }

      // If history is empty but we have messages, rebuild it
      if (history.length === 0 && messagesRef.current.length > 0) {
        history = messagesRef.current
          .filter(m => !m.streaming && !m.error)
          .map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }],
          }));
      }

      // Recreate the session with the new systemInstruction and the history
      const session = createChatSession(freshRooms, history);
      chatRef.current = session;

      await sendMessageStream(session, userText, (chunk) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botId ? { ...m, text: m.text + chunk } : m
          )
        );
      });

      setMessages((prev) =>
        prev.map((m) => (m.id === botId ? { ...m, streaming: false } : m))
      );
    } catch (err) {
      console.error('Gemini error:', err);
      const errMsg = err?.message || 'Une erreur est survenue. Réessayez.';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botId
            ? { ...m, text: errMsg, streaming: false, error: true }
            : m
        )
      );
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, chambresData]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    chatRef.current = null;
  }, []);

  const resetSession = useCallback(() => {
    chatRef.current = null;
  }, []);

  return { messages, setMessages, isLoading, error, sendMessage, clearChat, resetSession };
}

