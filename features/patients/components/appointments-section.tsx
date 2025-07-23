"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Calendar as CalendarIcon,
  Clock,
  Edit,
  Trash2,
  MoreHorizontal,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { format } from "date-fns";
import {
  getAppointmentsByPatient,
  deleteAppointment,
  updateAppointmentStatus,
} from "@/server/appointments";
import { getTreatmentsByPatient } from "@/server/treatments";
import type { Treatment } from "@/features/patients/data/treatment-schema";
import { AppointmentDialog } from "./appointment-dialog";



interface Appointment {
  id: string;
  patientId: string;
  dentistId?: string | null;
  startTime: Date;
  endTime: Date;
  notes?: string | null;
  status: "SCHEDULED" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";
  createdAt: Date;
  updatedAt: Date;
  dentist?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  treatments?: Array<{
    id: string;
    treatmentType: string;
    template?: {
      name: string;
    } | null;
  }>;
}



interface AppointmentsSectionProps {
  patientId: string;
}

export function AppointmentsSection({ patientId }: AppointmentsSectionProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentAppointment, setCurrentAppointment] =
    useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);


  const fetchAppointments = async () => {
    const result = await getAppointmentsByPatient(patientId);
    if (result.success && result.data) {
      setAppointments(result.data);
    } else {
      toast.error(result.error || "Failed to fetch appointments");
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [patientId]);





  const handleDeleteAppointment = async (appointmentId: string) => {
    try {
      const result = await deleteAppointment(appointmentId);
      if (result.success) {
        toast.success("Appointment deleted successfully.");
        fetchAppointments();
      } else {
        toast.error(result.error || "Failed to delete appointment.");
      }
    } catch (error) {
      console.error("Error deleting appointment:", error);
      toast.error("Failed to delete appointment.");
    }
  };

  const handleStatusChange = async (
    appointmentId: string,
    status: Appointment["status"]
  ) => {
    try {
      const result = await updateAppointmentStatus(appointmentId, status);
      if (result.success) {
        toast.success("Appointment status updated successfully.");
        fetchAppointments();
      } else {
        toast.error(result.error || "Failed to update appointment status.");
      }
    } catch (error) {
      console.error("Error updating appointment status:", error);
      toast.error("Failed to update appointment status.");
    }
  };

  const openEditDialog = (appointment: Appointment) => {
    setCurrentAppointment(appointment);
    setIsEditDialogOpen(true);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "default";
      case "SCHEDULED":
        return "secondary";
      case "COMPLETED":
        return "outline";
      case "CANCELLED":
        return "destructive";
      case "NO_SHOW":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getAppointmentName = (appointment: Appointment) => {
    // If appointment has treatments, it's a treatment appointment
    if (appointment.treatments && appointment.treatments.length > 0) {
      // Get the first treatment name
      const treatment = appointment.treatments[0];
      return treatment.treatmentType || treatment.template?.name || "Treatment";
    }
    // If no treatments, it's a checkup
    return "Check Up";
  };



  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <CalendarIcon className="mr-2 h-5 w-5" />
              Appointments
            </CardTitle>
            <CardDescription>
              Schedule and manage patient appointments
            </CardDescription>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Schedule Appointment
          </Button>
        </div>
      </CardHeader>
      
      {/* Add Appointment Dialog */}
      <AppointmentDialog
        isOpen={isAddDialogOpen}
        onClose={() => {
          setIsAddDialogOpen(false);
          fetchAppointments();
        }}
        patientId={patientId}
      />
      
      {/* Edit Appointment Dialog */}
      <AppointmentDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          fetchAppointments();
        }}
        patientId={patientId}
        currentAppointment={currentAppointment ? {
          ...currentAppointment,
          treatments: currentAppointment.treatments?.map(t => ({
            id: t.id,
            name: t.treatmentType || t.template?.name || "Treatment",
            date: currentAppointment.startTime,
            notes: currentAppointment.notes || null,
          }))
        } : undefined}
      />
      
      <CardContent>
        {deleteId && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 dark:bg-black/70">
            <div className="bg-card dark:bg-card/80 hover:dark:bg-muted/60 rounded-lg shadow-lg p-6 w-full max-w-sm border border-border transition-colors">
              <h3 className="font-semibold text-lg mb-2">Delete Appointment?</h3>
              <p className="mb-4 text-muted-foreground">
                Are you sure you want to delete this appointment? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDeleteId(null)} disabled={isDeleting}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    setIsDeleting(true);
                    await handleDeleteAppointment(deleteId!);
                    setIsDeleting(false);
                    setDeleteId(null);
                  }}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <span className="inline-block w-4 h-4 mr-2 align-middle animate-spin border-2 border-current border-t-transparent rounded-full"></span>
                  ) : null}
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
        {appointments.length === 0 ? (
          <div className="text-center py-8">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No appointments
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by scheduling an appointment.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Dentist</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <CalendarIcon className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="font-medium">
                          {formatDate(appointment.startTime)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatTime(appointment.startTime)} -{" "}
                          {formatTime(appointment.endTime)}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {Math.round(
                      (new Date(appointment.endTime).getTime() -
                        new Date(appointment.startTime).getTime()) /
                        (1000 * 60)
                    )}{" "}
                    min
                  </TableCell>
                  <TableCell>
                    {appointment.dentist ? (
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>
                          Dr. {appointment.dentist.firstName}{" "}
                          {appointment.dentist.lastName}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-500">Not assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(appointment.status)}>
                      {appointment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{getAppointmentName(appointment)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => openEditDialog(appointment)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleStatusChange(appointment.id, "CONFIRMED")
                          }
                          disabled={appointment.status === "CONFIRMED"}
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          Confirm
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleStatusChange(appointment.id, "COMPLETED")
                          }
                          disabled={appointment.status === "COMPLETED"}
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          Complete
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleStatusChange(appointment.id, "CANCELLED")
                          }
                          disabled={appointment.status === "CANCELLED"}
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          Cancel
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteId(appointment.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}


      </CardContent>
    </Card>
  );
}
