import { useState, useEffect, useCallback } from 'react';

export interface ParticipantAttendance {
  id: string;
  name: string;
  email: string;
  image?: string;
  status: 'present' | 'absent' | 'checking';
  verified: boolean;
  confidence: number;
  recognizedAt: Date | null;
  isOnline: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'unknown';
}

export interface AttendanceStatistics {
  total: number;
  present: number;
  absent: number;
  verified: number;
  online: number;
  attendanceRate: number;
}

interface UseRealTimeAttendanceOptions {
  classId: string;
  refreshInterval?: number;
  enabled?: boolean;
  liveKitParticipants?: any[]; // LiveKit participants from useParticipants()
}

export function useRealTimeAttendance({
  classId,
  refreshInterval = 5000,
  enabled = true,
  liveKitParticipants = []
}: UseRealTimeAttendanceOptions) {
  const [participants, setParticipants] = useState<ParticipantAttendance[]>([]);
  const [statistics, setStatistics] = useState<AttendanceStatistics>({
    total: 0,
    present: 0,
    absent: 0,
    verified: 0,
    online: 0,
    attendanceRate: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch attendance data from API
  const fetchAttendance = useCallback(async () => {
    if (!enabled || !classId) return;

    try {
      const response = await fetch(`/api/attendance/live?classId=${classId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch attendance data');
      }

      const data = await response.json();
      
      if (data.success) {
        // Create a map of online participants from LiveKit
        const onlineParticipantIds = new Set(
          liveKitParticipants.map(p => {
            // Extract user ID from participant identity
            // Assuming identity format is "userId" or "email"
            return p.identity;
          })
        );

        // Merge API data with LiveKit online status
        const mergedParticipants = data.data.participants.map((p: any) => {
          const isOnline = onlineParticipantIds.has(p.id) || 
                          onlineParticipantIds.has(p.email);
          
          // Find LiveKit participant for connection quality
          const liveKitParticipant = liveKitParticipants.find(
            lp => lp.identity === p.id || lp.identity === p.email
          );

          let connectionQuality: 'excellent' | 'good' | 'poor' | 'unknown' = 'unknown';
          if (liveKitParticipant) {
            const quality = liveKitParticipant.connectionQuality;
            if (quality === 'excellent') connectionQuality = 'excellent';
            else if (quality === 'good') connectionQuality = 'good';
            else if (quality === 'poor') connectionQuality = 'poor';
          }

          return {
            ...p,
            isOnline,
            connectionQuality,
            recognizedAt: p.recognizedAt ? new Date(p.recognizedAt) : null
          };
        });

        setParticipants(mergedParticipants);
        
        // Update statistics
        const onlineCount = mergedParticipants.filter((p: ParticipantAttendance) => p.isOnline).length;
        setStatistics({
          ...data.data.statistics,
          online: onlineCount
        });
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch attendance');
    } finally {
      setIsLoading(false);
    }
  }, [classId, enabled, liveKitParticipants]);

  // Initial fetch
  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // Periodic refresh
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(fetchAttendance, refreshInterval);
    return () => clearInterval(interval);
  }, [enabled, refreshInterval, fetchAttendance]);

  // Refresh when LiveKit participants change
  useEffect(() => {
    if (enabled && liveKitParticipants.length > 0) {
      fetchAttendance();
    }
  }, [liveKitParticipants.length, enabled, fetchAttendance]);

  // Export attendance
  const exportAttendance = useCallback(async (format: 'csv' | 'json' = 'csv') => {
    try {
      const response = await fetch(`/api/attendance/export?classId=${classId}&format=${format}`);
      
      if (!response.ok) {
        throw new Error('Failed to export attendance');
      }

      if (format === 'csv') {
        // Download CSV file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance-${classId}-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // Return JSON data
        const data = await response.json();
        return data;
      }
    } catch (err) {
      console.error('Error exporting attendance:', err);
      throw err;
    }
  }, [classId]);

  // Manually refresh
  const refresh = useCallback(() => {
    setIsLoading(true);
    fetchAttendance();
  }, [fetchAttendance]);

  return {
    participants,
    statistics,
    isLoading,
    error,
    refresh,
    exportAttendance,
    isConnected: true // Always return true since we're not using room context
  };
}
