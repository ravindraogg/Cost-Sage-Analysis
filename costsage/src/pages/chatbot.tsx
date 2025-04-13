import React, { useState, useRef, useEffect } from 'react';
import './chatbot.css';
import axios from 'axios';

// Set the backend URL to localhost:5000
axios.defaults.baseURL = 'https://backedncostsage-g3exe0b2gwc0fba8.canadacentral-01.azurewebsites.net';

const CostSageChatbot: React.FC = () => {
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean; model: string; timestamp: string }>>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [selectedModel, setSelectedModel] = useState('llama-3.1-8b-instant');
  const [isWelcomeVisible, setIsWelcomeVisible] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ id: string; title: string; date: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const userEmail = localStorage.getItem('userEmail') || 'guest@example.com';

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
        console.log('Chat history response:', response.data); // Debug log
        const data = Array.isArray(response.data) ? response.data : [];
        const chats = data.map((chat: any) => ({
          id: chat._id,
          title: chat.messages[0]?.text.slice(0, 30) || 'Untitled Chat',
          date: new Date(chat.createdAt).toLocaleDateString(),
        }));
        setChatHistory(chats);
      } catch (error) {
        console.error('Failed to fetch chat history:', error);
        setChatHistory([]); // Fallback to empty array
      }
    };
    fetchChatHistory();
  }, [userEmail]);

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
            text: 'I’ve processed your file. How can I assist further?',
            isUser: false,
            model: selectedModel,
            timestamp: new Date().toISOString(),
          },
        ];
        setMessages(newMessages);
        setIsWelcomeVisible(false);

        // Save to MongoDB
        await axios.post('/api/chats', {
          userEmail,
          message: `[File uploaded: ${response.data.filename}]`,
          isUser: true,
          model: selectedModel,
        });
        await axios.post('/api/chats', {
          userEmail,
          message: 'I’ve processed your file. How can I assist further?',
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
            text: 'I’ve processed your file. How can I assist further?',
            isUser: false,
            model: selectedModel,
            timestamp: new Date().toISOString(),
          },
        ];
        setMessages(newMessages);
        setIsWelcomeVisible(false);

        // Save to MongoDB
        await axios.post('/api/chats', {
          userEmail,
          message: `[File uploaded: ${response.data.filename}]`,
          isUser: true,
          model: selectedModel,
        });
        await axios.post('/api/chats', {
          userEmail,
          message: 'I’ve processed your file. How can I assist further?',
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
  };

  return (
    <div className="page-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <button onClick={handleNewChat} className="new-chat-button">
            New Chat
          </button>
        </div>
        <div className="chat-history">
          <h3>History</h3>
          {chatHistory.length ? (
            <ul>
              {chatHistory.map(chat => (
                <li key={chat.id} className="chat-item">
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
          {isWelcomeVisible && (
            <div className="welcome-dialog">
              <h1>Welcome to Cost-Sage!</h1>
              <p>
                Your intelligent assistant for cost analysis and savings recommendations. Upload receipts, ask questions, or explore insights with our premium AI models.
              </p>
              <button onClick={() => setIsWelcomeVisible(false)}>Get Started</button>
            </div>
          )}
          <div className="messages-container">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message ${msg.isUser ? 'user-message' : 'bot-message'}`}
              >
                <div className="avatar-container">
                  <div className={msg.isUser ? 'user-avatar-placeholder' : 'avatar'}>
                    {msg.isUser ? userEmail[0].toUpperCase() : 'AI'}
                  </div>
                </div>
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
        <div className="input-area">
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
              rows={2}
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