"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Diamond, CheckCircle, AlertCircle, Clock, RefreshCw, XCircle, Ban, Square } from "lucide-react"
import { formatDistanceToNow } from "date-fns/formatDistanceToNow"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { AdminLayout } from "@/components/layout/AdminLayout";
import { SyncStatus as PrismaSyncStatus } from '@prisma/client';

type SyncStatus = PrismaSyncStatus;

interface SyncLog {
  id: string
  status: SyncStatus
  message: string | null
  count: number
  createdAt: string | Date
}

interface SyncResponse {
  latestSync: SyncLog
  stats: {
    totalDiamonds: number
  }
}

export default function SyncPage() {
  const [syncStatus, setSyncStatus] = useState<SyncLog | null>(null)
  const [diamondCount, setDiamondCount] = useState<number>(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const POLLING_INTERVAL_ACTIVE = 5000
  const POLLING_INTERVAL_IDLE = 60000

  const fetchSyncStatus = async () => {
    try {
      setError(null)
      const response = await fetch('/api/sync')
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch sync status (${response.status})`)
      }
      const data: SyncResponse = await response.json()
      
      const isActiveSync = data.latestSync?.status === PrismaSyncStatus.STARTED || 
                           data.latestSync?.status === PrismaSyncStatus.STOPPING;
      
      setSyncStatus(data.latestSync)
      setDiamondCount(data.stats.totalDiamonds)
      
      setIsSyncing(isActiveSync);
      if (!isActiveSync) {
        setIsStopping(false)
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }

  const triggerManualSync = async () => {
    setIsSyncing(true)
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
      })
      
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 409) {
          toast.warning(data.message || 'Sync process is already running.')
        } else {
          throw new Error(data.error || `Failed to start sync (${response.status})`)
        }
      } else if (data.started) {
        toast.success('Diamond sync process started')
        await fetchSyncStatus() 
        if (intervalRef.current) clearInterval(intervalRef.current)
        intervalRef.current = setInterval(() => fetchSyncStatus(), POLLING_INTERVAL_ACTIVE)
      } else {
        toast.info(data.message || 'Sync did not start.')
        setIsSyncing(false) 
      }

    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start sync')
      setIsSyncing(false) 
    }
  }
  
  const triggerStopSync = async () => {
    setIsStopping(true)
    try {
      const response = await fetch('/api/sync', {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Failed to stop sync (${response.status})`)
      }

      toast.info('Sync stop request sent. Process will halt shortly.')
       await fetchSyncStatus() 

    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send stop request')
      setIsStopping(false) 
    }
  }

  useEffect(() => {
    fetchSyncStatus()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

   useEffect(() => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        const currentStatus = syncStatus?.status
        const isActiveSync = currentStatus === PrismaSyncStatus.STARTED || 
                             currentStatus === PrismaSyncStatus.STOPPING;
        const intervalDuration = isActiveSync ? POLLING_INTERVAL_ACTIVE : POLLING_INTERVAL_IDLE;

         intervalRef.current = setInterval(() => fetchSyncStatus(), intervalDuration);

         return () => {
             if (intervalRef.current) {
                 clearInterval(intervalRef.current);
             }
         };
    }, [syncStatus?.status]);

  const getStatusIcon = (status: SyncStatus | undefined) => {
    switch (status) {
      case PrismaSyncStatus.COMPLETED:
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case PrismaSyncStatus.COMPLETED_WITH_ERRORS:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case PrismaSyncStatus.FAILED:
        return <XCircle className="h-5 w-5 text-red-500" />
      case PrismaSyncStatus.STARTED:
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
      case PrismaSyncStatus.STOPPING:
        return <Ban className="h-5 w-5 text-orange-500 animate-pulse" />
      case PrismaSyncStatus.CANCELLED:
        return <Square className="h-5 w-5 text-gray-500" />
      case PrismaSyncStatus.UNKNOWN:
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }
  
  const isActiveSync = syncStatus?.status === PrismaSyncStatus.STARTED || 
                       syncStatus?.status === PrismaSyncStatus.STOPPING;

  function cn(...classes: (string | false | null | undefined)[]): string {
    return classes.filter(Boolean).join(' ')
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-2">
          <Diamond className="h-8 w-8 text-primary" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
            Diamond Sync Status
          </span>
        </h1>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={triggerManualSync} 
            disabled={isSyncing || isStopping}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing && !isStopping ? 'animate-spin' : ''}`} />
            {isSyncing && !isStopping ? 'Syncing...' : 'Sync Now'}
          </Button>
          
           {syncStatus?.status === PrismaSyncStatus.STARTED && (
              <Button 
                variant="outline"
                onClick={triggerStopSync} 
                disabled={isStopping}
                className="flex items-center gap-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 border-red-300 hover:border-red-400"
              >
                <Square className={`h-4 w-4 ${isStopping ? 'animate-pulse' : ''}`} /> 
                {isStopping ? 'Stopping...' : 'Stop Sync'}
              </Button>
          )}
           {syncStatus?.status === PrismaSyncStatus.STOPPING && (
               <span className="text-sm text-orange-600 dark:text-orange-400 flex items-center gap-1">
                   <Ban className="h-4 w-4 animate-pulse"/> Stopping...
               </span>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Latest Sync Status</CardTitle>
            <CardDescription>
              {isActiveSync ? 'Sync is currently running.' : syncStatus?.status === PrismaSyncStatus.UNKNOWN ? 'No sync data available.' : 'Status of the last sync attempt.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                 <strong>Error:</strong> {error} 
                 <Button variant="default" size="sm" onClick={() => fetchSyncStatus()} className="ml-2 h-auto p-0 bg-transparent hover:bg-transparent text-destructive underline hover:text-destructive/80">Retry</Button>
              </div>
            )}
            
            {syncStatus && syncStatus.status !== PrismaSyncStatus.UNKNOWN ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">Status:</span>
                  <div className="flex items-center gap-1 text-sm font-semibold">
                    {getStatusIcon(syncStatus.status)}
                    <span 
                      className={cn(
                        syncStatus.status === PrismaSyncStatus.FAILED && 'text-destructive',
                        syncStatus.status === PrismaSyncStatus.COMPLETED_WITH_ERRORS && 'text-yellow-600 dark:text-yellow-400',
                        syncStatus.status === PrismaSyncStatus.CANCELLED && 'text-gray-500 dark:text-gray-400',
                        syncStatus.status === PrismaSyncStatus.STOPPING && 'text-orange-500 dark:text-orange-400',
                        syncStatus.status === PrismaSyncStatus.STARTED && 'text-blue-500 dark:text-blue-400',
                        syncStatus.status === PrismaSyncStatus.COMPLETED && 'text-green-600 dark:text-green-400'
                      )}
                    >
                      {syncStatus.status.replace('_',' ')}
                    </span>
                  </div>
                </div>

                {syncStatus.message && (
                   <p className={cn(
                       "text-sm",
                        syncStatus.status === PrismaSyncStatus.FAILED ? 'text-destructive' : 'text-muted-foreground'
                   )}>
                    <span className="font-medium">Details:</span> {syncStatus.message}
                  </p>
                )}
                
                {(syncStatus.status === PrismaSyncStatus.STARTED || syncStatus.status === PrismaSyncStatus.STOPPING || syncStatus.status === PrismaSyncStatus.COMPLETED || syncStatus.status === PrismaSyncStatus.COMPLETED_WITH_ERRORS || syncStatus.status === PrismaSyncStatus.CANCELLED) && (
                  <div className="text-sm">
                     <span className="font-medium">Timestamp:</span>
                     <span className="ml-2 text-muted-foreground">
                       {formatDistanceToNow(new Date(syncStatus.createdAt), { addSuffix: true })}
                     </span>
                  </div>
                 )}

                {(syncStatus.status === PrismaSyncStatus.STARTED || syncStatus.status === PrismaSyncStatus.COMPLETED || syncStatus.status === PrismaSyncStatus.COMPLETED_WITH_ERRORS || syncStatus.status === PrismaSyncStatus.CANCELLED || syncStatus.status === PrismaSyncStatus.STOPPING) && syncStatus.count >= 0 && (
                  <div className="text-sm">
                    <span className="font-medium">Diamonds Processed:</span>
                    <span className="ml-2 text-muted-foreground">{syncStatus.count}{isActiveSync ? '...' : ''}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground italic">
                { !error ? 'No sync history found.' : 'Could not load status.'}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Database Stats</CardTitle>
            <CardDescription>
              Current diamond inventory count
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">Total Diamonds:</span>
                <span className="text-sm font-semibold">
                   {diamondCount.toLocaleString()} 
                </span>
              </div>
              
              <Separator />
              
              <div>
                <p className="text-xs text-muted-foreground">
                  Use the &apos;Sync Now&apos; button to update the diamond database from the external source. The process runs in the background.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
