import React from 'react';
import './WelcomeDialog.css';

interface WelcomeDialogProps {
  userName: string;
  onStartChat: () => void;
}

export const WelcomeDialog: React.FC<WelcomeDialogProps> = ({
  userName,
  onStartChat,
}) => {
  return (
    <div className="welcome-dialog">
      <h1>Welcome, {userName}!</h1>
      <p>
        I'm Cost-Sage, your AI assistant to help analyze and manage your costs.
        Start a new chat to ask about budgets, expenses, or anything else!
      </p>
      <button onClick={onStartChat}>Start Chatting</button>
    </div>
  );
};