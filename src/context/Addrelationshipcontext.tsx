import React, { createContext, useContext, useState, useCallback } from 'react';

interface CtxType {
  visible: boolean;
  currentUserName: string;
  openModal: (userName?: string) => void;
  closeModal: () => void;
  onSuccessCallback: React.MutableRefObject<(() => void) | null>;
}

const Ctx = createContext<CtxType>({} as CtxType);

export function useAddRelationship() {
  return useContext(Ctx);
}

export function AddRelationshipProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [currentUserName, setCurrentUserName] = useState('');
  const onSuccessCallback = React.useRef<(() => void) | null>(null);

  const openModal = useCallback((userName = '') => {
    setCurrentUserName(userName);
    setVisible(true);
  }, []);

  const closeModal = useCallback(() => setVisible(false), []);

  return (
    <Ctx.Provider value={{ visible, currentUserName, openModal, closeModal, onSuccessCallback }}>
      {children}
    </Ctx.Provider>
  );
}