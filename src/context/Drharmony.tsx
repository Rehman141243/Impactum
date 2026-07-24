
import React, { createContext, useContext, useRef, useState } from 'react';

type OpenParams = {
  relationship: any;
  myName: string;
  partnerName: string;
};

type DrHarmonyContextType = {
  visible: boolean;
  relationship: any;
  myName: string;
  partnerName: string;
  openModal: (params: OpenParams) => void;
  closeModal: () => void;
};

const DrHarmonyContext = createContext<DrHarmonyContextType | null>(null);

export function DrHarmonyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  const [relationship, setRelationship] = useState<any>(null);
  const [myName, setMyName] = useState('');
  const [partnerName, setPartnerName] = useState('');

  const openModal = (params: OpenParams) => {
    setRelationship(params.relationship);
    setMyName(params.myName);
    setPartnerName(params.partnerName);
    setVisible(true);
  };

  const closeModal = () => {
    setVisible(false);
  };

  return (
    <DrHarmonyContext.Provider
      value={{
        visible,
        relationship,
        myName,
        partnerName,
        openModal,
        closeModal,
      }}>
      {children}
    </DrHarmonyContext.Provider>
  );
}

export function useDrHarmony() {
  const context = useContext(DrHarmonyContext);

  if (!context) {
    throw new Error('useDrHarmony must be used inside DrHarmonyProvider');
  }

  return context;
}