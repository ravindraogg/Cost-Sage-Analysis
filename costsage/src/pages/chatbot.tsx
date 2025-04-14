import React, { useState, useRef, useEffect } from 'react';
import { PlusCircle, Menu, Paperclip, Mic, Send, X, Trash2, Home  } from 'lucide-react';
import './chatbot.css';
import { useNavigate } from 'react-router-dom';

interface Message {
  text: string;
  isUser: boolean;
  timestamp?: string;
  model?: string;
  attachments?: FileAttachment[];
}

interface FileAttachment {
  name: string;
  type: string;
  size: number;
  url?: string;
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
  const [uploadedFiles, setUploadedFiles] = useState<FileAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [waitingForResponse, setWaitingForResponse] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get user info from localStorage
  const username = localStorage.getItem('username') || 'User';
  const userEmail = localStorage.getItem('userEmail') || 'user@example.com';

  // Backend base URL
  const API_BASE_URL = 'https://backedncostsage-g3exe0b2gwc0fba8.canadacentral-01.azurewebsites.net';

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };
  const navigate = useNavigate();

  useEffect(() => {
    const fetchChats = async () => {
      setIsLoadingChats(true);
      setErrorMessage(null);
      try {
        const response = await fetch(`${API_BASE_URL}/api/chats/${encodeURIComponent(userEmail)}`, {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
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
  }, [messages, waitingForResponse]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleNewChat = () => {
    setMessages([]);
    setSelectedChatId(null);
    setIsWelcomeVisible(true);
    setIsFirstPrompt(true);
    setIconPlayed(false);
    setErrorMessage(null);
    setUploadedFiles([]);
    setWaitingForResponse(false);
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!confirm('Are you sure you want to delete this chat?')) return;

    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete chat: HTTP ${response.status}: ${errorText.slice(0, 100)}...`);
      }

      // Refresh chats
      const updatedChats = await fetch(`${API_BASE_URL}/api/chats/${encodeURIComponent(userEmail)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      }).then((res) => {
        if (!res.ok) throw new Error(`Failed to refresh chats: HTTP ${res.status}`);
        return res.json();
      });

      setChats(updatedChats);
      if (selectedChatId === chatId) {
        setSelectedChatId(null);
        setMessages([]);
        setIsWelcomeVisible(true);
      }
    } catch (error: any) {
      console.error('Error deleting chat:', error);
      setErrorMessage(`Failed to delete chat: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Function to format message text for proper display
  const formatMessageText = (text: string): React.ReactNode => {
    // Split text by newlines and create an array of elements
    const lines = text.split('\n');
    
    return lines.map((line, index) => {
      // Handle numbered list items (1., 2., etc.)
      if (/^\d+\.\s/.test(line)) {
        return <div key={index} className="list-item">{line}</div>;
      }
      // Handle bullet points
      else if (/^[-•*]\s/.test(line)) {
        return <div key={index} className="bullet-item">{line}</div>;
      }
      // Empty lines
      else if (!line.trim()) {
        return <br key={index} />;
      }
      // Regular paragraph
      else {
        return <p key={index}>{line}</p>;
      }
    });
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() && uploadedFiles.length === 0) return;

    const userMessage: Message = {
      text: inputText || 'Sent attachment',
      isUser: true,
      timestamp: new Date().toISOString(),
      model: selectedModel,
      attachments: uploadedFiles.length > 0 ? [...uploadedFiles] : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setUploadedFiles([]);
    setIsWelcomeVisible(false);
    setIsFirstPrompt(false);
    setErrorMessage(null);
    setIsProcessing(true);
    setWaitingForResponse(true);

    try {
      let currentChatId = selectedChatId;

      // Create a new chat if none is selected
      if (!currentChatId) {
        const newChatResponse = await fetch(`${API_BASE_URL}/api/chats/new`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            userEmail,
            initialMessage: userMessage.text,
            model: selectedModel,
            attachments: userMessage.attachments,
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
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            message: userMessage.text,
            isUser: true,
            model: selectedModel,
            attachments: userMessage.attachments,
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
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
      const updatedChats = await fetch(`${API_BASE_URL}/api/chats/${encodeURIComponent(userEmail)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      }).then((res) => {
        if (!res.ok) throw new Error(`Failed to refresh chats: HTTP ${res.status}`);
        return res.json();
      });
      setChats(updatedChats);
    } catch (error: any) {
      console.error('Error in chat:', error);
      setErrorMessage('Failed to send message. Please try again.');
      setMessages((prev) => prev.filter((_, i) => i !== prev.length - 1)); // Remove failed message
    } finally {
      setIsProcessing(false);
      setWaitingForResponse(false);
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
    setUploadedFiles([]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
  
    setIsUploading(true);
    setErrorMessage(null);
  
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
  
        const response = await fetch(`${API_BASE_URL}/api/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: formData,
        });
  
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`File upload failed: HTTP ${response.status}: ${errorText.slice(0, 100)}...`);
        }
  
        const data = await response.json();
        // Validate response data
        if (!data.fileUrl || !data.filename || !data.type || !data.size) {
          throw new Error('Invalid upload response: missing required fields');
        }
        setUploadedFiles((prev) => [
          ...prev,
          {
            name: data.filename,
            type: data.type,
            size: Number(data.size), // Ensure size is a number
            url: data.fileUrl,
          },
        ]);
      }
    } catch (error: any) {
      console.error('Error uploading file:', error);
      setErrorMessage(`File upload error: ${error.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // const handleSendMessage = async () => {
  //   if (!inputText.trim() && uploadedFiles.length === 0) return;
  
  //   // Validate attachments
  //   const validAttachments = uploadedFiles.filter(
  //     (file) => file.name && file.type && file.url && typeof file.size === 'number' && !isNaN(file.size)
  //   );
  //   if (uploadedFiles.length > 0 && validAttachments.length === 0) {
  //     setErrorMessage('No valid attachments to send');
  //     return;
  //   }
  
  //   const userMessage: Message = {
  //     text: inputText || 'Sent attachment',
  //     isUser: true,
  //     timestamp: new Date().toISOString(),
  //     model: selectedModel,
  //     attachments: validAttachments.length > 0 ? [...validAttachments] : undefined,
  //   };
  
  //   setMessages((prev) => [...prev, userMessage]);
  //   setInputText('');
  //   setUploadedFiles([]);
  //   setIsWelcomeVisible(false);
  //   setIsFirstPrompt(false);
  //   setErrorMessage(null);
  //   setIsProcessing(true);
  
  //   try {
  //     let currentChatId = selectedChatId;
  
  //     // Create a new chat if none is selected
  //     if (!currentChatId) {
  //       const newChatResponse = await fetch(`${API_BASE_URL}/api/chats/new`, {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json',
  //           'Authorization': `Bearer ${localStorage.getItem('token')}`,
  //         },
  //         body: JSON.stringify({
  //           userEmail,
  //           initialMessage: userMessage.text,
  //           model: selectedModel,
  //           attachments: userMessage.attachments,
  //         }),
  //       });
  //       if (!newChatResponse.ok) {
  //         const errorText = await newChatResponse.text();
  //         throw new Error(`Failed to create new chat: HTTP ${newChatResponse.status}: ${errorText.slice(0, 100)}...`);
  //       }
  //       const newChatData = await newChatResponse.json();
  //       currentChatId = newChatData.chatId;
  //       setSelectedChatId(currentChatId);
  //     } else {
  //       // Add user message to existing chat
  //       const saveUserResponse = await fetch(`${API_BASE_URL}/api/chats/${currentChatId}/messages`, {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json',
  //           'Authorization': `Bearer ${localStorage.getItem('token')}`,
  //         },
  //         body: JSON.stringify({
  //           message: userMessage.text,
  //           isUser: true,
  //           model: selectedModel,
  //           attachments: userMessage.attachments,
  //         }),
  //       });
  //       if (!saveUserResponse.ok) {
  //         const errorText = await saveUserResponse.text();
  //         throw new Error(`Failed to save user message: HTTP ${saveUserResponse.status}: ${errorText.slice(0, 100)}...`);
  //       }
  //     }
  
  //     // Get AI response
  //     const aiResponse = await fetch(`${API_BASE_URL}/api/chat`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'Authorization': `Bearer ${localStorage.getItem('token')}`,
  //       },
  //       body: JSON.stringify({
  //         messages: [...messages, userMessage].map((msg) => ({
  //           role: msg.isUser ? 'user' : 'assistant',
  //           content: msg.text,
  //         })),
  //         model: selectedModel,
  //       }),
  //     });
  //     if (!aiResponse.ok) {
  //       const errorText = await aiResponse.text();
  //       throw new Error(`Failed to get AI response: HTTP ${aiResponse.status}: ${errorText.slice(0, 100)}...`);
  //     }
  //     const aiData = await aiResponse.json();
  
  //     const botMessage: Message = {
  //       text: aiData.content,
  //       isUser: false,
  //       timestamp: new Date().toISOString(),
  //       model: selectedModel,
  //     };
  
  //     // Save bot message
  //     const saveBotResponse = await fetch(`${API_BASE_URL}/api/chats/${currentChatId}/messages`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'Authorization': `Bearer ${localStorage.getItem('token')}`,
  //       },
  //       body: JSON.stringify({
  //         message: aiData.content,
  //         isUser: false,
  //         model: selectedModel,
  //       }),
  //     });
  //     if (!saveBotResponse.ok) {
  //       const errorText = await saveBotResponse.text();
  //       throw new Error(`Failed to save bot message: HTTP ${saveUserResponse.status}: ${errorText.slice(0, 100)}...`);
  //     }
  
  //     // Update messages and refresh chats
  //     setMessages((prev) => [...prev, botMessage]);
  //     const updatedChats = await fetch(`${API_BASE_URL}/api/chats/${encodeURIComponent(userEmail)}`, {
  //       headers: {
  //         'Authorization': `Bearer ${localStorage.getItem('token')}`,
  //       },
  //     }).then((res) => {
  //       if (!res.ok) throw new Error(`Failed to refresh chats: HTTP ${res.status}`);
  //       return res.json();
  //     });
  //     setChats(updatedChats);
  //   } catch (error: any) {
  //     console.error('Error in chat:', error);
  //     setErrorMessage('Failed to send message. Please try again.');
  //     setMessages((prev) => prev.filter((_, i) => i !== prev.length - 1)); // Remove failed message
  //   } finally {
  //     setIsProcessing(false);
  //   }
  // };

  const handleVoiceTranscription = async () => {
    // This is a placeholder for the voice transcription functionality
    // You would need to implement audio recording and send it to the Whisper API endpoint
    
    try {
      setIsTranscribing(true);
      setErrorMessage(null);
      
      // Here you would:
      // 1. Record audio using the Web Audio API or a library
      // 2. Send the audio to your backend for processing with Whisper
      // 3. Get the transcription back and set it as input text
      
      // Simulate a delay for recording and processing
      setTimeout(() => {
        // This would be replaced with actual transcription result from Whisper
        setInputText("under development.");
        setIsTranscribing(false);
      }, 2000);
      
    } catch (error: any) {
      console.error('Error in voice transcription:', error);
      setErrorMessage(`Transcription error: ${error.message}`);
      setIsTranscribing(false);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
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
            <p className="loading-history">
              <div className="spinner"></div> Loading history...
            </p>
          ) : chats.length ? (
            <ul>
              {chats.map((chat) => (
                <li
                  key={chat._id}
                  className={`history-item ${selectedChatId === chat._id ? 'history-item-selected' : ''}`}
                >
                  <span
                    className="history-title"
                    onClick={() => handleChatSelect(chat._id)}
                  >
                    {chat.messages.find((m) => m.isUser)?.text?.slice(0, 20) || 'Untitled Chat'}
                  </span>
                  <span className="history-date">
                    {new Date(chat.updatedAt).toLocaleDateString()}
                  </span>
                  <button
                    className="delete-chat-button"
                    onClick={() => handleDeleteChat(chat._id)}
                    disabled={isProcessing}
                    title="Delete chat"
                  >
                    <Trash2 size={16} />
                  </button>
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
  <button
    className="home-nav-button"
    onClick={() => navigate('/dashboard')}
    title="Go to Dashboard"
    style={{ color: 'blue', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
  >
    <Home size={18} />
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
                <option value="llama-3.2-90b-vision-preview">llama-3.2-90b-vision-preview</option>
                <option value="whisper-large-v3">distil-whisper-large-v3-en</option>
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
                  <div className="message-content">
                    {formatMessageText(msg.text)}
                  </div>

                  {/* Display attachments if any */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="attachments-container">
                      {msg.attachments.map((file, fileIndex) => (
                        <div key={fileIndex} className="attachment-item">
                          <Paperclip size={14} />
                          <a href={file.url} target="_blank" rel="noopener noreferrer" className="attachment-name">
                            {file.name}
                          </a>
                          <span className="attachment-size">({formatFileSize(file.size)})</span>
                        </div>
                      ))}
                    </div>
                  )}

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
            
            {/* Processing indicator shown at the bottom of messages */}
            {waitingForResponse && (
              <div className="message message-bot waiting-response">
                <div className="bot-avatar">
                  <span>AI</span>
                </div>
                <div className="message-bubble bubble-bot processing-bubble">
                  <div className="typing-indicator">
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="input-container">
          {/* Uploaded Files Preview */}
          {uploadedFiles.length > 0 && (
            <div className="uploaded-files-container">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="uploaded-file">
                  <Paperclip size={14} />
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">({formatFileSize(file.size)})</span>
                  <button className="remove-file-btn" onClick={() => removeFile(index)}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload status indicator */}
          {isUploading && (
            <div className="upload-status">
              <div className="spinner"></div>
              <span>Uploading file...</span>
            </div>
          )}

          {/* Transcription status */}
          {isTranscribing && (
            <div className="upload-status">
              <div className="spinner"></div>
              <span>Transcribing audio...</span>
            </div>
          )}

          <div className="input-wrapper">
            <button
              className="icon-button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isProcessing || isTranscribing}
            >
              <Paperclip size={20} />
            </button>
            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
              disabled={isUploading || isProcessing || isTranscribing}
              multiple
            />

            <textarea
              className="input-textarea"
              placeholder={uploadedFiles.length > 0 ? "Add a message about your files..." : "Ask about your costs..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              rows={1}
              disabled={isUploading || isProcessing || isTranscribing}
            />

            <button 
              className={`icon-button ${isTranscribing ? 'mic-active' : ''}`}
              onClick={handleVoiceTranscription}
              disabled={isUploading || isProcessing || isTranscribing}
              title={selectedModel === 'whisper-large-v3' ? "Record voice (using Whisper)" : "Record voice"}
            >
              <Mic size={20} />
            </button>

            <button
              className={`send-button ${(inputText.trim() || uploadedFiles.length > 0) && !isUploading && !isProcessing && !isTranscribing ? 'send-active' : 'send-disabled'}`}
              onClick={handleSendMessage}
              disabled={(!inputText.trim() && uploadedFiles.length === 0) || isUploading || isProcessing || isTranscribing}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}