"use client"

import { useEffect, useState } from "react"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"

export function CacheRefresher() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function refreshCache() {
      try {
        setMessage('Refreshing cache from Guesty...')
        const response = await fetch('/api/warmup-cache')

        if (response.ok) {
          const data = await response.json()
          setStatus('success')
          setMessage(`Cache refreshed successfully! Updated ${data.results?.length || 0} months.`)

          // Auto-reload page after 2 seconds
          setTimeout(() => {
            window.location.href = window.location.pathname
          }, 2000)
        } else {
          setStatus('error')
          setMessage('Failed to refresh cache. Please try again.')
        }
      } catch (error) {
        setStatus('error')
        setMessage('Error refreshing cache: ' + (error as Error).message)
      }
    }

    refreshCache()
  }, [])

  return (
    <div className="fixed top-4 right-4 z-50 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 max-w-sm border-2 border-primary">
      <div className="flex items-center gap-3">
        {status === 'loading' && (
          <>
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <div>
              <p className="font-semibold text-sm">Cache Refresh</p>
              <p className="text-xs text-muted-foreground">{message}</p>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-semibold text-sm text-green-600">Success!</p>
              <p className="text-xs text-muted-foreground">{message}</p>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-semibold text-sm text-red-600">Error</p>
              <p className="text-xs text-muted-foreground">{message}</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
