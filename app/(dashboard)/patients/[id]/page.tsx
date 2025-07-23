"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Edit, Save, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { getPatientById, updatePatient } from "@/server/patients";
import { updateQueueStatus } from "@/server/queue";
import { toast } from "sonner";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Pill,
  FileText,
  CreditCard,
  Clock,
  Stethoscope,
} from "lucide-react";
import { AppointmentsSection } from "@/features/patients/components/appointments-section";
import { PrescriptionsSection } from "@/features/patients/components/prescriptions-section";
import { InvoicesSection } from "@/features/patients/components/invoices-section";
import { TreatmentsSection } from "@/features/patients/components/treatments-section";
import { DentalChartSection } from "@/features/patients/components/dental-chart-section";
import { DocumentsSection } from "@/features/patients/components/documents-section";
import { MedicalHistorySection } from "@/features/patients/components/medical-history-section";

const updatePatientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  gender: z.enum(["Male", "Female"]),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  bloodType: z
    .enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
    .optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  subcity: z.string().optional(),
  woreda: z.string().optional(),
  houseNumber: z.string().optional(),
});

type UpdatePatientValues = z.infer<typeof updatePatientSchema>;

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromQueue = searchParams.get("from") === "queue";

  type PatientResponse = {
    success: boolean;
    data?: {
      id: string;
      firstName: string;
      lastName: string;
      gender: "MALE" | "FEMALE";
      dateOfBirth: Date;
      phoneNumber: string | null;
      email: string | null;
      bloodType: string | null;
      street: string | null;
      city: string | null;
      subcity: string | null;
      woreda: string | null;
      houseNumber: string | null;
      createdAt: Date;
      updatedAt: Date;
    } | null;
    message?: string;
  };

  const [patient, setPatient] = useState<PatientResponse["data"]>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompletingTreatment, setIsCompletingTreatment] = useState(false);

  const form = useForm<UpdatePatientValues>({
    resolver: zodResolver(updatePatientSchema),
  });

  const fetchPatientDetails = async () => {
    try {
      setIsLoading(true);
      const patientResponse = await getPatientById(params.id as string);

      if (patientResponse.success && patientResponse.data) {
        setPatient(patientResponse.data);
        // Set form values
        const safeDateOfBirth = patientResponse.data.dateOfBirth
          ? format(new Date(patientResponse.data.dateOfBirth), "yyyy-MM-dd")
          : format(new Date(), "yyyy-MM-dd");

        const bloodType = patientResponse.data.bloodType
          ? patientResponse.data.bloodType.replace("_", "")
          : undefined;

        form.reset({
          firstName: patientResponse.data.firstName || "",
          lastName: patientResponse.data.lastName || "",
          gender: patientResponse.data.gender === "MALE" ? "Male" : "Female",
          dateOfBirth: safeDateOfBirth,
          phoneNumber: patientResponse.data.phoneNumber || "",
          email: patientResponse.data.email || "",
          bloodType: bloodType as
            | "A+"
            | "A-"
            | "B+"
            | "B-"
            | "AB+"
            | "AB-"
            | "O+"
            | "O-"
            | undefined,
          street: patientResponse.data.street || "",
          city: patientResponse.data.city || "",
          subcity: patientResponse.data.subcity || "",
          woreda: patientResponse.data.woreda || "",
          houseNumber: patientResponse.data.houseNumber || "",
        });
        setIsLoading(false);
      } else {
        toast.error("Patient not found");
        router.push("/patients");
      }
    } catch (error) {
      console.error("Error fetching patient details:", error);
      toast.error("An unexpected error occurred");
      router.push("/patients");
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchPatientDetails();
    }
  }, [params.id]);

  const onSubmit = async (data: UpdatePatientValues) => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          formData.append(key, value.toString());
        }
      });

      const result = await updatePatient(params.id as string, formData);

      if (result.success) {
        toast.success("Patient updated successfully!");
        setIsEditing(false);
        fetchPatientDetails(); // Refresh data
      } else {
        toast.error(result.error || "Failed to update patient");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form to original values
    if (patient) {
      const bloodType = patient.bloodType
        ? patient.bloodType.replace("_", "")
        : undefined;

      form.reset({
        firstName: patient.firstName,
        lastName: patient.lastName,
        gender: patient.gender === "MALE" ? "Male" : "Female",
        dateOfBirth: format(new Date(patient.dateOfBirth), "yyyy-MM-dd"),
        phoneNumber: patient.phoneNumber || "",
        email: patient.email || "",
        bloodType: bloodType as
          | "A+"
          | "A-"
          | "B+"
          | "B-"
          | "AB+"
          | "AB-"
          | "O+"
          | "O-"
          | undefined,
        street: patient.street || "",
        city: patient.city || "",
        subcity: patient.subcity || "",
        woreda: patient.woreda || "",
        houseNumber: patient.houseNumber || "",
      });
    }
  };

  const handleCompleteTreatment = async () => {
    setIsCompletingTreatment(true);
    try {
      // Find the queue entry for this patient
      const { getQueue } = await import("@/server/queue");
      const queueResult = await getQueue();

      if (queueResult.success && queueResult.data) {
        const patientQueueEntry = queueResult.data.find(
          (entry: any) =>
            entry.patientId === params.id &&
            (entry.status === "WAITING" || entry.status === "IN_TREATMENT")
        );

        if (patientQueueEntry) {
          const result = await updateQueueStatus(
            patientQueueEntry.id,
            "COMPLETED"
          );

          if (result.success) {
            toast.success("Treatment completed successfully!");
            // Redirect back to queue section
            router.push("/home?tab=queue");
          } else {
            toast.error(result.error || "Failed to complete treatment");
          }
        } else {
          toast.error("No active queue entry found for this patient");
        }
      } else {
        toast.error("Failed to fetch queue data");
      }
    } catch (error) {
      console.error("Error completing treatment:", error);
      toast.error("An error occurred while completing treatment");
    } finally {
      setIsCompletingTreatment(false);
    }
  };

  const calculateAge = (birthDate: Date) => {
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      return age - 1;
    }
    return age;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">
            Loading patient details...
          </p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Patient not found</p>
        <Button onClick={() => router.push("/patients")} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Patients
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (fromQueue) {
                router.push("/home?tab=queue");
              } else {
                router.push("/patients");
              }
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {fromQueue ? "Back to Queue" : "Back to Patients"}
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Patient Details
            </h1>
            <p className="text-muted-foreground">
              View and edit patient information
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {fromQueue && (
            <Button
              onClick={handleCompleteTreatment}
              disabled={isCompletingTreatment}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {isCompletingTreatment ? "Completing..." : "Complete Treatment"}
            </Button>
          )}
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancelEdit}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={form.handleSubmit(onSubmit)} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <Avatar className="h-24 w-24 mx-auto">
              <AvatarImage
                src=""
                alt={`${patient.firstName} ${patient.lastName}`}
              />
              <AvatarFallback className="text-lg">
                {(patient.firstName || "").charAt(0)}
                {(patient.lastName || "").charAt(0)}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="mt-4">
              {patient.firstName} {patient.lastName}
            </CardTitle>
            <CardDescription>{patient.email}</CardDescription>
            <div className="flex justify-center space-x-2 mt-2">
              <Badge variant="outline">
                {patient.gender === "MALE" ? "Male" : "Female"}
              </Badge>
              <Badge variant="outline">
                {calculateAge(new Date(patient.dateOfBirth))} years old
              </Badge>
              {fromQueue && (
                <Badge className="bg-blue-100 text-blue-800">
                  In Treatment
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Patient Since:</span>
                <p className="text-muted-foreground">
                  {format(new Date(patient.createdAt), "MMM dd, yyyy")}
                </p>
              </div>
              {patient.bloodType && (
                <div>
                  <span className="font-medium">Blood Type:</span>
                  <p className="text-muted-foreground">
                    {patient.bloodType.replace("_", "")}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              {isEditing ? "Edit patient details" : "Patient details"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter phone number"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="bloodType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Blood Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select blood type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="A+">A+</SelectItem>
                            <SelectItem value="A-">A-</SelectItem>
                            <SelectItem value="B+">B+</SelectItem>
                            <SelectItem value="B-">B-</SelectItem>
                            <SelectItem value="AB+">AB+</SelectItem>
                            <SelectItem value="AB-">AB-</SelectItem>
                            <SelectItem value="O+">O+</SelectItem>
                            <SelectItem value="O-">O-</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="street"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter street address"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter city" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="subcity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subcity</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter subcity" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="woreda"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Woreda</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter woreda" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="houseNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>House Number</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter house number"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </form>
              </Form>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">First Name</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {patient.firstName}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Last Name</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {patient.lastName}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Gender</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {patient.gender === "MALE" ? "Male" : "Female"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Date of Birth</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {format(new Date(patient.dateOfBirth), "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Phone Number</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {patient.phoneNumber || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {patient.email || "Not provided"}
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Address</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {[
                      patient.street,
                      patient.subcity,
                      patient.woreda,
                      patient.city,
                      patient.houseNumber,
                    ]
                      .filter(Boolean)
                      .join(", ") || "Not provided"}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="appointments" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="appointments" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Appointments
          </TabsTrigger>
          <TabsTrigger value="treatments" className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            Treatments
          </TabsTrigger>
          <TabsTrigger value="dental-chart" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Dental Chart
          </TabsTrigger>
          <TabsTrigger
            value="prescriptions"
            className="flex items-center gap-2"
          >
            <Pill className="h-4 w-4" />
            Prescriptions
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Invoices
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Appointments Tab */}
        <TabsContent value="appointments">
          <Suspense fallback={<div>Loading Appointments...</div>}>
            <AppointmentsSection patientId={params.id as string} />
          </Suspense>
        </TabsContent>

        {/* Treatments Tab */}
        <TabsContent value="treatments">
          <Suspense fallback={<div>Loading Treatments...</div>}>
            <TreatmentsSection patientId={params.id as string} />
          </Suspense>
        </TabsContent>

        {/* Dental Chart Tab */}
        <TabsContent value="dental-chart">
          <Suspense fallback={<div>Loading Dental Chart...</div>}>
            <DentalChartSection
              patientId={params.id as string}
              patientAge={calculateAge(new Date(patient.dateOfBirth))}
            />
          </Suspense>
        </TabsContent>

        {/* Prescriptions Tab */}
        <TabsContent value="prescriptions">
          <Suspense fallback={<div>Loading Prescriptions...</div>}>
            <PrescriptionsSection patientId={params.id as string} />
          </Suspense>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices">
          <Suspense fallback={<div>Loading Invoices...</div>}>
            <InvoicesSection patientId={params.id as string} />
          </Suspense>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Suspense fallback={<div>Loading Documents...</div>}>
            <DocumentsSection patientId={params.id as string} />
          </Suspense>
        </TabsContent>

        {/* Medical History Tab */}
        <TabsContent value="history">
          <Suspense fallback={<div>Loading Medical History...</div>}>
            <MedicalHistorySection patientId={params.id as string} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
