"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Patient } from "../data/schema";

type Open = "add" | "edit" | null;

interface PatientsContextType {
  open: Open;
  setOpen: (open: Open) => void;
  currentRow: Patient | null;
  setCurrentRow: (row: Patient | null) => void;
  onPatientAdded: () => void;
  isAddDialogOpen: boolean;
  setIsAddDialogOpen: (open: boolean) => void;
  refreshPatients: () => void;
  setRefreshPatients: (fn: () => void) => void;
}

const PatientsContext = createContext<PatientsContextType | undefined>(undefined);

interface PatientsProviderProps {
  children: ReactNode;
  onPatientAdded?: () => void;
}

export default function PatientsProvider({ 
  children, 
  onPatientAdded = () => {} 
}: PatientsProviderProps) {
  const [open, setOpen] = useState<Open>(null);
  const [currentRow, setCurrentRow] = useState<Patient | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [refreshPatients, setRefreshPatients] = useState<() => void>(() => () => {});

  return (
    <PatientsContext.Provider
      value={{
        open,
        setOpen,
        currentRow,
        setCurrentRow,
        onPatientAdded,
        isAddDialogOpen,
        setIsAddDialogOpen,
        refreshPatients,
        setRefreshPatients,
      }}
    >
      {children}
    </PatientsContext.Provider>
  );
}

export function usePatients() {
  const context = useContext(PatientsContext);
  if (context === undefined) {
    throw new Error("usePatients must be used within a PatientsProvider");
  }
  return context;
}

