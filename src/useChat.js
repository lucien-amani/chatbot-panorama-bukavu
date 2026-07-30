import { useState, useRef, useEffect, useCallback } from 'react';
import { createChatSession, sendMessageStream } from './gemini';
import { chambresApi, hotelsApi } from './lib/api';

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chambresData, setChambresData] = useState([]);
  const [hotels, setHotels] = useState([]);
  const chatRef = useRef(null);

  // Keep a reference to the latest messages to avoid dependency cycles in sendMessage
  const messagesRef = useRef([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Charger les données de chambres et d'hôtels au démarrage — injectées dans le system prompt
  useEffect(() => {
    // On charge sans filtre hotel_slug pour avoir tous les hôtels
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/chambres`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        setChambresData(Array.isArray(data) ? data : []);
        chatRef.current = null;
      })
      .catch(() => setChambresData([]));

    // Charger la liste des hôtels
    hotelsApi.liste()
      .then(data => {
        setHotels(data);
        chatRef.current = null;
      })
      .catch(() => setHotels([]));
  }, []);

  // Initialise ou réutilise la session Gemini (avec données chambres et hôtels)
  const getSession = useCallback(() => {
    if (!chatRef.current) {
      chatRef.current = createChatSession(chambresData, [], hotels);
    }
    return chatRef.current;
  }, [chambresData, hotels]);

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
      // Fetch fresh room and hotels data before sending message to get real-time status/price/availability
      let freshRooms = chambresData;
      let freshHotels = hotels;
      try {
        const [r, hData] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/chambres`),
          hotelsApi.liste()
        ]);
        if (r.ok) { freshRooms = await r.json(); setChambresData(freshRooms); }
        freshHotels = hData;
        setHotels(freshHotels);
      } catch (fetchErr) {
        console.warn('Could not fetch fresh data, using cached data:', fetchErr);
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
      const session = createChatSession(freshRooms, history, freshHotels);
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

