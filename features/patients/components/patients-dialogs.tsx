 "use client";

import { usePatients } from "../context/patients-context";
import { PatientsActionDialog } from "./patients-action-dialog";
import { PatientsDeleteDialog } from "./patients-delete-dialog";

export function PatientsDialogs() {
  const { open, setOpen, currentRow, setCurrentRow, isAddDialogOpen, setIsAddDialogOpen, refreshPatients } = usePatients();
  
  return (
    <>
      <PatientsActionDialog
        key="patient-add"
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />

      {currentRow && (
        <>
          <PatientsActionDialog
            key={`patient-edit-${currentRow.id}`}
            open={open === "edit"}
            onOpenChange={() => {
              setOpen(null);
              setTimeout(() => {
                setCurrentRow(null);
              }, 500);
            }}
            currentRow={currentRow}
          />

          <PatientsDeleteDialog
            key={`patient-delete-${currentRow.id}`}
            open={open === "delete"}
            onOpenChange={() => {
              setOpen(null);
              setTimeout(() => {
                setCurrentRow(null);
              }, 500);
            }}
            currentRow={currentRow}
            onPatientDeleted={refreshPatients}
          />
        </>
      )}
    </>
  );
}


