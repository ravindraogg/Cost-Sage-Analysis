import React from 'react';
import LoadingCoin from './LoadingCoin';
import './FullScreenLoading.css';

interface FullScreenLoadingProps {
  message?: string;
  coinSize?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
}

const FullScreenLoading: React.FC<FullScreenLoadingProps> = ({
  message = 'Loading your data...',
  coinSize = 'large',
  isLoading = true
}) => {
  if (!isLoading) return null;

  return (
    <div className="full-screen-loading">
      <div className="loading-content">
        <LoadingCoin size={coinSize} text={message} />
      </div>
    </div>
  );
};

export default FullScreenLoading;