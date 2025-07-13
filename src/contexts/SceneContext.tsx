
"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SceneContextType {
  movementMultiplier: number;
  setMovementMultiplier: (value: number) => void;
  isMovementEnabled: boolean;
  setIsMovementEnabled: (value: boolean) => void;
}

const SceneContext = createContext<SceneContextType | undefined>(undefined);

export const SceneProvider = ({ children }: { children: ReactNode }) => {
  const [movementMultiplier, setMovementMultiplier] = useState(1);
  const [isMovementEnabled, setIsMovementEnabled] = useState(true);

  return (
    <SceneContext.Provider value={{ movementMultiplier, setMovementMultiplier, isMovementEnabled, setIsMovementEnabled }}>
      {children}
    </SceneContext.Provider>
  );
};

export const useSceneContext = () => {
  const context = useContext(SceneContext);
  if (context === undefined) {
    throw new Error('useSceneContext must be used within a SceneProvider');
  }
  return context;
};
