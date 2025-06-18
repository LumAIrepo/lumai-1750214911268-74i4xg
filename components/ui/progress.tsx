```tsx
"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value?: number
  max?: number
  showPercentage?: boolean
  size?: "sm" | "md" | "lg"
  variant?: "default" | "success" | "warning" | "error"
  animated?: boolean
  label?: string
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ 
  className, 
  value = 0, 
  max = 100, 
  showPercentage = false,
  size = "md",
  variant = "default",
  animated = false,
  label,
  ...props 
}, ref) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  
  const sizeClasses = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4"
  }
  
  const variantClasses = {
    default: "bg-gradient-to-r from-indigo-500 to-purple-600",
    success: "bg-gradient-to-r from-emerald-500 to-green-600",
    warning: "bg-gradient-to-r from-amber-500 to-orange-600",
    error: "bg-gradient-to-r from-red-500 to-rose-600"
  }

  return (
    <div className="w-full space-y-2">
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-sm">
          {label && (
            <span className="text-slate-200 font-medium">{label}</span>
          )}
          {showPercentage && (
            <span className="text-slate-400 font-mono">
              {percentage.toFixed(1)}%
            </span>
          )}
        </div>
      )}
      
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            "h-full w-full flex-1 transition-all duration-500 ease-out",
            variantClasses[variant],
            animated && "animate-pulse"
          )}
          style={{ 
            transform: `translateX(-${100 - percentage}%)`,
            background: variant === "default" 
              ? "linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #10b981 100%)"
              : undefined
          }}
        />
        
        {/* Glassmorphism overlay effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        
        {/* Animated shimmer effect for active streams */}
        {animated && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        )}
      </ProgressPrimitive.Root>
      
      {/* Stream completion indicator */}
      {percentage >= 100 && (
        <div className="flex items-center gap-2 text-emerald-400 text-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-medium">Stream Completed</span>
        </div>
      )}
    </div>
  )
})

Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
```