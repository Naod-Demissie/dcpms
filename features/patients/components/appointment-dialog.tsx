import { useEffect, useState } from "react";
import {
  Dialog,
  
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ChevronDownIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createAppointment, updateAppointment, getAllDentists } from "@/server/appointments";
import { getTreatmentsByPatient } from "@/server/treatments";
import type { Treatment } from "@/features/patients/data/treatment-schema";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { format } from "date-fns";
import { Repeat } from "lucide-react";

const appointmentFormSchema = z.object({
  date: z.date({ required_error: "Please select a date" }),
  time: z.string().min(1, "Please select a time"),
  duration: z.string().min(1, "Please select duration"),
  dentistId: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum([
    "SCHEDULED",
    "CONFIRMED",
    "CANCELLED",
    "COMPLETED",
    "NO_SHOW",
  ]),
});

type AppointmentForm = z.infer<typeof appointmentFormSchema>;

type AppointmentDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  onSuccess?: () => void;
  currentAppointment?: {
    id: string;
    startTime: Date;
    endTime: Date;
    notes?: string | null;
    status: "SCHEDULED" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";
    dentistId?: string | null;
    treatments?: { id: string; name: string; date: Date; notes: string | null }[];
  } | null;
};

export function AppointmentDialog({ isOpen, onClose, patientId, onSuccess, currentAppointment }: AppointmentDialogProps) {
  const [type, setType] = useState("CHECKUP");
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [selectedTreatmentId, setSelectedTreatmentId] = useState("");
  const [treatmentSearch, setTreatmentSearch] = useState("");
  const [dentists, setDentists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AppointmentForm>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      date: undefined,
      time: "10:30",
      duration: "30",
      dentistId: "none",
      notes: "",
      status: "SCHEDULED",
    },
  });

  useEffect(() => {
    if (isOpen && type === "TREATMENT") {
      getTreatmentsByPatient(patientId).then((result) => {
        if (result.success && result.data) {
          setTreatments(
            result.data.map((t: any) => ({
              id: t.id,
              patientId: t.patientId,
              name: t.treatmentType || (t.template && t.template.name) || t.name || "",
              description: t.description,
              date: t.date ? new Date(t.date) : new Date(),
              notes: t.notes,
              createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
              updatedAt: t.updatedAt ? new Date(t.updatedAt) : new Date(),
              appointment: t.appointment,
            }))
          );
        } else {
          setTreatments([]);
        }
      });
    }
    if (!isOpen) {
      setType("CHECKUP");
      setSelectedTreatmentId("");
    }
  }, [isOpen, type, patientId]);

  // Prefill form fields if treatment with appointment is selected
  useEffect(() => {
    if (type === "TREATMENT" && selectedTreatmentId && treatments.length > 0) {
      const treatment = treatments.find((t) => t.id === selectedTreatmentId);
      if (treatment && (treatment as any).appointment) {
        const appt = (treatment as any).appointment;
        if (appt) {
          // Prefill form fields
          const start = new Date(appt.startTime);
          const end = new Date(appt.endTime);
          const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
          form.setValue("date", start);
          form.setValue("time", `${start.getHours().toString().padStart(2, "0")}:${start.getMinutes().toString().padStart(2, "0")}`);
          form.setValue("duration", duration.toString());
          form.setValue("dentistId", appt.dentistId || "none");
          form.setValue("status", appt.status || "SCHEDULED");
          form.setValue("notes", appt.notes || "");
        }
      }
    }
  }, [type, selectedTreatmentId, treatments]);

  useEffect(() => {
    if (isOpen) {
      getAllDentists().then((result) => {
        if (result.success && result.data) {
          setDentists(result.data);
        } else {
          setDentists([]);
        }
      });
    }
  }, [isOpen]);

  // Populate form when editing an existing appointment
  useEffect(() => {
    if (isOpen && currentAppointment) {
      // Determine type and selected treatment
      let newType = "CHECKUP";
      let newSelectedTreatmentId = "";
      if (currentAppointment.treatments && currentAppointment.treatments.length > 0) {
        newType = "TREATMENT";
        newSelectedTreatmentId = currentAppointment.treatments[0].id;
      }
      setType(newType);
      setSelectedTreatmentId(newSelectedTreatmentId);

      const startTime = new Date(currentAppointment.startTime);
      const endTime = new Date(currentAppointment.endTime);
      const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
      form.setValue("date", startTime);
      form.setValue("time", `${startTime.getHours().toString().padStart(2, "0")}:${startTime.getMinutes().toString().padStart(2, "0")}`);
      form.setValue("duration", duration.toString());
      form.setValue("dentistId", currentAppointment.dentistId || "none");
      form.setValue("status", currentAppointment.status);
      form.setValue("notes", currentAppointment.notes || "");
    } else if (isOpen && !currentAppointment) {
      // Reset form for new appointment
      setType("CHECKUP");
      setSelectedTreatmentId("");
      form.reset({
        date: undefined,
        time: "10:30",
        duration: "30",
        dentistId: "none",
        notes: "",
        status: "SCHEDULED",
      });
    }
  }, [isOpen, currentAppointment, form]);

  const onSubmit = async (values: AppointmentForm) => {
    if (!values.date) {
      toast.error("Please select a date");
      return;
    }

    setIsLoading(true);
    try {
      const [hours, minutes] = values.time.split(":").map(Number);
      const startTime = new Date(values.date);
      startTime.setHours(hours, minutes, 0, 0);
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + parseInt(values.duration));

      const appointmentData = {
        patientId,
        dentistId: values.dentistId === "none" ? null : values.dentistId,
        startTime,
        endTime,
        notes: values.notes || null,
        status: values.status,
      };

      let result;
      if (currentAppointment) {
        // Update existing appointment
        result = await updateAppointment(currentAppointment.id, appointmentData);
        if (result.success) {
          toast.success("Appointment updated successfully.");
        } else {
          toast.error(result.error || "Failed to update appointment.");
          setIsLoading(false);
          return;
        }
      } else {
        // Create new appointment
        result = await createAppointment(appointmentData);
        if (result.success) {
          toast.success("Appointment scheduled successfully.");
        } else {
          toast.error(result.error || "Failed to schedule appointment.");
          setIsLoading(false);
          return;
        }
      }

      if (onSuccess) onSuccess();
      onClose();
      form.reset();
    } catch (error) {
      console.error("Error scheduling appointment:", error);
      toast.error("Failed to schedule appointment.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{currentAppointment ? "Edit Appointment" : "Schedule New Appointment"}</DialogTitle>
          <DialogDescription>
            {currentAppointment ? "Update appointment information." : "Schedule a new appointment for the patient."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Type Dropdown at the top */}
            <div className="mb-2">
              <Label className="mb-1 block">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CHECKUP">Checkup</SelectItem>
                  <SelectItem value="TREATMENT">Treatment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Treatment Dropdown if type is Treatment, invoice style */}
            {type === "TREATMENT" && (
              <div className="mb-2 w-full">
                <Select
                  value={selectedTreatmentId}
                  onValueChange={val => {
                    setSelectedTreatmentId(val);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Search and select treatment..." />
                  </SelectTrigger>
                  <SelectContent className="w-full">
                    {treatments.length === 0 && (
                      <SelectItem disabled value="none" className="w-full text-gray-500">
                        No treatments found for this patient
                      </SelectItem>
                    )}
                    {treatments
                      .filter(t =>
                        t.name.toLowerCase().includes(treatmentSearch.toLowerCase()) ||
                        (t.date && format(new Date(t.date), "yyyy-MM-dd").includes(treatmentSearch))
                      )
                      .map(t => (
                        <SelectItem key={t.id} value={t.id} className="w-full">
                          {t.name} ({t.date ? format(new Date(t.date), "yyyy-MM-dd") : "No date"})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {/* Date, Time, Duration, Dentist (treatment dialog style, working): */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="appointment-date" className="block mb-1">
                  Date<span className="text-red-500">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      id="appointment-date"
                      className="w-full h-10 justify-between font-normal"
                    >
                      {form.watch("date")
                        ? new Date(form.watch("date")).toLocaleDateString()
                        : "Select date"}
                      <ChevronDownIcon />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.watch("date") ? new Date(form.watch("date")) : undefined}
                      captionLayout="dropdown"
                      onSelect={date => form.setValue("date", date)}
                      disabled={date => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="appointment-time" className="block mb-1">
                  Time<span className="text-red-500">*</span>
                </Label>
                <Input
                  type="time"
                  id="appointment-time"
                  step="1"
                  value={form.watch("time")}
                  onChange={e => form.setValue("time", e.target.value)}
                  className="h-10 w-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="appointment-duration" className="block mb-1">
                  Duration (min)<span className="text-red-500">*</span>
                </Label>
                <Input
                  id="appointment-duration"
                  type="number"
                  value={form.watch("duration")}
                  onChange={e => form.setValue("duration", e.target.value)}
                  placeholder="e.g., 30"
                  min="0"
                  required
                  className="h-10"
                />
              </div>
              <div>
                <Label htmlFor="appointment-dentist" className="block mb-1">
                  Dentist
                </Label>
                <Select
                  value={form.watch("dentistId")}
                  onValueChange={val => form.setValue("dentistId", val)}
                >
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder="Select dentist" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific dentist</SelectItem>
                    {dentists.map((dentist) => (
                      <SelectItem key={dentist.id} value={dentist.id}>
                        Dr. {dentist.firstName} {dentist.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter appointment notes"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {currentAppointment ? "Update Appointment" : "Schedule Appointment"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
