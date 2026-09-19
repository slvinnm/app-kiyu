"use client"

import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { apiFetch } from "@/lib/api/client"

type TestApiResponse = {
  success: boolean
  message: string
  data?: unknown
}

export default function TestApiPage() {
  const [endpoint, setEndpoint] = useState("/test-endpoint")
  const [payload, setPayload] = useState(`{
  "name": "Test Data"
}`)
  const [responseData, setResponseData] = useState<TestApiResponse | null>(null)
  const [processing, setProcessing] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setResponseData(null)
    setProcessing(true)

    let parsedPayload: unknown

    try {
      parsedPayload = JSON.parse(payload)
    } catch {
      toast.error("Payload JSON tidak valid.")
      setProcessing(false)

      return
    }

    try {
      const request = apiFetch<TestApiResponse>(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsedPayload),
      }).then((result) => {
        if (!result.success) {
          throw new Error(result.message || "Request gagal.")
        }

        return result
      })

      const result = await toast.promise(request, {
        loading: "Mengirim request...",
        success: (result) => result.message || "Request berhasil.",
        error: (error) =>
          error instanceof Error ? error.message : "Request gagal.",
      })

      setResponseData(result)
    } catch (error) {
      console.error(error)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>API Test Page</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="endpoint">Endpoint</Label>

              <Input
                id="endpoint"
                value={endpoint}
                onChange={(event) => setEndpoint(event.target.value)}
                placeholder="/test-endpoint"
              />

              <p className="text-xs text-muted-foreground">
                Endpoint relatif terhadap API base URL.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payload">JSON Payload</Label>

              <Textarea
                id="payload"
                value={payload}
                onChange={(event) => setPayload(event.target.value)}
                className="min-h-48 font-mono"
                spellCheck={false}
              />
            </div>

            <Button type="submit" disabled={processing} className="w-full">
              {processing ? "Sending..." : "Send POST Request"}
            </Button>

            {responseData && (
              <div className="space-y-2">
                <Label>Response</Label>

                <pre className="overflow-auto rounded-lg bg-muted p-4 text-sm">
                  {JSON.stringify(responseData, null, 2)}
                </pre>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
