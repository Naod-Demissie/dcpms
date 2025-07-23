"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, FileText, Receipt } from "lucide-react";
import { toast } from "sonner";
import { notificationService } from "@/lib/notification-service";

interface TreatmentCompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientName?: string;
  patientId?: string;
}

export function TreatmentCompletionDialog({
  open,
  onOpenChange,
  patientName = "John Doe",
  patientId = "1",
}: TreatmentCompletionDialogProps) {
  const [treatmentType, setTreatmentType] = useState("");
  const [notes, setNotes] = useState("");
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = async () => {
    if (!treatmentType) {
      toast.error("Please select a treatment type");
      return;
    }

    setIsCompleting(true);

    try {
      // Simulate treatment completion
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Show success message
      toast.success("Treatment completed successfully!", {
        description: `${treatmentType} for ${patientName}`,
        icon: <CheckCircle className="h-4 w-4" />,
      });

      // Trigger notifications for invoice and prescription generation
      notificationService.notifyTreatmentCompleted(
        patientName,
        patientId,
        treatmentType
      );

      // Reset form and close dialog
      setTreatmentType("");
      setNotes("");
      onOpenChange(false);
    } catch {
      toast.error("Failed to complete treatment");
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Complete Treatment</DialogTitle>
          <DialogDescription>
            Mark the treatment as completed for {patientName}. This will
            automatically generate invoice and prescription notifications.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="treatment-type">Treatment Type</Label>
            <Select value={treatmentType} onValueChange={setTreatmentType}>
              <SelectTrigger>
                <SelectValue placeholder="Select treatment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dental-cleaning">Dental Cleaning</SelectItem>
                <SelectItem value="cavity-filling">Cavity Filling</SelectItem>
                <SelectItem value="root-canal">Root Canal</SelectItem>
                <SelectItem value="crown-placement">Crown Placement</SelectItem>
                <SelectItem value="tooth-extraction">
                  Tooth Extraction
                </SelectItem>
                <SelectItem value="teeth-whitening">Teeth Whitening</SelectItem>
                <SelectItem value="orthodontic-adjustment">
                  Orthodontic Adjustment
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Treatment Notes</Label>
            <Textarea
              id="notes"
              placeholder="Enter any additional notes about the treatment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleComplete}
            disabled={isCompleting || !treatmentType}
            className="bg-green-600 hover:bg-green-700"
          >
            {isCompleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Completing...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Complete Treatment
              </>
            )}
          </Button>
        </DialogFooter>

        {/* Information about what happens after completion */}
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">
            After completion:
          </p>
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <div className="flex items-center">
              <Receipt className="mr-1 h-3 w-3" />
              Invoice generated
            </div>
            <div className="flex items-center">
              <FileText className="mr-1 h-3 w-3" />
              Prescription created
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
