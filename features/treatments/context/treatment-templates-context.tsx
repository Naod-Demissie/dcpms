 "use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { TreatmentTemplate } from "../data/treatment-template-schema";

type Open = "add" | "edit" | "delete" | null;

interface TreatmentTemplatesContextType {
  open: Open;
  setOpen: (open: Open) => void;
  currentRow: TreatmentTemplate | null;
  setCurrentRow: (row: TreatmentTemplate | null) => void;
  refreshTreatmentTemplates: () => void;
  setRefreshTreatmentTemplates: (fn: () => void) => void;
}

const TreatmentTemplatesContext = createContext<TreatmentTemplatesContextType | undefined>(undefined);

interface TreatmentTemplatesProviderProps {
  children: ReactNode;
}

export default function TreatmentTemplatesProvider({
  children,
}: TreatmentTemplatesProviderProps) {
  const [open, setOpen] = useState<Open>(null);
  const [currentRow, setCurrentRow] = useState<TreatmentTemplate | null>(null);
  const [refreshTreatmentTemplates, setRefreshTreatmentTemplates] = useState<() => void>(() => () => {});

  return (
    <TreatmentTemplatesContext.Provider
      value={{
        open,
        setOpen,
        currentRow,
        setCurrentRow,
        refreshTreatmentTemplates,
        setRefreshTreatmentTemplates,
      }}
    >
      {children}
    </TreatmentTemplatesContext.Provider>
  );
}

export function useTreatmentTemplates() {
  const context = useContext(TreatmentTemplatesContext);
  if (context === undefined) {
    throw new Error("useTreatmentTemplates must be used within a TreatmentTemplatesProvider");
  }
  return context;
}

