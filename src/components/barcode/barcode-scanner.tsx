'use client'

import { useEffect, useRef, useCallback } from 'react'
import { Barcode } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  enabled?: boolean
  minLength?: number
  scanInterval?: number
}

export function BarcodeScanner({ onScan, enabled = true, minLength = 4, scanInterval = 50 }: BarcodeScannerProps) {
  const bufferRef = useRef('')
  const lastTimeRef = useRef(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return

    const now = Date.now()
    const elapsed = now - lastTimeRef.current

    if (e.key === 'Enter') {
      e.preventDefault()
      const code = bufferRef.current.trim()
      if (code.length >= minLength) {
        onScan(code)
      }
      bufferRef.current = ''
      return
    }

    if (e.ctrlKey || e.altKey || e.metaKey) return

    if (elapsed > scanInterval && elapsed < 1000) {
      bufferRef.current += e.key
    } else if (elapsed <= scanInterval) {
      bufferRef.current += e.key
    } else {
      bufferRef.current = e.key
    }

    lastTimeRef.current = now

    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      bufferRef.current = ''
    }, 200)
  }, [onScan, enabled, minLength, scanInterval])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [handleKeyDown])

  return null
}

interface BarcodeScanButtonProps {
  onScan: (barcode: string) => void
  scanning: boolean
  onToggle: () => void
}

export function BarcodeScanButton({ scanning, onToggle }: BarcodeScanButtonProps) {
  return (
    <Button
      variant={scanning ? 'default' : 'outline'}
      size="icon"
      onClick={onToggle}
      className={scanning ? 'bg-green-600 hover:bg-green-700' : ''}
      title={scanning ? 'Scanner active - scan a barcode' : 'Activate barcode scanner'}
    >
      <Barcode size={18} />
    </Button>
  )
}
