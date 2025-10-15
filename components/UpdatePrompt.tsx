import React from 'react';

interface UpdatePromptProps {
  onUpdate: () => void;
}

const UpdatePrompt: React.FC<UpdatePromptProps> = ({ onUpdate }) => {
  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg flex items-center">
      <p className="mr-4">A new version is available.</p>
      <button
        onClick={onUpdate}
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
      >
        Update
      </button>
    </div>
  );
};

export default UpdatePrompt;