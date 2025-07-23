"use client";

import { useEffect, useState, Suspense } from "react";
import { PatientsTable } from "../../../features/patients/components/patients-table";
import { PatientsDialogs } from "@/features/patients/components/patients-dialogs";
import PatientsProvider from "@/features/patients/context/patients-context";

import {
  patientListSchema,
  Patient,
} from "../../../features/patients/data/schema";
import patientColumns from "../../../features/patients/components/patients-columns";
import { getPatients } from "@/server/patients";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { usePatients } from "../../../features/patients/context/patients-context";
import { toast } from "sonner";

function PatientsPageContent() {
  const [patientData, setPatientData] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { setIsAddDialogOpen, setRefreshPatients } = usePatients();

  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      const patientsResult = await getPatients();

      if (!patientsResult.success) {
        console.error("Error fetching patients:", patientsResult.message);
        toast.error(patientsResult.message);
        setPatientData([]);
        return;
      }

      // Transform the data to match our schema
      const transformedData = patientsResult.data
        ? patientsResult.data.map((patient: any) => ({
            id: patient.id || "",
            firstName: patient.firstName || "",
            lastName: patient.lastName || "",
            gender: patient.gender === "MALE" ? "Male" : "Female",
            dateOfBirth: new Date(patient.dateOfBirth),
            phoneNumber: patient.phoneNumber || undefined,
            email: patient.email || undefined,
            bloodType: patient.bloodType,
            city: patient.city || undefined,
            address: patient.street || patient.address || "",
            status: "active",
            createdAt: new Date(patient.createdAt),
            updatedAt: new Date(patient.updatedAt),
          }))
        : [];

      const validatedData = patientListSchema.parse(transformedData);
      setPatientData(validatedData);
    } catch (error) {
      console.error("Error fetching patients:", error);
      toast.error("An unexpected error occurred");
      setPatientData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
    setRefreshPatients(() => fetchPatients);
  }, [setRefreshPatients]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">
            Loading patients...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-2 flex flex-wrap items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Patient List</h2>
          <p className="text-muted-foreground">
            Manage your patients and their information here.
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Patient
        </Button>
      </div>
      <div className="-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12">
        <PatientsTable data={patientData} columns={patientColumns} />
      </div>
      <PatientsDialogs />
    </>
  );
}

export default function PatientsPage() {
  return (
    <PatientsProvider>
      <Suspense fallback={<div>Loading Patients...</div>}>
        <PatientsPageContent />
      </Suspense>
    </PatientsProvider>
  );
}
