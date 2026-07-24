import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

interface DeleteRelationshipContextValue {
  visible: boolean;
  partnerName: string;
  deleting: boolean;
  openSheet: (params: { partnerName: string; onConfirm: () => Promise<void> }) => void;
  closeSheet: () => void;
  confirmDelete: () => void;
}

const DeleteRelationshipContext = createContext<DeleteRelationshipContextValue | null>(null);

export function DeleteRelationshipProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const [deleting, setDeleting] = useState(false);
  const onConfirmRef = useRef<(() => Promise<void>) | null>(null);

  const openSheet = useCallback(({ partnerName: name, onConfirm }: { partnerName: string; onConfirm: () => Promise<void> }) => {
    setPartnerName(name);
    onConfirmRef.current = onConfirm;
    setVisible(true);
  }, []);

  const closeSheet = useCallback(() => {
    if (deleting) return;
    setVisible(false);
  }, [deleting]);

  const confirmDelete = useCallback(async () => {
    if (!onConfirmRef.current) return;
    try {
      setDeleting(true);
      await onConfirmRef.current();
      setVisible(false);
    } catch {
      setVisible(false);
    } finally {
      setDeleting(false);
    }
  }, []);

  return (
    <DeleteRelationshipContext.Provider value={{ visible, partnerName, deleting, openSheet, closeSheet, confirmDelete }}>
      {children}
    </DeleteRelationshipContext.Provider>
  );
}

export function useDeleteRelationship() {
  const ctx = useContext(DeleteRelationshipContext);
  if (!ctx) throw new Error('useDeleteRelationship must be used inside DeleteRelationshipProvider');
  return ctx;
}