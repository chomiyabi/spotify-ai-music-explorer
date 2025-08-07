import React from 'react';
import { useAppContext } from '../context/AppContext';

interface PresetButtonProps {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
  isLoading?: boolean;
}

const PresetButton: React.FC<PresetButtonProps> = ({
  title,
  description,
  icon,
  onClick,
  isLoading = false
}) => {
  const { state } = useAppContext();

  return (
    <button
      onClick={onClick}
      disabled={isLoading || state.isLoading}
      className={`preset-button ${isLoading || state.isLoading ? 'loading' : ''}`}
    >
      <div className="preset-icon">{icon}</div>
      <div className="preset-content">
        <h3 className="preset-title">{title}</h3>
        <p className="preset-description">{description}</p>
      </div>
      {(isLoading || state.isLoading) && (
        <div className="preset-spinner"></div>
      )}
    </button>
  );
};

export default PresetButton;