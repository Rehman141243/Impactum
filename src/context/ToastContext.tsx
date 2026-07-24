import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import SwipeableToast from '../components/common/SwipeableToast';
import { useResponsive } from '../utils/responsive';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastCounter = 0;

function ToastOverlay({
  toast,
  onDismiss,
}: {
  toast: ToastItem | null;
  onDismiss: (id: string) => void;
}) {
  const { horizontalPadding } = useResponsive();

  if (!toast) return null;

  return (
    <View pointerEvents="box-none" style={styles.overlay}>
      <View
        pointerEvents="box-none"
        style={[styles.centerWrap, { paddingHorizontal: horizontalPadding }]}>
        <SwipeableToast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onDismiss={onDismiss}
        />
      </View>
    </View>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastItem | null>(null);

  const dismissToast = useCallback((id: string) => {
    setToast(current => (current?.id === id ? null : current));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration?: number) => {
      const id = `toast-${++toastCounter}`;
      setToast({ id, message, type, duration });
    },
    [],
  );

  const showSuccess = useCallback(
    (message: string, duration?: number) => showToast(message, 'success', duration),
    [showToast],
  );

  const showError = useCallback(
    (message: string, duration?: number) => showToast(message, 'error', duration),
    [showToast],
  );

  const showWarning = useCallback(
    (message: string, duration?: number) => showToast(message, 'warning', duration),
    [showToast],
  );

  const showInfo = useCallback(
    (message: string, duration?: number) => showToast(message, 'info', duration),
    [showToast],
  );

  const value = useMemo(
    () => ({ showToast, showSuccess, showError, showWarning, showInfo }),
    [showToast, showSuccess, showError, showWarning, showInfo],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastOverlay toast={toast} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 10,
  },
  centerWrap: {
    position:'absolute',
    bottom:20,
    left:0,
    right:0,
    justifyContent:'center',
    alignItems:'center',

  },
});

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
