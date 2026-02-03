import React from 'react';
import { useTranslation } from 'react-i18next';
import Spinner from './Spinner';

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message }) => {
  const { t } = useTranslation();
  const resolvedMessage = message || t('common.loading');
  return (
    <div className="min-h-screen bg-[#292929] flex items-center justify-center px-4">
      <div className="text-center max-w-md mx-auto">
        <div className="mx-auto mb-6 flex justify-center">
          <Spinner size={80} />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-3">{resolvedMessage}</h2>
        {/* <p className="text-[#7a7a7a]">{t('common.please_wait')}</p> */}
        
        {/* Dots animation */}
        {/* <div className="flex justify-center gap-2 mt-4">
          <div className="w-2 h-2 bg-[#18b5d8] rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-[#18b5d8] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-[#18b5d8] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div> */}
      </div>
    </div>
  );
};

export default LoadingSpinner;
