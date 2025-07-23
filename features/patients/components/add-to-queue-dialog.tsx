"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { getPatients } from "@/server/patients";
import { getStaff } from "@/server/staff";
import { addToQueue } from "@/server/queue";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const addToQueueSchema = z.object({
  patientId: z.string().min(1, "Please select a patient"),
  assignedStaff: z.string().optional(),
});

type AddToQueueForm = z.infer<typeof addToQueueSchema>;

type AddToQueueDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd?: (data: AddToQueueForm) => void;
  onSuccess?: () => void; // Callback to refresh queue data
};

export function AddToQueueDialog({
  open,
  onOpenChange,
  onAdd,
  onSuccess,
}: AddToQueueDialogProps) {
  const [patients, setPatients] = useState<
    { id: string; firstName: string; lastName: string }[]
  >([]);
  const [dentists, setDentists] = useState<
    { id: string; firstName: string; lastName: string; role: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [patientOpen, setPatientOpen] = useState(false);
  const [dentistOpen, setDentistOpen] = useState(false);

  const form = useForm<AddToQueueForm>({
    resolver: zodResolver(addToQueueSchema),
    defaultValues: {
      patientId: "",
      assignedStaff: "",
    },
  });

  useEffect(() => {
    if (open) {
      setLoading(true);
      Promise.all([getPatients(), getStaff()]).then(
        ([patientsResult, staffResult]) => {
          if (patientsResult.success && patientsResult.data) {
            setPatients(
              patientsResult.data.map((p: any) => ({
                id: p.id,
                firstName: p.firstName,
                lastName: p.lastName,
              }))
            );
          } else {
            setPatients([]);
          }

          if (staffResult.success && staffResult.data) {
            // Filter to show only dentists (assuming role contains "dentist" or similar)
            const dentistsList = staffResult.data
              .filter(
                (s: any) =>
                  s.role &&
                  (s.role.toLowerCase().includes("dentist") ||
                    s.role.toLowerCase().includes("doctor") ||
                    s.role.toLowerCase().includes("dr"))
              )
              .map((s: any) => ({
                id: s.id,
                firstName: s.firstName,
                lastName: s.lastName,
                role: s.role,
              }));
            setDentists(dentistsList);
          } else {
            setDentists([]);
          }
          setLoading(false);
        }
      );
    }
  }, [open]);

  const onSubmit = async (values: AddToQueueForm) => {
    try {
      const queueData = {
        patientId: values.patientId,
        assignedStaff: values.assignedStaff || null,
        status: "WAITING" as const,
        checkInTime: new Date(),
      };

      const result = await addToQueue(queueData);

      if (result.success) {
        toast.success("Patient added to queue successfully.");
        form.reset();
        onOpenChange(false);
        if (onAdd) {
          onAdd(values);
        }
        // Call the success callback to refresh queue data instead of reloading page
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error(result.error || "Failed to add patient to queue");
      }
    } catch (error) {
      toast.error("An error occurred while adding patient to queue");
    }
  };

  const selectedPatient = patients.find(
    (p) => p.id === form.watch("patientId")
  );
  const selectedDentist = dentists.find(
    (d) => d.id === form.watch("assignedStaff")
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Patient to Queue</DialogTitle>
          <DialogDescription>
            Search and select a patient to add to the queue, and optionally
            assign a dentist.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Patient Selection */}
          <div>
            <Label>Select Patient</Label>
            <Popover open={patientOpen} onOpenChange={setPatientOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={patientOpen}
                  className="w-full justify-between mt-2"
                  disabled={loading}
                >
                  {selectedPatient
                    ? `${selectedPatient.firstName} ${selectedPatient.lastName}`
                    : loading
                      ? "Loading patients..."
                      : "Select patient..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search patients..." />
                  <CommandList>
                    <CommandEmpty>No patients found.</CommandEmpty>
                    <CommandGroup>
                      {patients.map((patient) => (
                        <CommandItem
                          key={patient.id}
                          value={`${patient.firstName} ${patient.lastName}`}
                          onSelect={() => {
                            form.setValue("patientId", patient.id);
                            setPatientOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              form.watch("patientId") === patient.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {patient.firstName} {patient.lastName}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {form.formState.errors.patientId && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.patientId.message}
              </p>
            )}
          </div>

          {/* Dentist Selection */}
          <div>
            <Label>Assign Dentist (Optional)</Label>
            <Popover open={dentistOpen} onOpenChange={setDentistOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={dentistOpen}
                  className="w-full justify-between mt-2"
                  disabled={loading}
                >
                  {selectedDentist
                    ? `Dr. ${selectedDentist.firstName} ${selectedDentist.lastName}`
                    : loading
                      ? "Loading dentists..."
                      : "Select dentist (optional)..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search dentists..." />
                  <CommandList>
                    <CommandEmpty>No dentists found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="no-dentist"
                        onSelect={() => {
                          form.setValue("assignedStaff", "");
                          setDentistOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            !form.watch("assignedStaff")
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        No dentist assigned
                      </CommandItem>
                      {dentists.map((dentist) => (
                        <CommandItem
                          key={dentist.id}
                          value={`Dr. ${dentist.firstName} ${dentist.lastName}`}
                          onSelect={() => {
                            form.setValue("assignedStaff", dentist.id);
                            setDentistOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              form.watch("assignedStaff") === dentist.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          Dr. {dentist.firstName} {dentist.lastName}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !patients.length}>
              Add to Queue
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
