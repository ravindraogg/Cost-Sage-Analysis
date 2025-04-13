import React from 'react';
import './LoadingCoin.css';

interface LoadingCoinProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  className?: string;
}

const LoadingCoin: React.FC<LoadingCoinProps> = ({ 
  size = 'medium', 
  text, 
  className = '' 
}) => {
  const sizeClasses = {
    small: 'coin-small',
    medium: 'coin-medium',
    large: 'coin-large'
  };

  return (
    <div className={`loading-coin-container ${className}`}>
      <div className={`coin ${sizeClasses[size]}`}></div>
      {text && <span className="loading-text">{text}</span>}
    </div>
  );
};

export default LoadingCoin;