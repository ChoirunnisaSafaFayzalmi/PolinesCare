'use client'

export function QRCodeSVG() {
  const size = 200
  const cells = 25
  const cellSize = size / cells
  const pattern = Array.from({ length: cells * cells }, (_, i) => {
    const row = Math.floor(i / cells)
    const col = i % cells
    if ((row < 7 && col < 7) || (row < 7 && col >= cells - 7) || (row >= cells - 7 && col < 7)) {
      if (
        row === 0 || row === 6 || col === 0 || col === 6 ||
        (row < 7 && col < 7 && row >= 2 && row <= 4 && col >= 2 && col <= 4) ||
        (row < 7 && col >= cells - 7 && row >= 2 && row <= 4 && col >= cells - 5 && col <= cells - 3) ||
        (row >= cells - 7 && col < 7 && row >= cells - 5 && row <= cells - 3 && col >= 2 && col <= 4)
      ) return true
      return false
    }
    return ((i * 7 + 13) % 3) !== 0
  })

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto bg-white p-2 rounded-lg border">
      {pattern.map((filled, i) =>
        filled ? (
          <rect
            key={i}
            x={Math.floor(i / cells) * cellSize}
            y={(i % cells) * cellSize}
            width={cellSize}
            height={cellSize}
            fill="#1a1a1a"
          />
        ) : null
      )}
    </svg>
  )
}
