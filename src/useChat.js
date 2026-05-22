import { useState, useRef, useCallback } from 'react';
import { createChatSession, sendMessageStream } from './gemini';

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const chatRef = useRef(null);

  // Initialise or reuse the Gemini session
  const getSession = useCallback(() => {
    if (!chatRef.current) {
      chatRef.current = createChatSession();
    }
    return chatRef.current;
  }, []);

  const sendMessage = useCallback(async (userText) => {
    if (!userText.trim() || isLoading) return;

    setError(null);

    // Add user message
    const userMsg = { id: Date.now(), role: 'user', text: userText };
    setMessages((prev) => [...prev, userMsg]);

    // Add empty bot placeholder with streaming id
    const botId = Date.now() + 1;
    setMessages((prev) => [
      ...prev,
      { id: botId, role: 'bot', text: '', streaming: true },
    ]);
    setIsLoading(true);

    try {
      const session = getSession();
      await sendMessageStream(session, userText, (chunk) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botId ? { ...m, text: m.text + chunk } : m
          )
        );
      });

      // Mark streaming as done
      setMessages((prev) =>
        prev.map((m) => (m.id === botId ? { ...m, streaming: false } : m))
      );
    } catch (err) {
      console.error('Gemini error:', err);
      const errMsg = err?.message || 'Une erreur est survenue. Réessayez.';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botId
            ? { ...m, text: `⚠️ ${errMsg}`, streaming: false, error: true }
            : m
        )
      );
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, getSession]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    chatRef.current = null; // Reset Gemini session
  }, []);

  const resetSession = useCallback(() => {
    chatRef.current = null;
  }, []);

  return { messages, setMessages, isLoading, error, sendMessage, clearChat, resetSession };
}
