"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Clock, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'

interface ApprovalStatus {
  status: 'PENDING' | 'APPROVED' | 'DECLINED'
  message?: string
}

export default function CustomerApprovalPage() {
  const router = useRouter()
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    checkApprovalStatus()
  }, [])

  const checkApprovalStatus = async () => {
    try {
      const response = await fetch('/api/auth/approval-status', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setApprovalStatus(data)
        
        // If approved, redirect to customer dashboard
        if (data.status === 'APPROVED') {
          router.push('/Customer')
        }
      } else {
        // If not authenticated, redirect to signin
        router.push('/auth/signin')
      }
    } catch (error) {
      console.error('Error checking approval status:', error)
      toast.error('Failed to check approval status')
    } finally {
      setLoading(false)
    }
  }

  const sendApprovalRequest = async () => {
    setRequesting(true)
    try {
      const response = await fetch('/api/auth/request-approval', {
        method: 'POST',
        credentials: 'include'
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Approval request sent successfully')
        checkApprovalStatus() // Refresh status
      } else {
        toast.error(data.message || 'Failed to send approval request')
      }
    } catch (error) {
      console.error('Error sending approval request:', error)
      toast.error('Failed to send approval request')
    } finally {
      setRequesting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  if (!approvalStatus) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Welcome to Cranberri Diamonds
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {approvalStatus.status === 'PENDING' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <Clock className="h-16 w-16 text-yellow-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Hello, {approvalStatus.message?.split(',')[0] || 'there'}!
                </h3>
                <p className="text-gray-600">
                  We&apos;ll accept your invite shortly. Our team is reviewing your request.
                </p>
              </div>
              <div className="pt-4">
                <Button 
                  onClick={sendApprovalRequest}
                  disabled={requesting}
                  variant="outline"
                  className="w-full"
                >
                  {requesting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending Request...
                    </>
                  ) : (
                    'Send Request Again'
                  )}
                </Button>
              </div>
            </div>
          )}

          {approvalStatus.status === 'DECLINED' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <XCircle className="h-16 w-16 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Request Declined
                </h3>
                <p className="text-gray-600">
                  Admin declined your request. You can send a new request for approval.
                </p>
              </div>
              <div className="pt-4">
                <Button 
                  onClick={sendApprovalRequest}
                  disabled={requesting}
                  className="w-full"
                >
                  {requesting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending Request...
                    </>
                  ) : (
                    'Send Request Again'
                  )}
                </Button>
              </div>
            </div>
          )}

          {approvalStatus.status === 'APPROVED' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Welcome!
                </h3>
                <p className="text-gray-600">
                  Your account has been approved. You can now access our services.
                </p>
              </div>
              <div className="pt-4">
                <Button 
                  onClick={() => router.push('/Customer')}
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 