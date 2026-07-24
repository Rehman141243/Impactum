import { useEffect, useRef, useState, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';


export type NetworkStatus = 'checking' | 'online' | 'offline';

interface UseNetworkStatusResult {
  status: NetworkStatus;
  isConnected: boolean;
  isInternetReachable: boolean | null;
  retry: () => void;
}


export function useNetworkStatus(): UseNetworkStatusResult {
  const [status, setStatus] = useState<NetworkStatus>('checking');
  const [isConnected, setIsConnected] = useState(false);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(null);
  const hasResolvedOnce = useRef(false);

  const applyState = useCallback((state: NetInfoState) => {
    const connected = !!state.isConnected;
    const reachable = state.isInternetReachable;

    setIsConnected(connected);
    setIsInternetReachable(reachable);


    if (!connected || reachable === false) {
      setStatus('offline');
      hasResolvedOnce.current = true;
    } else if (connected && reachable) {
      setStatus('online');
      hasResolvedOnce.current = true;
    } else if (!hasResolvedOnce.current) {
      setStatus('checking');
    }
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(applyState);
    NetInfo.fetch().then(applyState);
    return () => unsubscribe();
  }, [applyState]);

  const retry = useCallback(() => {
    setStatus('checking');
    NetInfo.fetch().then(applyState);
  }, [applyState]);

  return { status, isConnected, isInternetReachable, retry };
}