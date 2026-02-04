import React from 'react';

interface ModernToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    className?: string;
}

const ModernToggle: React.FC<ModernToggleProps> = ({ checked, onChange, label, className = '' }) => {
    return (
        <label className={`group relative inline-flex items-center cursor-pointer select-none ${className}`}>
            <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
            />
            <div
                className={`
          relative w-14 h-7 rounded-full transition-all duration-300 ease-in-out
          ${checked
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[0_0_15px_-3px_rgba(37,99,235,0.4)]'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }
           before:content-[""] before:absolute before:inset-0 before:rounded-full before:transition-opacity before:duration-300
           ${checked ? 'before:opacity-100' : 'before:opacity-0'}
           before:bg-white/10
        `}
            >
                <div
                    className={`
            absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md
            transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
            flex items-center justify-center
            ${checked ? 'translate-x-7' : 'translate-x-0'}
          `}
                >
                    <div className={`
            w-1.5 h-1.5 rounded-full transition-all duration-300
            ${checked ? 'bg-blue-600' : 'bg-gray-300'}
          `} />
                </div>
            </div>
            {label && (
                <span className={`mr-3 text-sm font-medium transition-colors duration-200 ${checked ? 'text-blue-700' : 'text-gray-500'}`}>
                    {label}
                </span>
            )}
        </label>
    );
};

export default ModernToggle;
