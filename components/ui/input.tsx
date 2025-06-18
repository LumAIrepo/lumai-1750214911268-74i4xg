```tsx
'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  helperText?: string
  label?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, helperText, label, leftIcon, rightIcon, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-200 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              'flex h-12 w-full rounded-xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-sm px-3 py-2 text-base text-slate-100 placeholder:text-slate-400 transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-slate-900/70',
              'hover:border-slate-600/50 hover:bg-slate-900/60',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-800/30',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/50',
              isFocused && 'shadow-lg shadow-indigo-500/10',
              className
            )}
            ref={ref}
            onFocus={(e) => {
              setIsFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setIsFocused(false)
              props.onBlur?.(e)
            }}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>
        {helperText && (
          <p className={cn(
            'mt-2 text-sm',
            error ? 'text-red-400' : 'text-slate-400'
          )}>
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
```