"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Diamond, RefreshCw, CheckCircle, AlertCircle, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";

interface SyncLog {
  id: string
  status: string
  message: string | null
  count: number
  createdAt: string
}

export default function AdminPage() {
  const [syncStatus, setSyncStatus] = useState<SyncLog | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSyncStatus = async () => {
    try {
      const response = await fetch('/api/sync')
      if (!response.ok) {
        throw new Error('Failed to fetch sync status')
      }
      const data = await response.json()
      setSyncStatus(data.latestSync)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  useEffect(() => {
    fetchSyncStatus()
  }, [])

  const handleSync = async () => {
    setIsSyncing(true);
    setError(null);
    
    try {
      // Run the sync script using a shell command
      const response = await fetch('/api/admin/sync', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to start sync process');
      }
      
      // Poll for sync status
      const checkStatus = setInterval(async () => {
        // Don't try to use response.json() here again
        // Instead, just call fetchSyncStatus which will update the syncStatus state
        await fetchSyncStatus();
        
        // Check if sync is complete based on the state
        if (syncStatus?.status === 'COMPLETED') {
          clearInterval(checkStatus);
          setIsSyncing(false);
        }
      }, 2000);
      
      // Set a timeout to stop polling after 5 minutes
      setTimeout(() => {
        clearInterval(checkStatus);
        setIsSyncing(false);
      }, 5 * 60 * 1000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsSyncing(false);
    }
  };
  

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold flex items-center gap-2">
          <Diamond className="h-8 w-8 text-primary" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
            Admin Dashboard
          </span>
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Diamond Sync</CardTitle>
            <CardDescription>
              Sync diamonds from the external API to your database
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
                  <span className="font-medium">Last Sync Status:</span>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(syncStatus.status)}
                    <span>{syncStatus.status}</span>
                  </div>
                </div>
                
                <div>
                  <span className="font-medium">Last Run:</span>
                  <span className="ml-2">
                    {formatDistanceToNow(new Date(syncStatus.createdAt), { addSuffix: true })}
                  </span>
                </div>
                
                {syncStatus.count > 0 && (
                  <div>
                    <span className="font-medium">Diamonds Synced:</span>
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
          <CardFooter>
            <Button 
              onClick={handleSync} 
              disabled={isSyncing}
              className="w-full"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync Diamonds
                </>
              )}
            </Button>
          </CardFooter>
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
                  {syncStatus?.count || 0}
                </span>
              </div>
              
              <Separator />
              
              <div>
                <p className="text-muted-foreground">
                  The database is now used to serve diamond data instead of fetching from the external API each time.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}