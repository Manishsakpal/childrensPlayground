
"use client";

import React, { createContext, useState, useContext, ReactNode } from 'react';

interface SceneContextType {
  movementMultiplier: number;
  setMovementMultiplier: (multiplier: number) => void;
}

const SceneContext = createContext<SceneContextType | undefined>(undefined);

export const SceneProvider = ({ children }: { children: ReactNode }) => {
  const [movementMultiplier, setMovementMultiplier] = useState(1);

  return (
    <SceneContext.Provider value={{ movementMultiplier, setMovementMultiplier }}>
      {children}
    </SceneContext.Provider>
  );
};

export const useSceneContext = () => {
  const context = useContext(SceneContext);
  if (context === undefined) {
    // This provides a default value when context is used outside of the provider.
    // This can happen in the Header when it's rendered on a page other than /scene.
    return {
        movementMultiplier: 1,
        setMovementMultiplier: () => {}
    };
  }
  return context;
};
