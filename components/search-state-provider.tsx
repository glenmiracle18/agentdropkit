"use client";

import { createContext, useContext, useTransition } from "react";

interface SearchStateContextValue {
  isPending: boolean;
  startSearchTransition: (fn: () => void) => void;
}

const SearchStateContext = createContext<SearchStateContextValue>({
  isPending: false,
  startSearchTransition: (fn) => fn(),
});

export function SearchStateProvider({ children }: { children: React.ReactNode }) {
  const [isPending, startTransition] = useTransition();

  return (
    <SearchStateContext.Provider
      value={{ isPending, startSearchTransition: startTransition }}
    >
      {children}
    </SearchStateContext.Provider>
  );
}

export function useSearchState() {
  return useContext(SearchStateContext);
}
