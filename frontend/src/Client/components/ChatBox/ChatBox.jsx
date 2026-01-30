/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import { Send, MessageCircle, Loader2 } from "lucide-react";
import "./ChatBox.css";

import { useTranslation } from "react-i18next";
import { sendMessage, getChatHistory, sendMessageWithMovies } from "../../../services/chatService";
import MovieSuggestionCard from "./MovieSuggestionCard";

const ChatBox = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll down
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Reload chat history 
  useEffect(() => {
    if (isOpen) {
      getChatHistory().then((history) => {
        const formattedHistory = history.map(msg => ({
          sender: msg.sender || (msg.role === "user" ? "user" : "bot"),
          message: msg.content || msg.message || "",
          movies: msg.movies || null
        }));
        setMessages(formattedHistory);
      });
    }
  }, [isOpen]);

  // Check if message is movie-related
  const isMovieRelated = (text) => {
    const movieKeywords = [
      'phim', 'movie', 'film', 'gợi ý', 'suggest', 'recommend', 
      'xem gì', 'phim hay', 'chiếu rạp', 'cinema', 'thể loại','types', 
      'genre', 'diễn viên', 'actor', 'đạo diễn', 'director'
    ];
    const lowerText = text.toLowerCase();
    return movieKeywords.some(keyword => lowerText.includes(keyword));
  };

  // Send message
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { sender: "user", message: input };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    try {
      // Check if query is movie-related
      if (isMovieRelated(currentInput)) {
        const response = await sendMessageWithMovies(currentInput);
        const botMessage = { 
          sender: "bot", 
          message: response.reply || response.message || "",
          movies: response.movies || null
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        const reply = await sendMessage(currentInput);
        const botMessage = { sender: "bot", message: reply };
        setMessages((prev) => [...prev, botMessage]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", message: "Cannot connect to server." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <>
      {!isOpen && (
        <button className="chat-toggle-btn" onClick={() => setIsOpen(true)}>
          <MessageCircle size={28} />
        </button>
      )}

      {isOpen && (
        <div className="chat-popup">
          <div className="chat-header">
            <MessageCircle size={20}/>
            {t('Chat Movie Assistant')}
            <button onClick={() => setIsOpen(false)} className="btn-close">
              x
            </button>
          </div>

          <div className="chat-body">
            {messages.length === 0 && (
              <div className="chat-welcome">
                <MessageCircle size={32} className="welcome-icon" />
                <p>{t('Hi, I\'m HAK cinema\'s Chat Assistant. How can I help you today?')}</p>
                <p className="welcome-hint">Try asking: "Suggest action movies" or "What movies are playing?"</p>
              </div>
            )}
            {messages.map((msg, index) => (
              <div key={index} className="message-wrapper">
                <div
                  className={`chat-message ${
                    msg.sender === "user" ? "user-msg" : "bot-msg"
                  }`}
                >
                  {msg.message && <div className="message-text">{msg.message}</div>}
                  {msg.movies && msg.movies.length > 0 && (
                    <div className="movie-suggestions">
                      <div className="suggestions-label">{t('Movie suggestions:')}</div>
                      {msg.movies.map((movie) => (
                        <MovieSuggestionCard key={movie.id} movie={movie} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="chat-message bot-msg loading-msg">
                <Loader2 size={16} className="loader-icon" />
                <span>{t('Searching...')}</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('Type your message...')}
              disabled={isLoading}
            />
            <button onClick={handleSend}>
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBox;
