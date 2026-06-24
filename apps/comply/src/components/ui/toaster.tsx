'use client'

import { useEffect } from 'react'

// Simple toast notification system
// Uses browser's native notification or console fallback

interface ToastOptions {
  title?: string
  description?: string
  variant?: 'default' | 'destructive' | 'success'
}

export function toast(options: ToastOptions) {
  const message = options.title ?? options.description ?? ''
  if (typeof window !== 'undefined') {
    // Use console for now - can be replaced with a proper toast library
    if (options.variant === 'destructive') {
      console.error('[Toast]', message)
    } else {
      console.log('[Toast]', message)
    }
    // Brief visual notification
    const notification = document.createElement('div')
    notification.className = `fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 ${
      options.variant === 'destructive' 
        ? 'bg-red-600 text-white' 
        : options.variant === 'success'
        ? 'bg-green-600 text-white'
        : 'bg-slate-800 text-white'
    }`
    notification.textContent = message
    document.body.appendChild(notification)
    setTimeout(() => notification.remove(), 3000)
  }
}

export function Toaster() {
  useEffect(() => {
    // Placeholder for toast system initialization
    // Can be replaced with sonner, react-hot-toast, etc.
  }, [])
  
  return null
}

export { Toaster as ToasterComponent }