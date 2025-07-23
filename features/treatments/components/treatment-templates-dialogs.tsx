 "use client";
import { useTreatmentTemplates } from "../context/treatment-templates-context";
import { TreatmentTemplatesActionDialog } from "./treatment-templates-action-dialog";
import { TreatmentTemplatesDeleteDialog } from "./treatment-templates-delete-dialog";

export function TreatmentTemplatesDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useTreatmentTemplates();
  
  return (
    <>
      <TreatmentTemplatesActionDialog
        key="treatment-template-add"
        open={open === "add"}
        onOpenChange={(state) => {
          if (!state) {
            setOpen(null);
          }
        }}
      />

      {currentRow && (
        <>
          <TreatmentTemplatesActionDialog
            key={`treatment-template-edit-${currentRow.id}`}
            open={open === "edit"}
            onOpenChange={() => {
              setOpen(null);
              setTimeout(() => {
                setCurrentRow(null);
              }, 500);
            }}
            currentRow={currentRow}
          />

          <TreatmentTemplatesDeleteDialog
            key={`treatment-template-delete-${currentRow.id}`}
            open={open === "delete"}
            onOpenChange={() => {
              setOpen(null);
              setTimeout(() => {
                setCurrentRow(null);
              }, 500);
            }}
            currentRow={currentRow}
          />
        </>
      )}
    </>
  );
}

