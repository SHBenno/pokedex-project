"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import React, { ReactNode, useMemo } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient();
  const context = React.createContext({ name: 'Default' });
  const contextValue = useMemo(() => ({ name: 'Ant Design' }), []);

  return (
    <QueryClientProvider client={queryClient}>
      <context.Provider value={contextValue}>{children}</context.Provider>
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="top-right"/>
    </QueryClientProvider>
  )
}