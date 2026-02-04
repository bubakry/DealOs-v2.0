
import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive', size?: 'sm' | 'md' | 'lg', isLoading?: boolean }>(
  ({ className = '', variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    const base = "inline-flex items-center justify-center rounded-2xl font-bold transition-all focus:outline-none focus:ring-4 focus:ring-brand-500/10 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";
    
    const variants = {
      primary: "bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-200",
      secondary: "bg-brand-100 text-brand-900 hover:bg-brand-200",
      outline: "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
      ghost: "hover:bg-slate-100 text-slate-500 hover:text-slate-900",
      destructive: "bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-200",
    };
    
    const sizes = {
      sm: "h-10 px-4 text-xs tracking-widest uppercase",
      md: "h-12 px-6 py-2 text-sm",
      lg: "h-14 px-8 text-base",
    };

    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`flex h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all ${className}`}
        {...props}
      />
    );
  }
);

export const Label = ({ className = '', ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={`text-[10px] font-black uppercase tracking-widest leading-none text-slate-400 mb-2 block ${className}`} {...props} />
);

// Fix: Updated Badge to extend React.HTMLAttributes<HTMLDivElement> so it can accept key and other standard props
export const Badge = ({ children, variant = 'default', className = '', ...props }: { children?: React.ReactNode, variant?: 'default' | 'outline' | 'destructive' | 'success' | 'warning' | 'info', className?: string } & React.HTMLAttributes<HTMLDivElement>) => {
  const variants = {
    default: "bg-slate-100 text-slate-900",
    outline: "text-slate-900 border border-slate-200",
    destructive: "bg-rose-50 text-rose-700 border border-rose-100",
    success: "bg-brand-50 text-brand-700 border border-brand-100",
    warning: "bg-amber-50 text-amber-700 border border-amber-100",
    info: "bg-indigo-50 text-indigo-700 border border-indigo-100",
  };
  return (
    <div className={`inline-flex items-center rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-widest ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
};

// Fix: Updated Card component to extend React.HTMLAttributes<HTMLDivElement> so it can accept onClick and other standard div props
export const Card = ({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`rounded-[2rem] border border-slate-200 bg-white shadow-sm ${className}`} {...props} />
);

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
    ({ className = '', children, ...props }, ref) => {
      return (
        <div className="relative group">
            <select
            ref={ref}
            className={`flex h-12 w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500/50 disabled:cursor-not-allowed disabled:opacity-50 appearance-none transition-all ${className}`}
            {...props}
            >
            {children}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 group-hover:text-slate-600 transition-colors">
                <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
        </div>
      );
    }
  );
