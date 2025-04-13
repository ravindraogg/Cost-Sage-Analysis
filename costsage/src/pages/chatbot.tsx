import React, { useState, useRef, useEffect } from 'react';
import './chatbot.css';
import axios from 'axios';

axios.defaults.baseURL = 'https://backedncostsage-g3exe0b2gwc0fba8.canadacentral-01.azurewebsites.net';

const CostSageChatbot: React.FC = () => {
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean; model: string; timestamp: string }>>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [selectedModel, setSelectedModel] = useState('llama-3.1-8b-instant');
  const [isWelcomeVisible, setIsWelcomeVisible] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ id: string; title: string; date: string }>>([]);
  const [isFirstPrompt, setIsFirstPrompt] = useState(true);
  const [iconPlayed, setIconPlayed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const userEmail = localStorage.getItem('userEmail') || 'guest@example.com';
  const username = localStorage.getItem('username') || 'User';
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Available Groq models
  const groqModels = [
    'llama-3.1-8b-instant',
    'llama-3.3-70b-versatile',
    'mixtral-8x7b-32768',
  ];

  // Fetch chat history
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const response = await axios.get(`/api/chats/${userEmail}`);
        const data = Array.isArray(response.data) ? response.data : [];
        const chats = data.map((chat: any) => ({
          id: chat._id,
          title: chat.messages[0]?.text.slice(0, 30) || 'Untitled Chat',
          date: new Date(chat.createdAt).toLocaleDateString(),
        }));
        setChatHistory(chats);
      } catch (error) {
        console.error('Failed to fetch chat history:', error);
        setChatHistory([]);
      }
    };
    fetchChatHistory();
  }, [userEmail]);

  // Handle chat icon animation
  useEffect(() => {
    if (isFirstPrompt && !iconPlayed) {
      const timer = setTimeout(() => {
        setIconPlayed(true);
      }, 3000); // Animation plays for 3 seconds
      return () => clearTimeout(timer);
    }
  }, [isFirstPrompt, iconPlayed]);

  // Load a specific chat
  const loadChat = async (chatId: string) => {
    try {
      const response = await axios.get(`/api/chats/${userEmail}/${chatId}`);
      const chatData = response.data;
      if (chatData && Array.isArray(chatData.messages)) {
        const formattedMessages = chatData.messages.map((msg: any) => ({
          text: msg.message,
          isUser: msg.isUser,
          model: msg.model,
          timestamp: msg.timestamp || new Date().toISOString(),
        }));
        setMessages(formattedMessages);
        setIsWelcomeVisible(false);
        setIsFirstPrompt(false);
      }
    } catch (error) {
      console.error('Failed to load chat:', error);
    }
  };

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      recognitionRef.current = new (window as any).webkitSpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsRecording(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const newMessage = {
      text: inputText,
      isUser: true,
      model: selectedModel,
      timestamp: new Date().toISOString(),
    };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInputText('');
    setIsWelcomeVisible(false);
    if (isFirstPrompt) {
      setIsFirstPrompt(false);
    }

    // Save user message to MongoDB
    try {
      await axios.post('/api/chats', {
        userEmail,
        message: inputText,
        isUser: true,
        model: selectedModel,
      });
    } catch (error) {
      console.error('Failed to save user message:', error);
    }

    // Call Groq API
    try {
      const response = await axios.post('/api/chat', {
        messages: updatedMessages.map(msg => ({
          role: msg.isUser ? 'user' : 'assistant',
          content: msg.text,
        })),
        model: selectedModel,
      });

      const botMessage = {
        text: response.data.content,
        isUser: false,
        model: selectedModel,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, botMessage]);

      // Save bot response to MongoDB
      await axios.post('/api/chats', {
        userEmail,
        message: botMessage.text,
        isUser: false,
        model: selectedModel,
      });
    } catch (error) {
      console.error('Failed to get Groq response:', error);
      setMessages(prev => [
        ...prev,
        {
          text: 'Sorry, something went wrong. Please try again.',
          isUser: false,
          model: selectedModel,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleVoiceInput = () => {
    if (!isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsRecording(true);
      } else {
        alert('Speech recognition not supported in your browser');
      }
    } else {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const formData = new FormData();
      formData.append('file', e.target.files[0]);

      try {
        const response = await axios.post('/api/upload', formData);
        const newMessages = [
          ...messages,
          {
            text: `[File uploaded: ${response.data.filename}]`,
            isUser: true,
            model: selectedModel,
            timestamp: new Date().toISOString(),
          },
          {
            text: 'Ive processed your file. How can I assist further?',
            isUser: false,
            model: selectedModel,
            timestamp: new Date().toISOString(),
          },
        ];
        setMessages(newMessages);
        setIsWelcomeVisible(false);
        if (isFirstPrompt) {
          setIsFirstPrompt(false);
        }

        // Save to MongoDB
        await axios.post('/api/chats', {
          userEmail,
          message: `[File uploaded: ${response.data.filename}]`,
          isUser: true,
          model: selectedModel,
        });
        await axios.post('/api/chats', {
          userEmail,
          message: 'Ive processed your file. How can I assist further?',
          isUser: false,
          model: selectedModel,
        });
      } catch (error) {
        console.error('File upload failed:', error);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await axios.post('/api/upload', formData);
        const newMessages = [
          ...messages,
          {
            text: `[File uploaded: ${response.data.filename}]`,
            isUser: true,
            model: selectedModel,
            timestamp: new Date().toISOString(),
          },
          {
            text: 'Ive processed your file. How can I assist further?',
            isUser: false,
            model: selectedModel,
            timestamp: new Date().toISOString(),
          },
        ];
        setMessages(newMessages);
        setIsWelcomeVisible(false);
        if (isFirstPrompt) {
          setIsFirstPrompt(false);
        }

        // Save to MongoDB
        await axios.post('/api/chats', {
          userEmail,
          message: `[File uploaded: ${response.data.filename}]`,
          isUser: true,
          model: selectedModel,
        });
        await axios.post('/api/chats', {
          userEmail,
          message: 'Ive processed your file. How can I assist further?',
          isUser: false,
          model: selectedModel,
        });
      } catch (error) {
        console.error('File upload failed:', error);
      }
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setIsWelcomeVisible(true);
    setIsFirstPrompt(true);
    setIconPlayed(false);
  };
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="page-container">
      <div className={`sidebar ${sidebarOpen ? '' : 'closed'}`}>
        <div className="sidebar-header">
          <button onClick={handleNewChat} className="new-chat-button">
            <span>+</span> New Chat
          </button>
        </div>
        <div className="chat-history">
          <h3>History</h3>
          {chatHistory.length ? (
            <ul>
              {chatHistory.map(chat => (
                <li
                  key={chat.id}
                  className="chat-item"
                  onClick={() => loadChat(chat.id)}
                >
                  <span className="chat-title">{chat.title}</span>
                  <span className="chat-date">{chat.date}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-history">No chat history</p>
          )}
        </div>
      </div>
      <div className="chatbot-container">
        <nav className="navbar">
          <div className="nav-left">
            <button onClick={toggleSidebar} className="menu-button">
              ☰
            </button>
            <span className="website-name">Cost-Sage</span>
          </div>
          <div className="header-controls">
            <div className="model-selector">
              <select
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
              >
                {groqModels.map(model => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </nav>
        <div
          className={`content-container ${isDragging ? 'drag-active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          ref={messagesContainerRef}
        >
          {isDragging && (
            <div className="drag-overlay">
              <span className="drag-icon">📁</span>
              <p className="drag-text">Drop your file here</p>
            </div>
          )}
          {isWelcomeVisible && isFirstPrompt && (
            <div className="welcome-dialog">
              {!iconPlayed && (
                <img
                  src="/assets/chat-icon.gif"
                  alt="Chat Icon"
                  className="chat-icon"
                />
              )}
              <h1>{getGreeting()}, {username}!</h1>
              <p>
                How can I help you with your cost analysis today?
              </p>
              <button onClick={() => setIsWelcomeVisible(false)}>Start Chatting</button>
            </div>
          )}
          <div className={`messages-container ${isFirstPrompt && isWelcomeVisible ? 'centered' : ''}`}>
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message ${msg.isUser ? 'user-message' : 'bot-message'}`}
              >
                {!msg.isUser && (
                  <div className="avatar-container">
                    <div className="avatar">AI</div>
                  </div>
                )}
                <div className={`message-content ${msg.isUser ? '' : 'bot-response'}`}>
                  {msg.text}
                  <div className="message-timestamp">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
        <div className={`input-area ${isFirstPrompt && isWelcomeVisible ? 'centered-input' : ''}`}>
          <div className="input-card">
            <button
              onClick={handleImageUpload}
              className="action-button upload-button"
              title="Upload File"
            >
              <span>📎</span>
            </button>
            <input
              type="file"
              accept="image/*,.pdf"
              className="file-input"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <textarea
              placeholder="Ask about your costs..."
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              className="text-input"
              rows={1}
            />
            <button
              onClick={handleVoiceInput}
              className={`action-button ${isRecording ? 'voice-button recording' : 'voice-button'}`}
              title="Voice Input"
            >
              <span>🎤</span>
            </button>
            <button
              onClick={handleSendMessage}
              className={`action-button send-button ${!inputText.trim() ? 'disabled' : ''}`}
              title="Send Message"
              disabled={!inputText.trim()}
            >
              <span>➤</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostSageChatbot;