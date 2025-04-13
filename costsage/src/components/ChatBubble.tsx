import React from 'react';
import './ChatBubble.css';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  attachments?: Array<{ name: string; url: string; type: string }>;
}

interface ChatBubbleProps {
  message: Message;
  avatar?: string;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, avatar }) => {
  return (
    <div className={`message ${message.isUser ? 'user-message' : 'bot-message'}`}>
      {!message.isUser && avatar && (
        <div className="avatar-container">
          <img src={avatar} alt="Bot Avatar" className="avatar" />
        </div>
      )}
      <div className="message-content">
        {message.text}
        {message.attachments && message.attachments.length > 0 && (
          <div className="message-attachments">
            {message.attachments.map((attachment, index) => (
              <a
                key={index}
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="attachment-link"
              >
                {attachment.name}
              </a>
            ))}
          </div>
        )}
        <div className="message-timestamp">
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};