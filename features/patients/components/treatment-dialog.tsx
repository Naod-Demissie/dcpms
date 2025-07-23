"use client";

import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar24 } from "@/components/ui/calendar24";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ChevronDownIcon } from "lucide-react";
import { createTreatment, updateTreatment } from "@/server/treatments";
import { createAppointment, getAllDentists } from "@/server/appointments";
import { getTreatmentTemplates } from "@/server/treatment-templates";

interface TreatmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  initialData?: any; // For edit mode
}

export function TreatmentDialog({ isOpen, onClose, patientId, initialData }: TreatmentDialogProps) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [dentists, setDentists] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [isAppointment, setIsAppointment] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    date: "",
    notes: "",
    price: "",
    durationMinutes: "",
    // Appointment fields
    appointmentDate: "",
    appointmentTime: "10:30",
    appointmentDuration: "30",
    dentistId: "none",
    appointmentNotes: "",
    appointmentStatus: "SCHEDULED",
  });
  const isEdit = !!initialData;
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setTemplatesLoading(true);
    setTemplatesError(null);
    getTreatmentTemplates()
      .then((result) => {
        if (result.success && result.data) {
          setTemplates(result.data);
        } else {
          setTemplates([]);
          setTemplatesError(result.error || "Failed to fetch templates");
        }
      })
      .catch(() => {
        setTemplates([]);
        setTemplatesError("Failed to fetch templates");
      })
      .finally(() => {
        setTemplatesLoading(false);
      });
    // Fetch dentists from staff (real data)
    getAllDentists().then((result) => {
      if (result.success && result.data) {
        setDentists(result.data);
      } else {
        setDentists([]);
      }
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    if (isEdit && initialData) {
      // Populate all fields from initialData, including appointment fields if present
      const appointment = initialData.appointment || {};
      setFormData({
        name: initialData.treatmentType || initialData.name || "",
        description: initialData.description || "",
        date: initialData.date ? new Date(initialData.date).toISOString().slice(0, 10) : "",
        notes: initialData.notes || "",
        price: initialData.cost !== undefined ? String(initialData.cost) : "",
        durationMinutes:
          initialData.durationMinutes !== undefined
            ? String(initialData.durationMinutes)
            : appointment.endTime && appointment.startTime
            ? String(Math.round((new Date(appointment.endTime).getTime() - new Date(appointment.startTime).getTime()) / (1000 * 60)))
            : "",
        // Appointment fields
        appointmentDate: appointment.startTime ? new Date(appointment.startTime).toISOString().slice(0, 10) : "",
        appointmentTime: appointment.startTime
          ? `${new Date(appointment.startTime).getHours().toString().padStart(2, "0")}:${new Date(appointment.startTime).getMinutes().toString().padStart(2, "0")}`
          : "10:30",
        appointmentDuration:
          appointment.endTime && appointment.startTime
            ? String(Math.round((new Date(appointment.endTime).getTime() - new Date(appointment.startTime).getTime()) / (1000 * 60)))
            : "30",
        dentistId: appointment.dentistId || "none",
        appointmentNotes: appointment.notes || "",
        appointmentStatus: appointment.status || "SCHEDULED",
      });
      setIsAppointment(
        !!appointment.startTime || !!appointment.endTime || !!appointment.dentistId || !!appointment.status
      );
      setSelectedTemplateId(initialData.templateId || "none");
    } else if (!isEdit) {
      // Reset to blank for add mode
      setFormData({
        name: "",
        description: "",
        date: "",
        notes: "",
        price: "",
        durationMinutes: "",
        appointmentDate: "",
        appointmentTime: "10:30",
        appointmentDuration: "30",
        dentistId: "none",
        appointmentNotes: "",
        appointmentStatus: "SCHEDULED",
      });
      setIsAppointment(false);
      setSelectedTemplateId("none");
    }
  }, [isOpen, isEdit, initialData]);

  // Only allow template to overwrite fields in add mode
  useEffect(() => {
    if (!selectedTemplateId || selectedTemplateId === "none" || isEdit) return;
    const template = templates.find((t) => t.id === selectedTemplateId);
    if (template) {
      setFormData((prev) => ({
        ...prev,
        name: template.name || "",
        description: template.description || "",
        price: template.estimatedCost ? String(template.estimatedCost) : "",
        durationMinutes: template.durationMinutes ? String(template.durationMinutes) : "",
      }));
    }
  }, [selectedTemplateId, templates, isEdit]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Simple validation
    if (!formData.name) {
      toast.error("Treatment name is required");
      return;
    }
    if (!formData.price) {
      toast.error("Price is required");
      return;
    }
    if (!formData.durationMinutes) {
      toast.error("Duration is required");
      return;
    }
    if (isAppointment) {
      if (!formData.appointmentDate) {
        toast.error("Appointment date is required");
        return;
      }
      if (!formData.appointmentTime) {
        toast.error("Appointment time is required");
        return;
      }
    }
    setSubmitting(true);
    try {
      let appointmentId: string | undefined = undefined;
      // If appointment is set, create appointment first
      if (isAppointment) {
        // Parse date and time into startTime and endTime
        const [hours, minutes] = formData.appointmentTime.split(":").map(Number);
        const startTime = new Date(formData.appointmentDate);
        startTime.setHours(hours, minutes, 0, 0);
        const duration = parseInt(formData.durationMinutes) || 30;
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + duration);
        const allowedStatuses = ["SCHEDULED", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"] as const;
        type StatusType = typeof allowedStatuses[number];
        const status: StatusType = allowedStatuses.includes(formData.appointmentStatus as StatusType)
          ? (formData.appointmentStatus as StatusType)
          : "SCHEDULED";
        // Set type to TREATMENT and do not include notes
        const appointmentPayload = {
          patientId,
          dentistId: !formData.dentistId || formData.dentistId === "none" ? null : formData.dentistId,
          startTime,
          endTime,
          status,
          type: "TREATMENT",
        };
        const appointmentResult = await createAppointment(appointmentPayload);
        if (!appointmentResult.success || !appointmentResult.data) {
          toast.error(appointmentResult.error || "Failed to create appointment");
          setSubmitting(false);
          return;
        }
        appointmentId = appointmentResult.data.id;
      }
      // Prepare treatment payload
      const treatmentPayload: any = {
        patientId,
        appointmentId: appointmentId || undefined,
        treatmentType: formData.name,
        templateId: selectedTemplateId !== "none" ? selectedTemplateId : undefined,
        description: formData.description || undefined,
        date: new Date(),
        cost: formData.price ? parseFloat(formData.price) : undefined,
        status: "PLANNED",
        notes: formData.notes || undefined,
      };
      let result;
      if (initialData && initialData.id) {
        // Edit mode
        result = await updateTreatment(initialData.id, treatmentPayload);
      } else {
        // Add mode
        result = await createTreatment(treatmentPayload);
      }
      if (result.success) {
        toast.success(initialData ? "Treatment updated successfully" : "Treatment added successfully");
        onClose();
      } else {
        toast.error(result.error || "Failed to save treatment");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Treatment" : "Add Treatment"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the treatment details." : "Record a new treatment for this patient."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4">
            {/* Template dropdown spans the full row */}
            <div>
              <Label htmlFor="template" className="block mb-1">
                Template
              </Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Select template (optional)" />
                </SelectTrigger>
                <SelectContent className="dark:[&_div[data-slot=select-item]:hover]:bg-muted/60">
                  <SelectItem value="none">None</SelectItem>
                  {templatesLoading && (
                    <div className="px-4 py-2 text-muted-foreground">Loading templates...</div>
                  )}
                  {templatesError && !templatesLoading && (
                    <div className="px-4 py-2 text-destructive">{templatesError}</div>
                  )}
                  {!templatesLoading && !templatesError && templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="name" className="block mb-1">
                Treatment Name<span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g., Physical Therapy"
                required
                className="h-10"
              />
            </div>
            <div>
              <Label htmlFor="description" className="block mb-1">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Brief description of the treatment"
                className="min-h-[40px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price" className="block mb-1">
                  Price<span className="text-red-500">*</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleChange("price", e.target.value)}
                  placeholder="e.g., 500"
                  min="0"
                  required
                  className="h-10"
                />
              </div>
              <div>
                <Label htmlFor="durationMinutes" className="block mb-1">
                  Duration (min)<span className="text-red-500">*</span>
                </Label>
                <Input
                  id="durationMinutes"
                  type="number"
                  value={formData.durationMinutes}
                  onChange={(e) => {
                    handleChange("durationMinutes", e.target.value);
                    if (isAppointment) handleChange("appointmentDuration", e.target.value);
                  }}
                  placeholder="e.g., 60"
                  min="0"
                  required
                  className="h-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes" className="block mb-1">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => {
                  handleChange("notes", e.target.value);
                  if (isAppointment) handleChange("appointmentNotes", e.target.value);
                }}
                placeholder="Treatment notes and observations"
                className="min-h-[40px]"
              />
            </div>
          </div>
          <div className="border-t pt-4 mt-2">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-base">Set Appointment</Label>
              <Switch checked={isAppointment} onCheckedChange={setIsAppointment} />
            </div>
            {isAppointment && (
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="appointmentDate" className="block mb-1">
                      Date<span className="text-red-500">*</span>
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          id="date-picker"
                          className="w-full h-10 justify-between font-normal"
                        >
                          {formData.appointmentDate
                            ? new Date(formData.appointmentDate).toLocaleDateString()
                            : "Select date"}
                          <ChevronDownIcon />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.appointmentDate ? new Date(formData.appointmentDate + 'T00:00:00') : undefined}
                          captionLayout="dropdown"
                          onSelect={(selectedDate) => {
                            if (selectedDate) {
                              // Format as YYYY-MM-DD in local time
                              const year = selectedDate.getFullYear();
                              const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                              const day = String(selectedDate.getDate()).padStart(2, '0');
                              handleChange("appointmentDate", `${year}-${month}-${day}`);
                            } else {
                              handleChange("appointmentDate", "");
                            }
                          }}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label htmlFor="time-picker" className="block mb-1">
                      Time<span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="time"
                      id="time-picker"
                      step="1"
                      value={formData.appointmentTime}
                      onChange={(e) => handleChange("appointmentTime", e.target.value)}
                      className="h-10 w-full"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dentistId" className="block mb-1">
                      Dentist
                    </Label>
                    <Select value={formData.dentistId} onValueChange={(v) => handleChange("dentistId", v)}>
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue placeholder="Select dentist" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No specific dentist</SelectItem>
                        {dentists.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            Dr. {d.firstName} {d.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="appointmentStatus" className="block mb-1">
                      Status
                    </Label>
                    <Select value={formData.appointmentStatus} onValueChange={(v) => handleChange("appointmentStatus", v)}>
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                        <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="NO_SHOW">No Show</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>{isEdit ? "Update Treatment" : "Add Treatment"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

