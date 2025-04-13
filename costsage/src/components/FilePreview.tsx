import React from 'react';
import './FilePreview.css';

interface FilePreviewProps {
  file: File;
  onRemove: () => void;
}

export const FilePreview: React.FC<FilePreviewProps> = ({ file, onRemove }) => {
  const isImage = ['image/jpeg', 'image/png'].includes(file.type);

  return (
    <div className="file-preview">
      {isImage ? (
        <img
          src={URL.createObjectURL(file)}
          alt={file.name}
          className="file-preview-image"
        />
      ) : (
        <span className="file-preview-icon">📄</span>
      )}
      <div className="file-preview-name">{file.name}</div>
      <button className="file-preview-remove" onClick={onRemove}>
        ✕
      </button>
    </div>
  );
};