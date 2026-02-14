import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  icon,
  ...props 
}) => {
  const baseStyles = "flex items-center justify-center gap-2 px-6 py-3.5 rounded-none font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm border-2";
  
  const variants = {
    // Orange primary with a solid technical feel
    primary: "bg-orange-600 hover:bg-orange-500 text-white border-orange-600 hover:border-orange-500 shadow-[0_4px_0_0_rgba(154,52,18,1)] active:shadow-none active:translate-y-[4px]",
    // Navy/Slate secondary with blueprint border
    secondary: "bg-[#1e293b] hover:bg-[#334155] text-white border-slate-600 hover:border-slate-400 shadow-[0_4px_0_0_rgba(71,85,105,1)] active:shadow-none active:translate-y-[4px]",
    danger: "bg-red-600 hover:bg-red-500 text-white border-red-600",
    ghost: "bg-transparent hover:bg-white/5 text-slate-400 hover:text-white border-transparent"
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${widthClass} ${className}`}
      {...props}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {children}
    </button>
  );
};