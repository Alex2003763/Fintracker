import React from 'react';

interface PasswordStrengthMeterProps {
  strength: number;
}

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ strength }) => {
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

  return (
    <div className="w-full mt-2">
      <div className="flex h-2 rounded-full overflow-hidden">
        <div className={`h-full transition-all duration-300 ${strength > 0 ? strengthColors[0] : 'bg-gray-200'}`} style={{ width: '25%' }}></div>
        <div className={`h-full transition-all duration-300 ${strength > 1 ? strengthColors[1] : 'bg-gray-200'}`} style={{ width: '25%' }}></div>
        <div className={`h-full transition-all duration-300 ${strength > 2 ? strengthColors[2] : 'bg-gray-200'}`} style={{ width: '25%' }}></div>
        <div className={`h-full transition-all duration-300 ${strength > 3 ? strengthColors[3] : 'bg-gray-200'}`} style={{ width: '25%' }}></div>
      </div>
      <p className={`text-xs text-right mt-1 ${strength > 0 ? 'text-gray-500' : 'text-transparent'}`}>
        {strength > 0 ? `Strength: ${strengthLabels[strength - 1]}` : ''}
      </p>
    </div>
  );
};

export default PasswordStrengthMeter;