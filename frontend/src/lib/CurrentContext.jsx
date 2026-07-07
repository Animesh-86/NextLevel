'use client';

import React, { createContext, useContext, useState } from 'react';

const CurrentContext = createContext({
  activeContext: '',
  setActiveContext: () => {},
});

export function CurrentContextProvider({ children }) {
  const [activeContext, setActiveContext] = useState('');

  return (
    <CurrentContext.Provider value={{ activeContext, setActiveContext }}>
      {children}
    </CurrentContext.Provider>
  );
}

export function useCurrentContext() {
  return useContext(CurrentContext);
}
