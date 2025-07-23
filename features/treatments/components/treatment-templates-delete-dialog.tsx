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
import { TreatmentTemplate } from "../data/treatment-template-schema";
import { deleteTreatmentTemplate } from "@/server/treatment-templates";
import { Trash2, AlertTriangle } from "lucide-react";
import { useTreatmentTemplates } from "../context/treatment-templates-context";

interface Props {
  currentRow: TreatmentTemplate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TreatmentTemplatesDeleteDialog({
  currentRow,
  open,
  onOpenChange,
}: Props) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { refreshTreatmentTemplates } = useTreatmentTemplates();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteTreatmentTemplate(currentRow.id);
      
      if (result.success) {
        toast.success("Treatment Template deleted successfully");
        onOpenChange(false);
        refreshTreatmentTemplates();
      } else {
        toast.error(result.error || "Failed to delete treatment template");
        console.error("Delete error:", result.details || result.error);
      }
    } catch (error) {
      console.error("Error deleting treatment template:", error);
      toast.error("Failed to delete treatment template");
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
              <DialogTitle>Delete Treatment Template</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this treatment template?
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="space-y-2">
              <p className="font-medium">
                {currentRow.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {currentRow.description}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            This action cannot be undone. The treatment template and all associated data will be permanently removed from the system.
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
                Delete Treatment Template
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


