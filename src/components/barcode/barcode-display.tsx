'use client'

import dynamic from 'next/dynamic'

const Barcode = dynamic(() => import('react-barcode'), { ssr: false })

interface BarcodeDisplayProps {
  value: string
  height?: number
  width?: number
  fontSize?: number
  displayValue?: boolean
  className?: string
}

export function BarcodeDisplay({ value, height = 50, width = 1.5, fontSize = 14, displayValue = true, className }: BarcodeDisplayProps) {
  if (!value) return null
  return (
    <div className={className}>
      <Barcode
        value={value}
        height={height}
        width={width}
        fontSize={fontSize}
        displayValue={displayValue}
        background="transparent"
        margin={0}
      />
    </div>
  )
}
