"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export default function FamilyPortalGate() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [shake, setShake] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/family/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (response.ok) {
        // Success - redirect to calendar
        router.push("/family/availability")
      } else {
        // Failed - show error with progressive hints
        setAttempts((prev) => prev + 1)
        setShake(true)
        setTimeout(() => setShake(false), 500)

        if (attempts >= 2) {
          setError("Hint: It's JR's middle name (all lowercase)")
        } else if (attempts >= 1) {
          setError("Not quite - try again!")
        } else {
          setError("Incorrect password")
        }

        setPassword("")
      }
    } catch (err) {
      console.error("Auth error:", err)
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-800 to-emerald-600 flex items-center justify-center p-4">
      <Card className={`max-w-md w-full p-8 ${shake ? "animate-shake" : ""}`}>
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold text-emerald-800 mb-2">
            Casa Vistas
          </h1>
          <p className="text-lg font-semibold text-foreground mb-1">
            Family Portal
          </p>
          <p className="text-sm text-muted-foreground">
            This space is reserved for JR's close friends and family
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Quick check - what's JR's middle name?
            </label>
            <Input
              id="password"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value.toLowerCase())}
              placeholder="Enter answer..."
              autoComplete="off"
              autoFocus
              disabled={loading}
              className="text-center text-lg"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300 text-center">
                {error}
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={!password || loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Checking...
              </>
            ) : (
              "Come on in"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          This portal allows family to view availability and request dates
        </div>
      </Card>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s;
        }
      `}</style>
    </div>
  )
}
