import React from 'react';
import './ModelSelector.css';

interface Model {
  id: string;
  name: string;
}

interface ModelSelectorProps {
  models: Model[];
  selectedModel: string;
  onChange: (modelId: string) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModel,
  onChange,
}) => {
  return (
    <div className="model-selector">
      <span className="model-icon">🤖</span>
      <select
        value={selectedModel}
        onChange={(e) => onChange(e.target.value)}
      >
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name}
          </option>
        ))}
      </select>
    </div>
  );
};  