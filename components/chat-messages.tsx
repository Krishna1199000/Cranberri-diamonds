"use client"

import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { toast } from "sonner"
import { format } from 'date-fns'

interface ChatMessage {
  id: string
  name: string
  email: string
  message: string
  createdAt: string
}

export default function ChatMessages() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/chat')
      const data = await response.json()
      if (data.success) {
        setMessages(data.messages)
      }
    } catch {
      toast.error('Failed to fetch messages')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
    // Poll for new messages every 30 seconds
    const interval = setInterval(fetchMessages, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleComplete = async (id: string) => {
    try {
      const response = await fetch(`/api/chat/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        toast.success('Message marked as completed')
        setMessages(messages.filter(msg => msg.id !== id))
      } else {
        toast.error('Failed to complete message')
      }
    } catch {
      toast.error('Failed to complete message')
    }
  }

  if (loading) {
    return <div>Loading messages...</div>
  }

  if (messages.length === 0) {
    return <div>No pending messages</div>
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Customer Messages</h2>
      {messages.map((message) => (
        <Card key={message.id}>
          <CardHeader>
            <CardTitle>{message.name}</CardTitle>
            <CardDescription>{message.email}</CardDescription>
          </CardHeader>
          <CardContent>
            <p>{message.message}</p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <span className="text-sm text-gray-500">
              {format(new Date(message.createdAt), 'PPp')}
            </span>
            <Button onClick={() => handleComplete(message.id)}>
              Mark as Completed
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}