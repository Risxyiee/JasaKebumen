"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

interface SearchState {
  query: string;
  setQuery: (q: string) => void;
  district: string;
  setDistrict: (d: string) => void;
  reset: () => void;
}

const SearchCtx = createContext<SearchState | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState("all");
  const reset = useCallback(() => { setQuery(""); setDistrict("all"); }, []);

  const value = useMemo(
    () => ({ query, setQuery, district, setDistrict, reset }),
    [query, district, reset],
  );
  return <SearchCtx.Provider value={value}>{children}</SearchCtx.Provider>;
}

export function useSearch() {
  const ctx = useContext(SearchCtx);
  if (!ctx) throw new Error("useSearch harus dipakai di dalam <SearchProvider>");
  return ctx;
}

export function scrollToDirectory() {
  document.getElementById("penyedia")?.scrollIntoView({ behavior: "smooth" });
}
