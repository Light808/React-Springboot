/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import { Send, MessageCircle } from "lucide-react";
import "./ChatBox.css";
import { sendMessage, getChatHistory } from "../../../services/chatService";

const ChatBox = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  // Scroll down
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Reload chat history 
  useEffect(() => {
    if (isOpen) {
      getChatHistory().then((history) => setMessages(history));
    }
  }, [isOpen]);

  // Send message
  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", message: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const reply = await sendMessage(input);
      const botMessage = { sender: "bot", message: reply };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", message: "Cannot connect to server." },
      ]);
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
            Chat Assistant
            <button onClick={() => setIsOpen(false)} className="close-btn">
              ×
            </button>
          </div>

          <div className="chat-body">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`chat-message ${
                  msg.sender === "user" ? "user-msg" : "bot-msg"
                }`}
              >
                {msg.message}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Text message..."
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
