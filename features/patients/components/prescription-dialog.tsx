"use client";
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";                                                                                                                                                                                                                                
import { Textarea } from "@/components/ui/textarea";
import {
  Form,                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { SelectDropdown } from "@/components/select-dropdown";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createPrescription, updatePrescription } from "@/server/prescriptions";
import { getPatientById } from "@/server/patients";
import { useSession } from "@/lib/auth-client";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

const formSchema = z.object({
  medication: z.string().min(1, "Medication is required"),
  dosage: z.string().min(1, "Dosage is required"),
  frequency: z.string().min(1, "Frequency is required"),
  duration: z.string().min(1, "Duration is required"),
  instructions: z.string().min(1, "Instructions are required"),
});

type PrescriptionForm = z.infer<typeof formSchema>;

interface PrescriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  editingPrescription?: any; // For editing existing prescription
  onEditSuccess?: () => void; // Callback when edit is successful
  onPrescriptionAdded?: () => void; // Callback when new prescription is added
}

export function PrescriptionDialog({
  isOpen,
  onClose,
  patientId,
  editingPrescription,
  onEditSuccess,
  onPrescriptionAdded,
}: PrescriptionDialogProps) {
  const { data: session } = useSession();
  const staffId = session?.user?.id || "";
  const [prescriptions, setPrescriptions] = React.useState<PrescriptionForm[]>([]);
  const [patientInfo, setPatientInfo] = React.useState<any>(null);
  // Use string | number for expandedIndex: 0..N-1 for existing, 'new' for new card
  const [expandedIndex, setExpandedIndex] = React.useState<number | 'new' | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  // Form for the new prescription (always at the bottom)
  const newForm = useForm<PrescriptionForm>({
    resolver: zodResolver(formSchema),
    defaultValues: { medication: '', dosage: '', frequency: '', duration: '', instructions: '' },
  });

  // Load patient info
  const loadPatientInfo = async () => {
    try {
      setLoading(true);
      const result = await getPatientById(patientId);
      if (result.success && result.data) {
        setPatientInfo(result.data);
        console.log('Patient info loaded:', result.data);
      } else {
        console.error('Failed to load patient info:', result.message);
        toast.error('Failed to load patient information');
      }
    } catch (error) {
      console.error('Error loading patient info:', error);
      toast.error('Failed to load patient information');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      loadPatientInfo();
      
      if (editingPrescription) {
        // Load existing prescription data for editing
        setPrescriptions(editingPrescription.details || []);
        setExpandedIndex(0); // Expand first prescription for editing
      } else {
        setPrescriptions([]);
        setExpandedIndex('new'); // Expand the new prescription card by default
        newForm.reset();
      }
    }
    // eslint-disable-next-line
  }, [isOpen, editingPrescription]);

  // Add new prescription
  const handleAdd = () => {
    newForm.handleSubmit((values) => {
      setPrescriptions((prev) => [...prev, values]);
      newForm.reset();
      setExpandedIndex(prescriptions.length); // Expand the newly added card
    })();
  };

  // Edit existing prescription (controlled input)
  const handleChange = (idx: number, field: keyof PrescriptionForm, value: string) => {
    setPrescriptions((prev) => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  // Delete prescription
  const handleDelete = (idx: number) => {
    setPrescriptions((prev) => prev.filter((_, i) => i !== idx));
    setExpandedIndex(null);
  };

  // Save all (include last new card if valid)
  const handleSubmitAll = async () => {
    setSubmitting(true);
    let allPrescriptions = [...prescriptions];
    await newForm.handleSubmit((values) => {
      // Only add if at least one field is filled (avoid empty card)
      if (Object.values(values).some((v) => v && v.trim() !== '')) {
        allPrescriptions.push(values);
      }
    })();
    if (allPrescriptions.length === 0) {
      toast.error("Please add at least one prescription.");
      setSubmitting(false);
      return;
    }
    try {
      if (editingPrescription) {
        // Update existing prescription
        await updatePrescription(editingPrescription.id, {
          patientId,
          prescribedById: staffId,
          details: allPrescriptions,
        });
        toast.success("Prescription updated successfully");
        onEditSuccess?.();
      } else {
        // Create new prescription
        await createPrescription({
          patientId,
          prescribedById: staffId,
          details: allPrescriptions,
        });
        toast.success("Prescriptions added successfully");
        onPrescriptionAdded?.();
      }
      onClose();
    } catch (error) {
      toast.error(editingPrescription ? "Failed to update prescription" : "Failed to save prescriptions");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{editingPrescription ? 'Edit Prescription' : 'Add Prescriptions'}</DialogTitle>
          <DialogDescription>
            {editingPrescription 
              ? `Editing prescription ${editingPrescription.id} for ${patientInfo?.firstName} ${patientInfo?.lastName}`
              : `Add multiple prescriptions for ${patientInfo?.firstName} ${patientInfo?.lastName}. Expand/collapse cards to edit. The last card is for new entries.`
            }
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          {prescriptions.map((presc, idx) => (
            <Collapsible key={idx} open={expandedIndex === idx} onOpenChange={(open) => {
              setExpandedIndex(open ? idx : null);
            }}>
              <div className="border rounded-md bg-muted/40 shadow">
                <div className="flex items-center justify-between px-4 py-2 cursor-pointer" onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}>
                  <div className="flex items-center gap-2">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="icon" type="button" tabIndex={-1} onClick={e => { e.stopPropagation(); setExpandedIndex(expandedIndex === idx ? null : idx); }}>
                        {expandedIndex === idx ? <ChevronUp className="w-4 h-4 transition-transform" style={{transform: 'rotate(180deg)'}} /> : <ChevronDown className="w-4 h-4 transition-transform" />}
                      </Button>
                    </CollapsibleTrigger>
                    <span className="font-semibold text-primary">Prescription {idx + 1}</span>
                  </div>
                  <Button variant="destructive" size="icon" type="button" onClick={e => { e.stopPropagation(); handleDelete(idx); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <CollapsibleContent>
                  <form className="space-y-3 px-4 pb-4">
                    <div>
                      <label className="block font-medium">
                        Medication <span className="text-destructive">*</span>
                      </label>
                      <Input
                        value={presc.medication}
                        onChange={e => handleChange(idx, 'medication', e.target.value)}
                        placeholder="e.g., Lisinopril"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-medium">
                        Dosage <span className="text-destructive">*</span>
                      </label>
                      <Input
                        value={presc.dosage}
                        onChange={e => handleChange(idx, 'dosage', e.target.value)}
                        placeholder="e.g., 10mg"
                        required
                      />
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block font-medium">
                          Frequency <span className="text-destructive">*</span>
                        </label>
                        <Input
                          value={presc.frequency}
                          onChange={e => handleChange(idx, 'frequency', e.target.value)}
                          placeholder="e.g., Once daily"
                          required
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block font-medium">
                          Duration <span className="text-destructive">*</span>
                        </label>
                        <Input
                          value={presc.duration}
                          onChange={e => handleChange(idx, 'duration', e.target.value)}
                          placeholder="e.g., 7 days"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-medium">
                        Instructions <span className="text-destructive">*</span>
                      </label>
                      <Textarea
                        value={presc.instructions}
                        onChange={e => handleChange(idx, 'instructions', e.target.value)}
                        placeholder="Additional instructions"
                        required
                      />
                    </div>
                  </form>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
          {/* New prescription card */}
          <Collapsible open={expandedIndex === 'new'} onOpenChange={open => setExpandedIndex(open ? 'new' : null)}>
            <div className="border rounded-md bg-muted/40 shadow">
              <div className="flex items-center justify-between px-4 py-2 cursor-pointer" onClick={() => setExpandedIndex(expandedIndex === 'new' ? null : 'new')}>
                <div className="flex items-center gap-2">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="icon" type="button" tabIndex={-1} onClick={e => { e.stopPropagation(); setExpandedIndex(expandedIndex === 'new' ? null : 'new'); }}>
                      {expandedIndex === 'new' ? <ChevronUp className="w-4 h-4 transition-transform" style={{transform: 'rotate(180deg)'}} /> : <ChevronDown className="w-4 h-4 transition-transform" />}
                    </Button>
                  </CollapsibleTrigger>
                  <span className="font-semibold text-primary">New Prescription</span>
                </div>
              </div>
              <CollapsibleContent>
                <Form {...newForm}>
                  <form className="space-y-3 px-4 pb-4">
                    <FormField
                      control={newForm.control}
                      name="medication"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Medication <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Lisinopril" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={newForm.control}
                      name="dosage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Dosage <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 10mg" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-4">
                      <FormField
                        control={newForm.control}
                        name="frequency"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>
                              Frequency <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Once daily" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={newForm.control}
                        name="duration"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>
                              Duration <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 7 days" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={newForm.control}
                      name="instructions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Instructions <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Textarea placeholder="Additional instructions" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
                <div className="flex gap-2 justify-end mt-2 px-4 pb-2">
                  <Button type="button" variant="secondary" size="sm" onClick={() => {
                    newForm.handleSubmit((values) => {
                      setPrescriptions((prev) => {
                        // Add the new prescription to the array
                        const newPrescriptions = [...prev, values];
                        // Collapse the newly added prescription and expand the "New Prescription" card
                        setExpandedIndex('new');
                        return newPrescriptions;
                      });
                      newForm.reset();
                    })();
                  }}>
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmitAll} disabled={submitting}>
            {editingPrescription ? 'Update Prescription' : 'Save All'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


