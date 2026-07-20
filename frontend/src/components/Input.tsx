import React from 'react';
import { LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon: LucideIcon;
}

const Input: React.FC<InputProps> = ({ icon: Icon, className, ...props }) => {
    return (
        <div className="relative w-full">
            <input
                {...props}
                className={`
                    w-full bg-input-bg border border-border-color rounded-lg py-4 pl-13 pr-4 text-text-white text-base outline-hidden transition-all duration-300
                    focus:border-primary focus:ring-2 focus:ring-blue-500/20
                    ${className || ''}
                `}
            />
            <Icon
                size={20}
                className="absolute left-[1.2rem] top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
        </div>
    );
};

export default Input;
