"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Patient } from "../data/schema";
import { deletePatient } from "@/server/patients";
import { Trash2, AlertTriangle } from "lucide-react";

interface Props {
  currentRow: Patient;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPatientDeleted?: () => void;
}

export function PatientsDeleteDialog({
  currentRow,
  open,
  onOpenChange,
  onPatientDeleted,
}: Props) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deletePatient(currentRow.id);
      
      if (result.success) {
        toast.success("Patient deleted successfully");
        onOpenChange(false);
        onPatientDeleted?.();
      } else {
        toast.error(result.error || "Failed to delete patient");
        console.error("Delete error:", result.details || result.error);
      }
    } catch (error) {
      console.error("Error deleting patient:", error);
      toast.error("Failed to delete patient");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle>Delete Patient</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this patient?
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="space-y-2">
              <p className="font-medium">
                {currentRow.firstName} {currentRow.lastName}
              </p>
              <p className="text-sm text-muted-foreground">
                {currentRow.email}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            This action cannot be undone. The patient and all associated data will be permanently removed from the system.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Patient
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

