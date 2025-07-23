"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Calendar,
  Activity,
  Plus,
  Clock,
  DollarSign,
  UserCheck,
  ArrowUpRight,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { TreatmentCompletionDialog } from "@/components/treatment-completion-dialog";

import { AppointmentBarChart } from "@/components/charts/bar-chart";
import { TreatmentPieChart } from "@/components/charts/pie-chart";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { getAppointments } from "@/server/appointments";
import { AppointmentDialog } from "@/features/patients/components/appointment-dialog";
import type { Appointment } from "@/features/patients/data/appointment-schema";
import type { Patient } from "@/features/patients/data/schema";
import type { Staff } from "@/features/staff/data/schema";
import type { Treatment } from "@/features/patients/data/treatment-schema";
import { AddToQueueDialog } from "@/features/patients/components/add-to-queue-dialog";
import PatientsProvider, {
  usePatients,
} from "@/features/patients/context/patients-context";
import { PatientsDialogs } from "@/features/patients/components/patients-dialogs";
import {
  ChartAreaInteractive,
  RevenueChartData,
  RevenueChartConfig,
} from "@/components/charts/chart-area-interactive";
import { getInvoices } from "@/server/invoices";
import {
  getWeeklyPatientVisitsBarChart,
  getQueue,
  getQueueByStatus,
} from "@/server/queue";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";

// DashboardAppointment type extends Appointment with patient, dentist, and treatments fields
interface DashboardAppointment extends Appointment {
  patient?: Patient & { fullName: string };
  dentist?: Staff | null;
  treatments?: Array<{
    id: string;
    name: string;
    date: Date;
    notes: string | null;
    description?: string | null;
  }>;
}

interface QueueEntry {
  id: string;
  patientId: string;
  assignedStaff: string | null;
  status: "WAITING" | "IN_TREATMENT" | "COMPLETED" | "NO_SHOW";
  checkInTime: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string | null;
  };
  staff: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

const treatmentData = [
  { name: "Cleaning", value: 35, color: "#0088FE" },
  { name: "Filling", value: 25, color: "#00C49F" },
  { name: "Root Canal", value: 20, color: "#FFBB28" },
  { name: "Extraction", value: 15, color: "#FF8042" },
  { name: "Other", value: 5, color: "#8884D8" },
];

const APPOINTMENT_TYPE_COLORS = {
  Cleaning: "#c7d2fe", // soft blue
  Filling: "#bbf7d0", // soft green
  "Root Canal": "#fef9c3", // soft yellow
  Extraction: "#fcd5ce", // soft peach
  "Check Up": "#e0e7ff", // soft indigo
  Other: "#e9d5ff", // soft purple
};

function getAppointmentType(appointment: DashboardAppointment): string {
  if (
    Array.isArray(appointment.treatments) &&
    appointment.treatments.length > 0
  ) {
    return appointment.treatments[0]?.name || "Other";
  }
  return "Check Up";
}

function getStartOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
function getEndOfWeek(date: Date) {
  const d = getStartOfWeek(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

function HomePageContent() {
  const [treatmentDialogOpen, setTreatmentDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [appointments, setAppointments] = useState<DashboardAppointment[]>([]);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [appointmentDialogData, setAppointmentDialogData] =
    useState<DashboardAppointment | null>(null);
  const [addToQueueOpen, setAddToQueueOpen] = useState(false);
  const { setIsAddDialogOpen } = usePatients();
  const [revenueChartData, setRevenueChartData] = useState<RevenueChartData[]>(
    []
  );
  const revenueChartConfig: RevenueChartConfig = {
    paid: { label: "Paid", color: "#22c55e" }, // green
    pending: { label: "Pending", color: "#f59e42" }, // orange
    total: { label: "Total", color: "#3b82f6" }, // blue
  };
  const [weekData, setWeekData] = useState<
    Array<{ name: string; appointments: number }>
  >([]);
  const [loadingWeek, setLoadingWeek] = useState(false);
  const [weekStart, setWeekStart] = useState(getStartOfWeek(new Date()));

  // Queue state
  const [queueData, setQueueData] = useState<QueueEntry[]>([]);
  const [recentTreatments, setRecentTreatments] = useState<QueueEntry[]>([]);
  const [queuePage, setQueuePage] = useState(1);
  const [recentPage, setRecentPage] = useState(1);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const itemsPerPage = 5;

  const router = useRouter();

  // Fetch queue data function
  const fetchQueueData = async () => {
    setLoadingQueue(true);
    try {
      // Get today\"s queue (waiting and in-treatment)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const queueResult = await getQueue();
      if (queueResult.success && queueResult.data) {
        // Filter for today\"s queue and sort by creation date (oldest first)
        const todayQueue = queueResult.data
          .filter((entry: any) => {
            const createdDate = new Date(entry.createdAt);
            return (
              createdDate >= today &&
              createdDate < tomorrow &&
              (entry.status === "WAITING" || entry.status === "IN_TREATMENT")
            );
          })
          .sort(
            (a: any, b: any) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );

        setQueueData(todayQueue);
      }

      // Get recent treatments (completed today)
      const recentResult = await getQueueByStatus("COMPLETED");
      if (recentResult.success && recentResult.data) {
        const todayCompleted = recentResult.data
          .filter((entry: any) => {
            const completedDate = entry.completedAt
              ? new Date(entry.completedAt)
              : null;
            return (
              completedDate &&
              completedDate >= today &&
              completedDate < tomorrow
            );
          })
          .sort(
            (a: any, b: any) =>
              new Date(b.completedAt).getTime() -
              new Date(a.completedAt).getTime()
          );

        setRecentTreatments(todayCompleted);
      }
    } finally {
      setLoadingQueue(false);
    }
  };

  useEffect(() => {
    async function fetchRevenueData() {
      const result = await getInvoices();
      if (result.success && result.data) {
        // Aggregate by date (YYYY-MM-DD)
        const map: Record<
          string,
          { paid: number; pending: number; total: number }
        > = {};
        for (const invoice of result.data) {
          const date = new Date(invoice.createdAt).toISOString().slice(0, 10);
          if (!map[date]) map[date] = { paid: 0, pending: 0, total: 0 };
          map[date].paid += invoice.paidAmount || 0;
          map[date].pending += invoice.pendingAmount || 0;
          map[date].total += invoice.totalAmount || 0;
        }
        // Convert to sorted array
        const arr: RevenueChartData[] = Object.entries(map)
          .map(([date, vals]) => ({ date, ...vals }))
          .sort((a, b) => a.date.localeCompare(b.date));
        setRevenueChartData(arr);
      }
    }
    fetchRevenueData();
  }, []);

  useEffect(() => {
    async function fetchAppointments() {
      const result = await getAppointments();
      if (result.success && result.data) {
        // Transform appointments to match DashboardAppointment type
        const transformed = result.data.map((appt: any) => ({
          ...appt,
          patient: appt.patient
            ? {
                ...appt.patient,
                fullName: `${appt.patient.firstName} ${appt.patient.lastName}`,
                phoneNumber: appt.patient.phoneNumber ?? null,
                email: appt.patient.email ?? null,
                address: appt.patient.address ?? null,
                city: appt.patient.city ?? null,
                houseNumber: appt.patient.houseNumber ?? null,
                gender: appt.patient.gender as "Male" | "Female",
              }
            : undefined,
          treatments: Array.isArray(appt.treatments)
            ? appt.treatments.map((t: any) => ({
                id: t.id,
                name: t.name,
                date: t.date,
                notes: t.notes ?? null,
                description: t.description ?? null,
              }))
            : undefined,
        }));
        setAppointments(transformed);
      }
    }
    fetchAppointments();
  }, []);

  useEffect(() => {
    async function fetchWeekData() {
      setLoadingWeek(true);
      try {
        const weekData = await getWeeklyPatientVisitsBarChart({
          start: weekStart,
          end: getEndOfWeek(weekStart),
        });
        setWeekData(weekData);
      } finally {
        setLoadingWeek(false);
      }
    }
    fetchWeekData();
  }, [weekStart]);

  // Fetch queue data on component mount
  useEffect(() => {
    fetchQueueData();
  }, []);

  // Map appointments to FullCalendar events
  const calendarEvents = appointments.map((appt) => {
    const type = getAppointmentType(appt);
    const color =
      APPOINTMENT_TYPE_COLORS[type as keyof typeof APPOINTMENT_TYPE_COLORS] ||
      APPOINTMENT_TYPE_COLORS["Other"];
    return {
      id: appt.id,
      title: `${appt.patient && appt.patient.firstName ? appt.patient.firstName : ""} ${appt.patient && appt.patient.lastName ? appt.patient.lastName : ""} - ${type}`,
      start: appt.startTime,
      end: appt.endTime,
      backgroundColor: color,
      borderColor: color,
      extendedProps: {
        patient: `${appt.patient && appt.patient.firstName ? appt.patient.firstName : ""} ${appt.patient && appt.patient.lastName ? appt.patient.lastName : ""}`,
        treatment: type,
        phone:
          appt.patient && appt.patient.phoneNumber
            ? appt.patient.phoneNumber
            : "",
        email: appt.patient && appt.patient.email ? appt.patient.email : "",
        notes: appt.notes || "",
        patientId: appt.patientId,
        appointment: appt,
      },
    };
  });

  const handleEventClick = (clickInfo: any) => {
    setSelectedEvent(clickInfo.event);
  };

  const handleStartTreatment = () => {
    if (selectedEvent?.extendedProps?.patientId) {
      window.location.href = `/patients/${selectedEvent.extendedProps.patientId}`;
    }
  };

  const handleReschedule = () => {
    if (selectedEvent?.extendedProps?.appointment) {
      setAppointmentDialogData(selectedEvent.extendedProps.appointment);
      setAppointmentDialogOpen(true);
    }
  };

  const handleAddToQueue = (data: any) => {
    console.log("Add to Queue submitted:", data);
  };

  const handleStartQueueTreatment = (patientId: string) => {
    // Navigate to patient page with queue context
    router.push(`/patients/${patientId}?from=queue`);
  };

  const handleQueueSuccess = () => {
    // Refresh queue data without reloading the page
    fetchQueueData();
    // Switch to queue tab if not already there
    if (activeTab !== "queue") {
      setActiveTab("queue");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "WAITING":
        return "bg-yellow-100 text-yellow-800";
      case "IN_TREATMENT":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "NO_SHOW":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "WAITING":
        return "Waiting";
      case "IN_TREATMENT":
        return "In Treatment";
      case "COMPLETED":
        return "Completed";
      case "NO_SHOW":
        return "No Show";
      default:
        return status;
    }
  };

  // Pagination logic
  const paginatedQueue = queueData.slice(
    (queuePage - 1) * itemsPerPage,
    queuePage * itemsPerPage
  );
  const paginatedRecent = recentTreatments.slice(
    (recentPage - 1) * itemsPerPage,
    recentPage * itemsPerPage
  );

  const queueTotalPages = Math.ceil(queueData.length / itemsPerPage);
  const recentTotalPages = Math.ceil(recentTreatments.length / itemsPerPage);

  return (
    <div className="h-[calc(100vh-8rem)] overflow-hidden">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="h-full flex flex-col"
      >
        {/* Header - Responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Welcome back! Here&apos;s what&apos;s happening at your clinic
              today.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              size="sm"
              onClick={() => setAddToQueueOpen(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="mr-1 h-3 w-3" />
              Add to Queue
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAddDialogOpen(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="mr-1 h-3 w-3" />
              Add Patient
            </Button>
          </div>
        </div>

        {/* Tabs - Responsive */}
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 mb-4 text-xs sm:text-sm">
          <TabsTrigger value="overview" className="px-2 sm:px-4">
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="appointments"
            className="px-2 sm:px-4 hidden sm:block"
          >
            Appointments
          </TabsTrigger>
          <TabsTrigger value="queue" className="px-2 sm:px-4">
            Queue
          </TabsTrigger>
        </TabsList>

        {/* Tab Contents */}
        <div className="flex-1 overflow-hidden">
          <TabsContent
            value="overview"
            className="h-full overflow-auto space-y-4"
          >
            {/* Quick Stats - Responsive Grid */}
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
              <Card className="p-2 sm:p-3">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Today&apos;s Appointments
                      </p>
                      <div className="flex items-center space-x-1">
                        <p className="text-lg sm:text-xl font-bold">12</p>
                        <div className="flex items-center text-xs text-green-600">
                          <ArrowUpRight className="h-3 w-3" />
                          <span>+2</span>
                        </div>
                      </div>
                    </div>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card className="p-2 sm:p-3">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Patients in Queue
                      </p>
                      <div className="flex items-center space-x-1">
                        <p className="text-lg sm:text-xl font-bold">
                          {queueData.length}
                        </p>
                        <Badge
                          variant="secondary"
                          className="text-xs px-1 py-0 hidden sm:inline-flex"
                        >
                          {
                            queueData.filter((q) => q.status === "WAITING")
                              .length
                          }{" "}
                          waiting
                        </Badge>
                      </div>
                    </div>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card className="p-2 sm:p-3">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Monthly Revenue
                      </p>
                      <div className="flex items-center space-x-1">
                        <p className="text-lg sm:text-xl font-bold">$12,450</p>
                        <div className="flex items-center text-xs text-green-600">
                          <ArrowUpRight className="h-3 w-3" />
                          <span>+15%</span>
                        </div>
                      </div>
                    </div>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card className="p-2 sm:p-3">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Treatments Completed
                      </p>
                      <div className="flex items-center space-x-1">
                        <p className="text-lg sm:text-xl font-bold">
                          {recentTreatments.length}
                        </p>
                        <div className="flex items-center text-xs text-green-600">
                          <ArrowUpRight className="h-3 w-3" />
                          <span>+12%</span>
                        </div>
                      </div>
                    </div>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Revenue Area Chart Row */}
            <div className="mb-3">
              <ChartAreaInteractive
                data={revenueChartData}
                config={revenueChartConfig}
              />
            </div>

            {/* Charts Row - Responsive Layout */}
            <div className="grid gap-3 grid-cols-1 lg:grid-cols-2 w-full">
              {/* Appointments Chart */}
              <AppointmentBarChart
                data={weekData}
                title="Patient Visits (Weekly)"
                weekRange={
                  weekStart.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  }) +
                  " - " +
                  getEndOfWeek(weekStart).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })
                }
                onPrevWeek={() =>
                  setWeekStart((prev) => {
                    const d = new Date(prev);
                    d.setDate(d.getDate() - 7);
                    return getStartOfWeek(d);
                  })
                }
                onNextWeek={() =>
                  setWeekStart((prev) => {
                    const d = new Date(prev);
                    d.setDate(d.getDate() + 7);
                    return getStartOfWeek(d);
                  })
                }
                disableNext={(() => {
                  const nextWeek = new Date(weekStart);
                  nextWeek.setDate(nextWeek.getDate() + 7);
                  const now = new Date();
                  // Only allow if next week has started (today >= start of next week)
                  return now < getStartOfWeek(nextWeek);
                })()}
              />
              {/* Treatment Pie Chart Card */}
              <TreatmentPieChart data={treatmentData} />
            </div>
          </TabsContent>

          <TabsContent value="appointments" className="h-full">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
              {/* Calendar - Full width on mobile, 2/3 on desktop */}
              <div
                className={`flex flex-col ${selectedEvent ? "hidden sm:flex lg:col-span-2" : "lg:col-span-2"}`}
              >
                <Card className="flex-1 flex flex-col">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base sm:text-lg">
                      Today&apos;s Appointments
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Click on an appointment to view details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 h-[calc(100%-4rem)]">
                    <FullCalendar
                      plugins={[
                        dayGridPlugin,
                        timeGridPlugin,
                        interactionPlugin,
                      ]}
                      initialView="timeGridDay"
                      headerToolbar={{
                        left: "prev,next today",
                        center: "title",
                        right: "timeGridDay,timeGridWeek",
                      }}
                      events={calendarEvents}
                      eventClick={handleEventClick}
                      height="100%"
                      slotMinTime="08:00:00"
                      slotMaxTime="18:00:00"
                      allDaySlot={false}
                      eventDisplay="block"
                      eventClassNames={(arg) => {
                        const treatment = arg.event.extendedProps.treatment;
                        if (treatment && treatment !== "Check Up") {
                          return [
                            "bg-green-50",
                            "text-green-600",
                            "border-none",
                            "rounded-md",
                            "px-2",
                            "py-1",
                            "font-medium",
                          ];
                        } else {
                          return [
                            "bg-blue-50",
                            "text-blue-600",
                            "border-none",
                            "rounded-md",
                            "px-2",
                            "py-1",
                            "font-medium",
                          ];
                        }
                      }}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Appointment Details - Conditional visibility based on selectedEvent and screen size */}
              <div
                className={`lg:col-span-1 ${selectedEvent ? "block" : "hidden"} sm:block`}
              >
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base sm:text-lg">
                      Appointment Details
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      {selectedEvent
                        ? "Selected appointment information"
                        : "Select an appointment to view details"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedEvent ? (
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold text-base sm:text-lg">
                            {selectedEvent.extendedProps.patient}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span
                              className="text-sm sm:text-base font-medium"
                              style={{
                                color:
                                  selectedEvent.extendedProps.treatment !==
                                  "Check Up"
                                    ? "#16a34a"
                                    : "#2563eb",
                              }}
                            >
                              {selectedEvent.extendedProps.treatment !==
                              "Check Up"
                                ? selectedEvent.extendedProps.treatment
                                : "Check Up"}
                            </span>
                          </div>
                        </div>

                        {/* Doctor Name */}
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs sm:text-sm">
                            Doctor:{" "}
                            {selectedEvent.extendedProps.appointment?.dentist
                              ? `Dr. ${selectedEvent.extendedProps.appointment.dentist.firstName} ${selectedEvent.extendedProps.appointment.dentist.lastName}`
                              : "Not assigned"}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs sm:text-sm">
                              {new Date(selectedEvent.start).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" }
                              )}{" "}
                              -
                              {new Date(selectedEvent.end).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" }
                              )}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs sm:text-sm">
                              {selectedEvent.extendedProps.phone}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs sm:text-sm break-all">
                              {selectedEvent.extendedProps.email}
                            </span>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-1 text-sm">Notes</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {selectedEvent.extendedProps.notes}
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={handleStartTreatment}
                          >
                            <UserCheck className="mr-1 h-3 w-3" />
                            Start Treatment
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={handleReschedule}
                          >
                            <Calendar className="mr-1 h-3 w-3" />
                            Reschedule
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-xs sm:text-sm">
                          Click on a calendar event to view appointment details
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
            <AppointmentDialog
              isOpen={appointmentDialogOpen}
              onClose={() => {
                setAppointmentDialogOpen(false);
                setAppointmentDialogData(null);
              }}
              patientId={appointmentDialogData?.patientId || ""}
              currentAppointment={appointmentDialogData}
              onSuccess={() => {
                setAppointmentDialogOpen(false);
                setAppointmentDialogData(null);
                // Refresh appointments
                getAppointments().then((result) => {
                  if (result.success && result.data)
                    setAppointments(result.data as DashboardAppointment[]);
                });
              }}
            />
          </TabsContent>

          <TabsContent value="queue" className="h-full overflow-auto space-y-4">
            {/* Current Queue */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base sm:text-lg">
                  Today\"s Queue
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Patients waiting for treatment, ordered by check-in time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingQueue ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                      Loading queue...
                    </p>
                  </div>
                ) : paginatedQueue.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No patients in queue</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {paginatedQueue.map((patient) => (
                        <Card key={patient.id} className="p-3 sm:p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3 sm:gap-4">
                              <div className="flex flex-col items-center">
                                <div className="text-xs sm:text-sm font-medium">
                                  {patient.checkInTime
                                    ? format(
                                        new Date(patient.checkInTime),
                                        "HH:mm"
                                      )
                                    : "N/A"}
                                </div>
                                <Badge
                                  className={`text-xs ${getStatusColor(patient.status)}`}
                                >
                                  {getStatusLabel(patient.status)}
                                </Badge>
                              </div>

                              <div>
                                <h3 className="font-semibold text-sm sm:text-base">
                                  {patient.patient.firstName}{" "}
                                  {patient.patient.lastName}
                                </h3>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                  {patient.staff
                                    ? `Dr. ${patient.staff.firstName} ${patient.staff.lastName}`
                                    : "No doctor assigned"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {patient.patient.phoneNumber || "No phone"}
                                </p>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              {patient.status === "WAITING" && (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleStartQueueTreatment(patient.patientId)
                                  }
                                  className="w-full sm:w-auto"
                                >
                                  <UserCheck className="mr-1 h-3 w-3" />
                                  Start Treatment
                                </Button>
                              )}
                              {patient.status === "IN_TREATMENT" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleStartQueueTreatment(patient.patientId)
                                  }
                                  className="w-full sm:w-auto"
                                >
                                  <Activity className="mr-1 h-3 w-3" />
                                  Continue Treatment
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>

                    {/* Queue Pagination */}
                    {queueTotalPages > 1 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-2">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Showing {(queuePage - 1) * itemsPerPage + 1} to{" "}
                          {Math.min(queuePage * itemsPerPage, queueData.length)}{" "}
                          of {queueData.length} patients
                        </p>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setQueuePage(queuePage - 1)}
                            disabled={queuePage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                          </Button>
                          <span className="text-xs sm:text-sm">
                            Page {queuePage} of {queueTotalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setQueuePage(queuePage + 1)}
                            disabled={queuePage === queueTotalPages}
                          >
                            Next
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Recent Treatments */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base sm:text-lg">
                  Recent Treatments
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Patients who completed treatment today
                </CardDescription>
              </CardHeader>
              <CardContent>
                {paginatedRecent.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No treatments completed today</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {paginatedRecent.map((patient) => (
                        <Card key={patient.id} className="p-3 sm:p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex flex-col items-center">
                              <div className="text-xs sm:text-sm font-medium">
                                {patient.completedAt
                                  ? format(
                                      new Date(patient.completedAt),
                                      "HH:mm"
                                    )
                                  : "N/A"}
                              </div>
                              <Badge className="text-xs bg-green-100 text-green-800">
                                Completed
                              </Badge>
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm sm:text-base truncate">
                                {patient.patient.firstName}{" "}
                                {patient.patient.lastName}
                              </h3>
                              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                {patient.staff
                                  ? `Dr. ${patient.staff.firstName} ${patient.staff.lastName}`
                                  : "No doctor assigned"}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                Duration:{" "}
                                {patient.startedAt && patient.completedAt
                                  ? `${Math.round((new Date(patient.completedAt).getTime() - new Date(patient.startedAt).getTime()) / (1000 * 60))} min`
                                  : "N/A"}
                              </p>
                            </div>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                router.push(`/patients/${patient.patientId}`)
                              }
                              className="w-full sm:w-auto"
                            >
                              View Patient
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>

                    {/* Recent Treatments Pagination */}
                    {recentTotalPages > 1 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-2">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Showing {(recentPage - 1) * itemsPerPage + 1} to{" "}
                          {Math.min(
                            recentPage * itemsPerPage,
                            recentTreatments.length
                          )}{" "}
                          of {recentTreatments.length} treatments
                        </p>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRecentPage(recentPage - 1)}
                            disabled={recentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                          </Button>
                          <span className="text-xs sm:text-sm">
                            Page {recentPage} of {recentTotalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRecentPage(recentPage + 1)}
                            disabled={recentPage === recentTotalPages}
                          >
                            Next
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      <TreatmentCompletionDialog
        open={treatmentDialogOpen}
        onOpenChange={setTreatmentDialogOpen}
        patientName="John Doe"
        patientId="1"
      />
      <AddToQueueDialog
        open={addToQueueOpen}
        onOpenChange={setAddToQueueOpen}
        onAdd={handleAddToQueue}
        onSuccess={handleQueueSuccess}
      />
      <PatientsDialogs />
    </div>
  );
}

export default function HomePage() {
  return (
    <PatientsProvider>
      <React.Suspense fallback={<div>Loading...</div>}>
        <HomePageContent />
      </React.Suspense>
    </PatientsProvider>
  );
}
