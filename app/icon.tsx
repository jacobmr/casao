import { ImageResponse } from 'next/og'
 
// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'
 
// Icon component - Palm tree design
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: '#00785c',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#f0fdf4',
          borderRadius: '20%',
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Palm tree trunk */}
          <path
            d="M11 10 L11 22 L13 22 L13 10"
            fill="#8b4513"
            stroke="#654321"
            strokeWidth="0.5"
          />
          
          {/* Palm fronds - left */}
          <path
            d="M12 10 Q6 8 4 6 Q5 7 12 10"
            fill="#10b981"
            stroke="#059669"
            strokeWidth="0.5"
          />
          <path
            d="M12 9 Q7 6 5 4 Q6 5 12 9"
            fill="#10b981"
            stroke="#059669"
            strokeWidth="0.5"
          />
          
          {/* Palm fronds - right */}
          <path
            d="M12 10 Q18 8 20 6 Q19 7 12 10"
            fill="#10b981"
            stroke="#059669"
            strokeWidth="0.5"
          />
          <path
            d="M12 9 Q17 6 19 4 Q18 5 12 9"
            fill="#10b981"
            stroke="#059669"
            strokeWidth="0.5"
          />
          
          {/* Palm fronds - center */}
          <path
            d="M12 10 Q12 4 12 2 Q12 3 12 10"
            fill="#10b981"
            stroke="#059669"
            strokeWidth="0.5"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
