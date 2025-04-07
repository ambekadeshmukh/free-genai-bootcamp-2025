import React, { useState } from 'react';
import { useChalkboard } from '../../contexts/ChalkboardContext';

const SettingsModal = ({ isOpen, onClose }) => {
  const { currentTheme, setTheme, currentFontSize, setFontSize, soundEnabled, setSoundEnabled } = useChalkboard();
  const [localTheme, setLocalTheme] = useState(currentTheme);
  const [localFontSize, setLocalFontSize] = useState(currentFontSize);
  const [localSound, setLocalSound] = useState(soundEnabled);

  const handleSave = () => {
    setTheme(localTheme);
    setFontSize(localFontSize);
    setSoundEnabled(localSound);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-xl font-semibold mb-4">Settings</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
            <select
              value={localTheme}
              onChange={(e) => setLocalTheme(e.target.value)}
              className="w-full border rounded-md p-2"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="chalkboard">Chalkboard</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Font Size</label>
            <select
              value={localFontSize}
              onChange={(e) => setLocalFontSize(e.target.value)}
              className="w-full border rounded-md p-2"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="sound"
              checked={localSound}
              onChange={(e) => setLocalSound(e.target.checked)}
              className="h-4 w-4 text-blue-600"
            />
            <label htmlFor="sound" className="ml-2 text-sm text-gray-700">
              Enable Sound Effects
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;