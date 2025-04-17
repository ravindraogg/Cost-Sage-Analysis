import React, { useState, useRef, useEffect } from 'react';
import { PlusCircle, Menu, Paperclip, Mic, Send, X, Trash2, Home } from 'lucide-react';
import './chatbot.css';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import ChatbotImage from './../../assets/chat-icon.gif';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const base = import.meta.env.VITE_BASE_URL;

interface FileAttachment {
  name: string;
  type: string;
  size: number;
  url?: string;
  content?: string;
  parsedData?: any[];
}

interface GraphData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
  }[];
}

interface Message {
  text: string;
  isUser: boolean;
  timestamp?: string;
  model?: string;
  attachments?: FileAttachment[];
  graph?: GraphData;
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

  const username = localStorage.getItem('username') || 'User';
  const userEmail = localStorage.getItem('userEmail') || 'user@example.com';
  const API_BASE_URL = base;

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
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error || `HTTP ${response.status}: Failed to fetch chats`;
          if (response.status === 0) {
            throw new Error("CORS error: Server did not respond with proper CORS headers. Check server or Azure CORS settings.");
          }
          throw new Error(errorMessage);
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

  useEffect(() => {
    if (isFirstPrompt && !iconPlayed) {
      const timer = setTimeout(() => {
        setIconPlayed(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isFirstPrompt, iconPlayed]);

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
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}: Failed to delete chat`;
        throw new Error(errorMessage);
      }

      const updatedChats = await fetch(`${API_BASE_URL}/api/chats/${encodeURIComponent(userEmail)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      }).then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch updated chats`);
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

  const formatMessageText = (text: string): React.ReactNode => {
    const lines = text.split('\n');
    return lines.map((line, index) => {
      if (/^\d+\.\s/.test(line)) {
        return <div key={index} className="list-item">{line}</div>;
      } else if (/^[-•*]\s/.test(line)) {
        return <div key={index} className="bullet-item">{line}</div>;
      } else if (!line.trim()) {
        return <br key={index} />;
      } else {
        return <p key={index}>{line}</p>;
      }
    });
  };

  // Improved graph data generation function
  const generateGraphData = (csvData: any[], prompt: string): GraphData | null => {
    if (!csvData || csvData.length === 0 || !Array.isArray(csvData)) {
      console.error("Invalid CSV data:", csvData);
      return null;
    }

    try {
      console.log("CSV Data received:", csvData);
      
      // Make sure we have valid objects with properties
      if (!csvData[0] || typeof csvData[0] !== 'object') {
        console.error("CSV data does not contain valid objects");
        return null;
      }

      // Find columns suitable for plotting
      const headers = Object.keys(csvData[0]);
      if (headers.length < 1) {
        console.error("CSV data has no headers");
        return null;
      }

      console.log("CSV Headers:", headers);

      // Default to first column as label
      let labelColumn = headers[0];
      
      // Look for numeric columns - prioritize columns with numeric values
      let valueColumns: string[] = [];
      
      headers.forEach(header => {
        // Check if this column contains numeric values
        const hasNumericValues = csvData.some(row => {
          const val = row[header];
          return typeof val === 'number' || 
                 (typeof val === 'string' && !isNaN(parseFloat(val)) && val.trim() !== '');
        });
        
        if (hasNumericValues) {
          valueColumns.push(header);
        }
      });
      
      console.log("Potential value columns:", valueColumns);
      
      if (valueColumns.length === 0) {
        console.error("No numeric columns found in CSV data");
        return null;
      }

      // Try to intelligently select label and value columns based on the prompt
      const promptLower = prompt.toLowerCase();
      
      // Check if prompt mentions any specific columns
      headers.forEach(header => {
        const headerLower = header.toLowerCase();
        if (promptLower.includes(headerLower)) {
          // If this header is mentioned and we have numeric columns, use it as label
          if (valueColumns.includes(header)) {
            // This column has numeric values but is specifically mentioned,
            // so we'll try to use another numeric column for values
            const otherValueColumn = valueColumns.find(col => col !== header);
            if (otherValueColumn) {
              labelColumn = header;
              valueColumns = [otherValueColumn];
            }
          } else {
            // Non-numeric column mentioned in prompt - use as label
            labelColumn = header;
          }
        }
      });
      
      // Check for keywords like "against", "versus", "vs", "by" in the prompt
      const comparisonTerms = ["against", "versus", "vs", "by", "over", "compare", "plot", "chart", "graph"];
      comparisonTerms.forEach(term => {
        if (promptLower.includes(term)) {
          const words = promptLower.split(/\s+/);
          const termIndex = words.findIndex(w => w === term);
          
          if (termIndex > 0 && termIndex < words.length - 1) {
            const beforeTerm = words[termIndex - 1];
            const afterTerm = words[termIndex + 1];
            
            // Look for headers that match these terms
            headers.forEach(header => {
              const headerLower = header.toLowerCase();
              if (headerLower.includes(beforeTerm)) {
                if (valueColumns.includes(header)) {
                  valueColumns = [header];
                } else {
                  labelColumn = header;
                }
              }
              if (headerLower.includes(afterTerm)) {
                if (valueColumns.includes(header)) {
                  valueColumns = [header];
                } else {
                  labelColumn = header;
                }
              }
            });
          }
        }
      });
      
      // Choose the first value column if we have multiple
      const valueColumn = valueColumns[0];
      
      console.log(`Selected label column: ${labelColumn}, value column: ${valueColumn}`);

      // Create labels and data arrays
      const labels = csvData.map(row => String(row[labelColumn] || ""));
      
      const values = csvData.map(row => {
        const val = row[valueColumn];
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
          // Handle currency strings or other formatted numbers
          const cleanValue = val.replace(/[$,£€\s]/g, '');
          return parseFloat(cleanValue) || 0;
        }
        return 0;
      });
      
      console.log("Generated labels:", labels);
      console.log("Generated values:", values);

      // Generate a color based on the value column name
      const getColorForColumn = (columnName: string) => {
        // Simple hash function to generate a consistent color
        let hash = 0;
        for (let i = 0; i < columnName.length; i++) {
          hash = columnName.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        // Convert to RGB
        const r = (hash & 0xFF) % 200 + 55; // Keep it not too dark
        const g = ((hash >> 8) & 0xFF) % 200 + 55;
        const b = ((hash >> 16) & 0xFF) % 200 + 55;
        
        return `rgba(${r}, ${g}, ${b}, 1)`;
      };
      
      const borderColor = getColorForColumn(valueColumn);
      const backgroundColor = borderColor.replace('1)', '0.2)');

      return {
        labels,
        datasets: [
          {
            label: valueColumn,
            data: values,
            borderColor,
            backgroundColor,
          },
        ],
      };
    } catch (error) {
      console.error("Error generating graph data:", error);
      return null;
    }
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
      let botMessage: Message = {
        text: '',
        isUser: false,
        timestamp: new Date().toISOString(),
        model: selectedModel,
      };

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
          const errorData = await newChatResponse.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${newChatResponse.status}: Failed to create new chat`);
        }
        const newChatData = await newChatResponse.json();
        currentChatId = newChatData.chatId;
        setSelectedChatId(currentChatId);
      } else {
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
          const errorData = await saveUserResponse.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${saveUserResponse.status}: Failed to save user message`);
        }
      }

      // Check for CSV and graph generation
      // Assume CSV files should always be visualized
      const csvFile = userMessage.attachments?.find((file) => file.type === 'text/csv');
      let graphData: GraphData | null = null;
      
      if (csvFile && csvFile.parsedData) {
        console.log("Found CSV file:", csvFile.name);
        console.log("CSV data:", csvFile.parsedData);
        graphData = generateGraphData(csvFile.parsedData, userMessage.text);
      }

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
            attachments: msg.attachments,
          })),
          model: selectedModel,
        }),
      });

      if (!aiResponse.ok) {
        const errorData = await aiResponse.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${aiResponse.status}: Failed to get AI response`;
        if (aiResponse.status === 0) {
          throw new Error("CORS error: Server did not respond with proper CORS headers. Check server or Azure CORS settings.");
        }
        throw new Error(errorMessage);
      }

      const aiData = await aiResponse.json();
      botMessage.text = aiData.content;

      if (graphData) {
        botMessage.text = `Here's the analysis of your CSV data:\n${botMessage.text}\n\nVisualized below:`;
        botMessage.graph = graphData;
      }

      // Save bot message
      const saveBotResponse = await fetch(`${API_BASE_URL}/api/chats/${currentChatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          message: botMessage.text,
          isUser: false,
          model: selectedModel,
          graph: botMessage.graph,
        }),
      });
      if (!saveBotResponse.ok) {
        const errorData = await saveBotResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${saveBotResponse.status}: Failed to save bot message`);
      }

      setMessages((prev) => [...prev, botMessage]);
      const updatedChats = await fetch(`${API_BASE_URL}/api/chats/${encodeURIComponent(userEmail)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      }).then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch updated chats`);
        return res.json();
      });
      setChats(updatedChats);
    } catch (error: any) {
      console.error('Error in chat:', error);
      setErrorMessage(`Failed to send message: ${error.message}`);
      setMessages((prev) => prev.filter((_, i) => i !== prev.length - 1));
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

  // Improved file upload handler with better CSV parsing
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

        // For CSV files, handle parsing on client-side first
        if (file.type === 'text/csv') {
          console.log("Processing CSV file:", file.name);
          
          const parsedData = await new Promise<any[]>((resolve, reject) => {
            Papa.parse(file, {
              header: true,
              dynamicTyping: true, // Automatically convert numeric values
              skipEmptyLines: true,
              complete: (result: Papa.ParseResult<any>) => {
              if (result.errors && result.errors.length > 0) {
                console.warn("CSV parsing had errors:", result.errors);
              }
              console.log("CSV parsing complete:", result.data);
              // Filter out rows that are completely empty or contain only empty strings
              const filteredData = result.data.filter((row: any) => {
                if (!row || typeof row !== 'object') return false;
                return Object.values(row).some(val => val !== "" && val !== null && val !== undefined);
              });
              resolve(filteredData);
              },
              error: (error: any) => {
              console.error("CSV parsing error:", error);
              reject(new Error(`CSV parsing error: ${error.message}`));
              }
            });
          });

          console.log("Parsed CSV data:", parsedData);
          
          // Continue with upload
          const response = await fetch(`${API_BASE_URL}/api/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error || `HTTP ${response.status}: Failed to upload file`;
            if (response.status === 0) {
              throw new Error("CORS error: Server did not respond with proper CORS headers. Check server or Azure CORS settings.");
            }
            throw new Error(errorMessage);
          }

          const data = await response.json();
          if (!data.fileUrl || !data.filename || !data.type || !data.size) {
            throw new Error('Invalid upload response: missing required fields');
          }

          setUploadedFiles((prev) => [
            ...prev,
            {
              name: data.filename,
              type: data.type,
              size: Number(data.size),
              url: data.fileUrl,
              content: data.content,
              parsedData: parsedData
            },
          ]);
        } else {
          // Handle non-CSV files
          const response = await fetch(`${API_BASE_URL}/api/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error || `HTTP ${response.status}: Failed to upload file`;
            if (response.status === 0) {
              throw new Error("CORS error: Server did not respond with proper CORS headers. Check server or Azure CORS settings.");
            }
            throw new Error(errorMessage);
          }

          const data = await response.json();
          if (!data.fileUrl || !data.filename || !data.type || !data.size) {
            throw new Error('Invalid upload response: missing required fields');
          }

          setUploadedFiles((prev) => [
            ...prev,
            {
              name: data.filename,
              type: data.type,
              size: Number(data.size),
              url: data.fileUrl,
              content: data.content,
            },
          ]);
        }
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

  const handleVoiceTranscription = async () => {
    try {
      setIsTranscribing(true);
      setErrorMessage(null);

      setTimeout(() => {
        setInputText("Voice transcription under development.");
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

      <div className="main-content">
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
            <img src={ChatbotImage} alt="Chat Icons" className="chat-icons" />
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
                <option value="gemma2-9b-it">gemma2-9b-it</option>
              </select>
            </div>
          </div>
        </nav>

        <div className="chat-container">
          {isWelcomeVisible && isFirstPrompt && messages.length === 0 && (
            <div className="welcome-dialog">
              {!iconPlayed && (
                <img src={ChatbotImage} alt="Chat Icon" className="chat-icon" />
              )}
              <h1 className="welcome-title">
                {getGreeting()}, {username}!
              </h1>
              <p className="welcome-text">
                How can I help you with your cost analysis today? Upload a CSV file to analyze and visualize data!
              </p>
            </div>
          )}

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

                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="attachments-container">
                      {msg.attachments.map((file, fileIndex) => (
                        <div key={fileIndex} className="attachment-item">
                          <a href={file.url} target="_blank" rel="noopener noreferrer">
                            {file.name}
                          </a>
                          <span className="attachment-size">({formatFileSize(file.size)})</span>
                          {file.content && (
                            <div className="attachment-content">
                              <p><strong>File Content:</strong></p>
                              <pre>{file.content.slice(0, 200)}...</pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.graph && (
                    <div className="graph-container" style={{ marginTop: '10px', maxWidth: '600px' }}>
                      <Line
                        data={msg.graph}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: { position: 'top' },
                            title: { display: true, text: 'CSV Data Visualization' },
                          },
                        }}
                      />
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

        <div className="input-container">
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

          {isUploading && (
            <div className="upload-status">
              <div className="spinner"></div>
              <span>Uploading file...</span>
            </div>
          )}

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
              accept=".csv,.txt,.pdf,.doc,.docx"
            />

            <textarea
              className="input-textarea"
              placeholder={uploadedFiles.length > 0 ? "Add a message about your files or ask to visualize data..." : "Ask about your costs or upload a CSV to visualize data..."}
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
