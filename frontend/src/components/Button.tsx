import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'outline';
}

const Button: React.FC<ButtonProps> = ({ variant = 'primary', children, className, ...props }) => {
    const isPrimary = variant === 'primary';

    return (
        <button
            {...props}
            className={`
                w-full p-4 rounded-lg text-base font-semibold cursor-pointer transition-all duration-300
                ${isPrimary
                    ? 'bg-primary border-none text-white hover:bg-primary-hover hover:-translate-y-0.5'
                    : 'bg-transparent border border-border-color text-text-white hover:bg-white/5'}
                ${className || ''}
            `}
        >
            {children}
        </button>
    );
};

export default Button;
