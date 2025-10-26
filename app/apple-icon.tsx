import { ImageResponse } from 'next/og'
 
// Image metadata
export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'
 
// Apple touch icon - Palm tree design
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 120,
          background: 'linear-gradient(135deg, #00785c 0%, #059669 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#f0fdf4',
          borderRadius: '22%',
        }}
      >
        <svg
          width="120"
          height="120"
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
          
          {/* Palm fronds - left side */}
          <path
            d="M12 10 Q6 8 4 6 Q5 7 12 10"
            fill="#f0fdf4"
            stroke="#d1fae5"
            strokeWidth="0.3"
          />
          <path
            d="M12 9 Q7 6 5 4 Q6 5 12 9"
            fill="#f0fdf4"
            stroke="#d1fae5"
            strokeWidth="0.3"
          />
          <path
            d="M12 11 Q5 10 3 9 Q4 9.5 12 11"
            fill="#f0fdf4"
            stroke="#d1fae5"
            strokeWidth="0.3"
          />
          
          {/* Palm fronds - right side */}
          <path
            d="M12 10 Q18 8 20 6 Q19 7 12 10"
            fill="#f0fdf4"
            stroke="#d1fae5"
            strokeWidth="0.3"
          />
          <path
            d="M12 9 Q17 6 19 4 Q18 5 12 9"
            fill="#f0fdf4"
            stroke="#d1fae5"
            strokeWidth="0.3"
          />
          <path
            d="M12 11 Q19 10 21 9 Q20 9.5 12 11"
            fill="#f0fdf4"
            stroke="#d1fae5"
            strokeWidth="0.3"
          />
          
          {/* Palm fronds - center */}
          <path
            d="M12 10 Q12 4 12 2 Q12 3 12 10"
            fill="#f0fdf4"
            stroke="#d1fae5"
            strokeWidth="0.3"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
