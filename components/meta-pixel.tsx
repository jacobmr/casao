'use client'

import Script from 'next/script'

// Meta Pixel ID - can be overridden via NEXT_PUBLIC_META_PIXEL_ID env var
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '896263299741384'

export function MetaPixel() {
  return (
    <>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}

// Helper function to track custom events
export function trackMetaEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && (window as unknown as { fbq?: Function }).fbq) {
    (window as unknown as { fbq: Function }).fbq('track', eventName, params)
  }
}

// Predefined event trackers for Casa Vistas
export const MetaEvents = {
  // Track when user views property details
  viewContent: (contentName?: string) => {
    trackMetaEvent('ViewContent', {
      content_name: contentName || 'Casa Vistas Property',
      content_category: 'Vacation Rental',
      content_type: 'property',
    })
  },

  // Track when user starts checkout process
  initiateCheckout: (value?: number, checkIn?: string, checkOut?: string) => {
    trackMetaEvent('InitiateCheckout', {
      value: value,
      currency: 'USD',
      content_name: 'Casa Vistas Booking',
      checkin_date: checkIn,
      checkout_date: checkOut,
    })
  },

  // Track when user submits inquiry
  lead: (source?: string) => {
    trackMetaEvent('Lead', {
      content_name: 'Casa Vistas Inquiry',
      content_category: source || 'Contact Form',
    })
  },

  // Track when user selects dates
  search: (checkIn?: string, checkOut?: string, guests?: number) => {
    trackMetaEvent('Search', {
      content_category: 'Date Selection',
      checkin_date: checkIn,
      checkout_date: checkOut,
      num_guests: guests,
    })
  },

  // Track when user adds experiences
  addToCart: (experienceName: string, value?: number) => {
    trackMetaEvent('AddToCart', {
      content_name: experienceName,
      content_type: 'experience',
      value: value,
      currency: 'USD',
    })
  },
}
