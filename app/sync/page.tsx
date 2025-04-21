"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Diamond, CheckCircle, AlertCircle, Clock, RefreshCw } from "lucide-react"
import { formatDistanceToNow } from "date-fns/formatDistanceToNow"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { Button } from "@/components/ui/button"
import { toast } from "sonner" // Assuming you use sonner for toast notifications

interface SyncLog {
  id: string
  status: string
  message: string | null
  count: number
  createdAt: string
}

interface SyncResponse {
  latestSync: SyncLog
  stats: {
    totalDiamonds: number
  }
}

export default function AdminPage() {
  const [syncStatus, setSyncStatus] = useState<SyncLog | null>(null)
  const [diamondCount, setDiamondCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSyncStatus = async () => {
    try {
      setError(null)
      const response = await fetch('/api/sync')
      if (!response.ok) {
        throw new Error('Failed to fetch sync status')
      }
      const data: SyncResponse = await response.json()
      setSyncStatus(data.latestSync)
      setDiamondCount(data.stats.totalDiamonds)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const triggerManualSync = async () => {
    try {
      setIsSyncing(true)
      const response = await fetch('/api/admin/async', {
        method: 'POST',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to start sync')
      }
      
      const data = await response.json()
      if (data.started) {
        toast.success('Diamond sync process started')
        // Fetch the latest status after a short delay to show the STARTED status
        setTimeout(fetchSyncStatus, 2000)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start sync')
    } finally {
      setIsSyncing(false)
    }
  }

  useEffect(() => {
    fetchSyncStatus()
    // Poll for updates every minute
    const interval = setInterval(fetchSyncStatus, 60000)
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'FAILED':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'STARTED':
        return <Clock className="h-5 w-5 text-yellow-500" />
      default:
        return null
    }
  }

  const getNextSyncTime = () => {
    if (!syncStatus?.createdAt) return null
    const lastSync = new Date(syncStatus.createdAt)
    const nextSync = new Date(lastSync.getTime() + (4 * 60 * 60 * 1000)) // 4 hours
    return formatDistanceToNow(nextSync, { addSuffix: true })
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold flex items-center gap-2">
          <Diamond className="h-8 w-8 text-primary" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
            Diamond Sync Status
          </span>
        </h1>
        
        <Button 
          variant="outline" 
          onClick={triggerManualSync} 
          disabled={isSyncing || syncStatus?.status === 'STARTED'}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync Now'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Latest Sync Status</CardTitle>
            <CardDescription>
              Diamonds are automatically synced every 4 hours
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md">
                {error}
              </div>
            )}
            
            {syncStatus ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Status:</span>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(syncStatus.status)}
                    <span>{syncStatus.status}</span>
                  </div>
                </div>
                
                <div>
                  <span className="font-medium">Last Sync:</span>
                  <span className="ml-2">
                    {formatDistanceToNow(new Date(syncStatus.createdAt), { addSuffix: true })}
                  </span>
                </div>

                <div>
                  <span className="font-medium">Next Sync:</span>
                  <span className="ml-2">
                    {getNextSyncTime()}
                  </span>
                </div>
                
                {syncStatus.count > 0 && (
                  <div>
                    <span className="font-medium">Diamonds Updated:</span>
                    <span className="ml-2">{syncStatus.count}</span>
                  </div>
                )}
                
                {syncStatus.message && (
                  <div>
                    <span className="font-medium">Message:</span>
                    <span className="ml-2">{syncStatus.message}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-muted-foreground">No sync history found</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Database Stats</CardTitle>
            <CardDescription>
              Current database statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <span className="font-medium">Total Diamonds:</span>
                <span className="ml-2">
                  {diamondCount}
                </span>
              </div>
              
              <Separator />
              
              <div>
                <p className="text-muted-foreground">
                  The database is automatically updated every 4 hours to ensure you have the latest diamond data.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}