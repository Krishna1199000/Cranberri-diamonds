"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Diamond, CheckCircle, AlertCircle, Clock, RefreshCw, XCircle, Ban, Square, History } from "lucide-react"
import { formatDistanceToNow } from "date-fns/formatDistanceToNow"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { AdminLayout } from "@/components/layout/AdminLayout";
import { SyncStatus as PrismaSyncStatus } from '@prisma/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

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
  syncHistory: SyncLog[]
  stats: {
    totalDiamonds: number
  }
}

export default function SyncPage() {
  const [latestSyncStatus, setLatestSyncStatus] = useState<SyncLog | null>(null)
  const [syncHistory, setSyncHistory] = useState<SyncLog[]>([])
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
      
      setLatestSyncStatus(data.latestSync)
      setSyncHistory(Array.isArray(data.syncHistory) ? data.syncHistory : [])
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
        const currentStatus = latestSyncStatus?.status
        const isActiveSync = currentStatus === PrismaSyncStatus.STARTED || 
                             currentStatus === PrismaSyncStatus.STOPPING;
        const intervalDuration = isActiveSync ? POLLING_INTERVAL_ACTIVE : POLLING_INTERVAL_IDLE;

         intervalRef.current = setInterval(() => fetchSyncStatus(), intervalDuration);

         return () => {
             if (intervalRef.current) {
                 clearInterval(intervalRef.current);
             }
         };
    }, [latestSyncStatus?.status]);

  const getStatusPresentation = (status: SyncStatus | undefined): { icon: React.ReactNode, variant: "default" | "destructive" | "outline" | "secondary" | "success" | "info", textClass: string } => {
    switch (status) {
      case PrismaSyncStatus.COMPLETED:
        return { icon: <CheckCircle className="h-4 w-4 mr-1" />, variant: "success", textClass: "text-green-600 dark:text-green-400" };
      case PrismaSyncStatus.COMPLETED_WITH_ERRORS:
        return { icon: <AlertCircle className="h-4 w-4 mr-1" />, variant: "secondary", textClass: "text-yellow-600 dark:text-yellow-400" };
      case PrismaSyncStatus.FAILED:
        return { icon: <XCircle className="h-4 w-4 mr-1" />, variant: "destructive", textClass: "text-destructive" };
      case PrismaSyncStatus.STARTED:
        return { icon: <RefreshCw className="h-4 w-4 mr-1 animate-spin" />, variant: "info", textClass: "text-blue-500 dark:text-blue-400" };
      case PrismaSyncStatus.STOPPING:
        return { icon: <Ban className="h-4 w-4 mr-1 animate-pulse" />, variant: "secondary", textClass: "text-orange-500 dark:text-orange-400" };
      case PrismaSyncStatus.CANCELLED:
        return { icon: <Square className="h-4 w-4 mr-1" />, variant: "secondary", textClass: "text-gray-500 dark:text-gray-400" };
      case PrismaSyncStatus.UNKNOWN:
      default:
        return { icon: <Clock className="h-4 w-4 mr-1" />, variant: "outline", textClass: "text-gray-400" };
    }
  }
  
  const isActiveSync = latestSyncStatus?.status === PrismaSyncStatus.STARTED || 
                       latestSyncStatus?.status === PrismaSyncStatus.STOPPING;

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
          
           {latestSyncStatus?.status === PrismaSyncStatus.STARTED && (
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
           {latestSyncStatus?.status === PrismaSyncStatus.STOPPING && (
               <span className="text-sm text-orange-600 dark:text-orange-400 flex items-center gap-1">
                   <Ban className="h-4 w-4 animate-pulse"/> Stopping...
               </span>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Latest Sync Status</CardTitle>
            <CardDescription>
              {isActiveSync ? 'Sync is currently running.' : latestSyncStatus?.status === PrismaSyncStatus.UNKNOWN ? 'No sync data available.' : 'Status of the last sync attempt.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                 <strong>Error:</strong> {error}
                 <Button variant="default" size="sm" onClick={() => fetchSyncStatus()} className="ml-2 h-auto p-0 bg-transparent hover:bg-transparent text-destructive underline hover:text-destructive/80">Retry</Button>
              </div>
            )}
            
            {latestSyncStatus && latestSyncStatus.id ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm min-w-[80px]">Status:</span>
                  <Badge variant={getStatusPresentation(latestSyncStatus.status).variant} className={`text-xs ${getStatusPresentation(latestSyncStatus.status).textClass}`}>
                    {getStatusPresentation(latestSyncStatus.status).icon}
                    {latestSyncStatus.status.replace('_',' ')}
                  </Badge>
                </div>

                {(latestSyncStatus.status !== PrismaSyncStatus.UNKNOWN) && (
                  <div className="flex items-center gap-2 text-sm">
                     <span className="font-medium min-w-[80px]">Timestamp:</span>
                     <span className="text-muted-foreground">
                       {formatDistanceToNow(new Date(latestSyncStatus.createdAt), { addSuffix: true })}
                     </span>
                  </div>
                 )}

                {(latestSyncStatus.count >= 0) && (
                   <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium min-w-[80px]">Processed:</span>
                    <span className="text-muted-foreground">
                        {latestSyncStatus.count.toLocaleString()} diamonds
                        {isActiveSync ? '...' : ''}
                    </span>
                  </div>
                )}

                {latestSyncStatus.message && (
                   <div className="flex items-start gap-2 text-sm">
                     <span className="font-medium min-w-[80px] mt-px">Details:</span>
                     <p className={cn(
                         "flex-1",
                          latestSyncStatus.status === PrismaSyncStatus.FAILED ? 'text-destructive' : 'text-muted-foreground'
                     )}>
                       {latestSyncStatus.message}
                     </p>
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
                  Use the &apos;Sync Now&apos; button to update the diamond database from the external source. The process runs in the background. Auto-sync runs every 4 hours.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Sync History
              </CardTitle>
              <CardDescription>
                  Showing the last {syncHistory?.length || 0} sync attempts. 
              </CardDescription>
          </CardHeader>
          <CardContent>
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead className="w-[100px]">Status</TableHead>
                          <TableHead className="w-[180px]">Timestamp</TableHead>
                          <TableHead>Details</TableHead>
                          <TableHead className="text-right w-[120px]">Processed</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {Array.isArray(syncHistory) && syncHistory.length > 0 ? (
                          syncHistory.map((log) => {
                              if (!log || !log.id) return null; 
                              const presentation = getStatusPresentation(log.status);
                              return (
                                  <TableRow key={log.id}>
                                      <TableCell>
                                          <Badge variant={presentation.variant} className={`text-xs whitespace-nowrap ${presentation.textClass}`}> 
                                              {presentation.icon}
                                              {log.status.replace('_', ' ')}
                                          </Badge>
                                      </TableCell>
                                      <TableCell className="text-xs text-muted-foreground">
                                          {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                                      </TableCell>
                                      <TableCell className="text-xs">{log.message || '-'}</TableCell>
                                      <TableCell className="text-right text-xs">
                                          {log.count >= 0 ? log.count.toLocaleString() : '-'}
                                      </TableCell>
                                  </TableRow>
                              );
                          })
                      ) : (
                          <TableRow>
                              <TableCell colSpan={4} className="h-24 text-center text-sm text-muted-foreground">
                                  No sync history found.
                              </TableCell>
                          </TableRow>
                      )}
                  </TableBody>
              </Table>
          </CardContent>
       </Card>

    </AdminLayout>
  )
}
