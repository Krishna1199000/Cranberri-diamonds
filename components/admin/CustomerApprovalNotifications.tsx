"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, User, Mail, Phone, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface ApprovalRequest {
  id: string
  status: 'PENDING' | 'APPROVED' | 'DECLINED'
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    phone: string
  }
}

export default function CustomerApprovalNotifications() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    fetchApprovalRequests()
  }, [])

  const fetchApprovalRequests = async () => {
    try {
      const response = await fetch('/api/admin/customer-approvals', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests)
      } else {
        toast.error('Failed to fetch approval requests')
      }
    } catch (error) {
      console.error('Error fetching approval requests:', error)
      toast.error('Failed to fetch approval requests')
    } finally {
      setLoading(false)
    }
  }

  const handleApproval = async (requestId: string, action: 'approve' | 'decline') => {
    setProcessing(requestId)
    try {
      const response = await fetch('/api/admin/customer-approvals', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requestId,
          action
        }),
        credentials: 'include'
      })

      const data = await response.json()

      if (data.success) {
        toast.success(action === 'approve' ? 'Customer approved successfully' : 'Customer request declined')
        fetchApprovalRequests() // Refresh the list
      } else {
        toast.error(data.message || 'Failed to process request')
      }
    } catch (error) {
      console.error('Error processing approval:', error)
      toast.error('Failed to process request')
    } finally {
      setProcessing(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary">Pending</Badge>
      case 'APPROVED':
        return <Badge variant="default" className="bg-green-500">Approved</Badge>
      case 'DECLINED':
        return <Badge variant="destructive">Declined</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  const pendingRequests = requests.filter(req => req.status === 'PENDING')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Customer Approval Requests</h3>
        <Badge variant="outline">{pendingRequests.length} pending</Badge>
      </div>

      {pendingRequests.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            No pending approval requests
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingRequests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {request.user.name}
                  </CardTitle>
                  {getStatusBadge(request.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    {request.user.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    {request.user.phone}
                  </div>
                  <div className="text-xs text-gray-500">
                    Requested on: {format(new Date(request.createdAt), 'PPP')}
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleApproval(request.id, 'approve')}
                      disabled={processing === request.id}
                      size="sm"
                      className="flex-1"
                    >
                      {processing === request.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Accept
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleApproval(request.id, 'decline')}
                      disabled={processing === request.id}
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                    >
                      {processing === request.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <X className="h-4 w-4 mr-1" />
                          Decline
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 