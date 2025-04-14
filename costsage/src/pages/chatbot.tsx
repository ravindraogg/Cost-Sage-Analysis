import React, { useState, useRef, useEffect } from 'react';
import { PlusCircle, Menu, Paperclip, Mic, Send } from 'lucide-react';
import './chatbot.css';

interface Message {
  text: string;
  isUser: boolean;
  timestamp?: string;
  model?: string;
}

interface Chat {
  _id: string;
  userEmail: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export default function CostSageChatbot() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isWelcomeVisible, setIsWelcomeVisible] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isFirstPrompt, setIsFirstPrompt] = useState(true);
  const [iconPlayed, setIconPlayed] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('llama-3.1-8b-instant');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get user info from localStorage
  const username = localStorage.getItem('username') || 'User';
  const userEmail = localStorage.getItem('userEmail') || 'user@example.com';

  // Backend base URL
  const API_BASE_URL = 'https://backedncostsage-g3exe0b2gwc0fba8.canadacentral-01.azurewebsites.net'; // Matches backend port

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Fetch chats for the user
  useEffect(() => {
    const fetchChats = async () => {
      setIsLoadingChats(true);
      setErrorMessage(null);
      try {
        const response = await fetch(`${API_BASE_URL}/api/chats/${encodeURIComponent(userEmail)}`, {
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText.slice(0, 100)}...`);
        }

        const data: Chat[] = await response.json();
        console.log('Fetched chats:', data);
        setChats(data);
      } catch (error: any) {
        console.error('Error fetching chats:', error);
        setErrorMessage(`Failed to load chats: ${error.message}`);
        setChats([]);
      } finally {
        setIsLoadingChats(false);
      }
    };

    if (userEmail) {
      fetchChats();
    } else {
      setErrorMessage('No user email provided');
      setIsLoadingChats(false);
    }
  }, [userEmail]);

  // Load messages for the selected chat
  useEffect(() => {
    if (selectedChatId) {
      const selectedChat = chats.find((chat) => chat._id === selectedChatId);
      if (selectedChat) {
        setMessages(selectedChat.messages);
        setIsWelcomeVisible(false);
      }
    } else {
      setMessages([]);
      setIsWelcomeVisible(true);
    }
  }, [selectedChatId, chats]);

  // Handle chat icon animation
  useEffect(() => {
    if (isFirstPrompt && !iconPlayed) {
      const timer = setTimeout(() => {
        setIconPlayed(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isFirstPrompt, iconPlayed]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleNewChat = () => {
    setMessages([]);
    setSelectedChatId(null);
    setIsWelcomeVisible(true);
    setIsFirstPrompt(true);
    setIconPlayed(false);
    setErrorMessage(null);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      text: inputText,
      isUser: true,
      timestamp: new Date().toISOString(),
      model: selectedModel,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText(''); // Clear input
    setIsWelcomeVisible(false);
    setIsFirstPrompt(false);
    setErrorMessage(null);

    try {
      let currentChatId = selectedChatId;

      // Create a new chat if none is selected
      if (!currentChatId) {
        const newChatResponse = await fetch(`${API_BASE_URL}/api/chats/new`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail,
            initialMessage: inputText,
            model: selectedModel,
          }),
        });
        if (!newChatResponse.ok) {
          const errorText = await newChatResponse.text();
          throw new Error(`Failed to create new chat: HTTP ${newChatResponse.status}: ${errorText.slice(0, 100)}...`);
        }
        const newChatData = await newChatResponse.json();
        currentChatId = newChatData.chatId;
        setSelectedChatId(currentChatId);
      } else {
        // Add user message to existing chat
        const saveUserResponse = await fetch(`${API_BASE_URL}/api/chats/${currentChatId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: inputText,
            isUser: true,
            model: selectedModel,
          }),
        });
        if (!saveUserResponse.ok) {
          const errorText = await saveUserResponse.text();
          throw new Error(`Failed to save user message: HTTP ${saveUserResponse.status}: ${errorText.slice(0, 100)}...`);
        }
      }

      // Get AI response
      const aiResponse = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((msg) => ({
            role: msg.isUser ? 'user' : 'assistant',
            content: msg.text,
          })),
          model: selectedModel,
        }),
      });
      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        throw new Error(`Failed to get AI response: HTTP ${aiResponse.status}: ${errorText.slice(0, 100)}...`);
      }
      const aiData = await aiResponse.json();

      const botMessage: Message = {
        text: aiData.content,
        isUser: false,
        timestamp: new Date().toISOString(),
        model: selectedModel,
      };

      // Save bot message
      const saveBotResponse = await fetch(`${API_BASE_URL}/api/chats/${currentChatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: aiData.content,
          isUser: false,
          model: selectedModel,
        }),
      });
      if (!saveBotResponse.ok) {
        const errorText = await saveBotResponse.text();
        throw new Error(`Failed to save bot message: HTTP ${saveBotResponse.status}: ${errorText.slice(0, 100)}...`);
      }

      // Update messages and refresh chats
      setMessages((prev) => [...prev, botMessage]);
      const updatedChats = await fetch(`${API_BASE_URL}/api/chats/${encodeURIComponent(userEmail)}`).then((res) => {
        if (!res.ok) throw new Error(`Failed to refresh chats: HTTP ${res.status}`);
        return res.json();
      });
      setChats(updatedChats);
    } catch (error: any) {
      console.error('Error in chat:', error);
      setErrorMessage(`Chat error: ${error.message}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId);
    setIsFirstPrompt(false);
    setErrorMessage(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`File upload failed: HTTP ${response.status}: ${errorText.slice(0, 100)}...`);
      }
      const data = await response.json();
      alert(data.message);
    } catch (error: any) {
      console.error('Error uploading file:', error);
      setErrorMessage(`File upload error: ${error.message}`);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="sidebar-header">
          <button onClick={handleNewChat} className="new-chat-button">
            <PlusCircle size={18} />
            <span>New Chat</span>
          </button>
        </div>

        <div className="sidebar-content">
          <h3 className="sidebar-history-title">History</h3>
          {errorMessage && <p className="error-message">{errorMessage}</p>}
          {isLoadingChats ? (
            <p className="loading-history">Loading history...</p>
          ) : chats.length ? (
            <ul>
              {chats.map((chat) => (
                <li
                  key={chat._id}
                  className={`history-item ${selectedChatId === chat._id ? 'history-item-selected' : ''}`}
                  onClick={() => handleChatSelect(chat._id)}
                >
                  <span className="history-title">
                    {chat.messages.find((m) => m.isUser)?.text?.slice(0, 20) || 'Untitled Chat'}
                  </span>
                  <span className="history-date">
                    {new Date(chat.updatedAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-history">No chat history</p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Navbar */}
        <nav className="navbar">
          <div className="navbar-left">
            <button onClick={toggleSidebar} className="menu-button">
              <Menu size={22} />
            </button>
            <span className="app-title">Cost-Sage</span>
            <img src="/assets/chat-icon.gif" alt="Chat Icons" className="chat-icons" />
          </div>

          <div className="navbar-right">
            <div className="model-selector-container">
              <select
                className="model-selector"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                <option value="llama-3.1-8b-instant">llama-3.1-8b-instant</option>
                <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile</option>
                <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
              </select>
            </div>
          </div>
        </nav>

        {/* Content Area */}
        <div className="chat-container">
          {/* Welcome dialog */}
          {isWelcomeVisible && isFirstPrompt && messages.length === 0 && (
            <div className="welcome-dialog">
              {!iconPlayed && (
                <img src="/assets/chat-icon.gif" alt="Chat Icon" className="chat-icon" />
              )}
              <h1 className="welcome-title">
                {getGreeting()}, {username}!
              </h1>
              <p className="welcome-text">
                How can I help you with your cost analysis today?
              </p>
            </div>
          )}

          {/* Messages */}
          <div className="messages-container">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message ${msg.isUser ? 'message-user' : 'message-bot'}`}
              >
                {!msg.isUser && (
                  <div className="bot-avatar">
                    <span>AI</span>
                  </div>
                )}
                <div className={`message-bubble ${msg.isUser ? 'bubble-user' : 'bubble-bot'}`}>
                  <p>{msg.text}</p>
                  <div
                    className={`message-timestamp ${
                      msg.isUser ? 'timestamp-user' : 'timestamp-bot'
                    }`}
                  >
                    {msg.timestamp
                      ? new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Just now'}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="input-container">
          <div className="input-wrapper">
            <button
              className="icon-button"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip size={20} />
            </button>
            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />

            <textarea
              className="input-textarea"
              placeholder="Ask about your costs..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              rows={1}
            />

            <button className="icon-button">
              <Mic size={20} />
            </button>

            <button
              className={`send-button ${inputText.trim() ? 'send-active' : 'send-disabled'}`}
              onClick={handleSendMessage}
              disabled={!inputText.trim()}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}