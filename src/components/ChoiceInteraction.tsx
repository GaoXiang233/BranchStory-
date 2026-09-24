// src/components/ChoiceInteraction.tsx
import React from 'react';

interface Choice {
  id: string;
  text: string;
}

interface ChoiceInteractionProps {
  choices: Choice[];
  onChoice: (choiceId: string) => void;
  disabled?: boolean;
  edgeHint?: string;
  className?: string;
}

export const ChoiceInteraction: React.FC<ChoiceInteractionProps> = ({
  choices,
  onChoice,
  disabled = false,
  edgeHint,
  className = ''
}) => {
  const handleChoiceClick = (choiceId: string) => {
    if (!disabled) {
      onChoice(choiceId);
    }
  };

  return (
    <div className={`choice-interaction ${className}`}>
      <div className="choices-container">
        <h3 className="choices-title">你的选择:</h3>
        <div className="choices-grid">
          {choices.map((choice) => (
            <button
              key={choice.id}
              className={`choice-button ${disabled ? 'disabled' : ''}`}
              onClick={() => handleChoiceClick(choice.id)}
              disabled={disabled}
            >
              <div className="choice-text">{choice.text}</div>
            </button>
          ))}
        </div>
      </div>
      
      
    </div>
  );
};

export default ChoiceInteraction;