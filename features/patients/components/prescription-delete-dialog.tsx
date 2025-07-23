import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deletePrescription } from "@/server/prescriptions";
import { toast } from "sonner";

interface PrescriptionDeleteDialogProps {
  prescription: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleteSuccess: () => void;
}

export function PrescriptionDeleteDialog({
  prescription,
  open,
  onOpenChange,
  onDeleteSuccess,
}: PrescriptionDeleteDialogProps) {
  const handleDelete = async () => {
    if (!prescription) return;
    
    try {
      const result = await deletePrescription(prescription.id);
      
      if (result.success) {
        toast.success("Prescription deleted successfully");
        onDeleteSuccess();
        onOpenChange(false);
      } else {
        toast.error(result.error || "Failed to delete prescription");
      }
    } catch (error) {
      console.error("Error deleting prescription:", error);
      toast.error("An unexpected error occurred");
    }
  };

  // Don't render if no prescription is provided
  if (!prescription) {
    return null;
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Prescription</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete prescription <strong>{prescription.id}</strong>? 
            This action cannot be undone and will permanently remove the prescription from the database.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 