"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pill, Calendar, User } from "lucide-react";
import { PrescriptionCellAction } from "@/features/patients/components/prescription-cell-action";
import { getPrescriptions } from "@/server/prescriptions";
import { getStaff } from "@/server/staff";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  ColumnDef,
} from "@tanstack/react-table";
import { DataTablePagination } from "@/components/table/data-table-pagination";

const PAGE_SIZE = 8;

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [dentists, setDentists] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedDentist, setSelectedDentist] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Fetch all prescriptions and dentists
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [prescRes, staffRes] = await Promise.all([
          getPrescriptions(),
          getStaff(),
        ]);
        if (prescRes.success) {
          setPrescriptions(prescRes.data || []);
        } else {
          setPrescriptions([]);
          toast.error(prescRes.error || "Failed to fetch prescriptions");
        }
        if (staffRes.success) {
          setDentists(
            (staffRes.data || []).filter((s: any) => s.role === "DENTIST")
          );
        } else {
          setDentists([]);
        }
      } catch (e) {
        setPrescriptions([]);
        setDentists([]);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Filtered and searched prescriptions
  const filteredPrescriptions = useMemo(() => {
    let filtered = prescriptions;
    if (selectedDentist !== "all") {
      filtered = filtered.filter(
        (p) => p.prescribedBy && p.prescribedBy.id === selectedDentist
      );
    }
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      filtered = filtered.filter((p) => {
        const patientName = p.patient
          ? `${p.patient.firstName} ${p.patient.lastName}`.toLowerCase()
          : "";
        const id = (p.id || "").toLowerCase();
        const meds = (p.details || [])
          .map((d: any) => d.medication.toLowerCase())
          .join(" ");
        return patientName.includes(s) || id.includes(s) || meds.includes(s);
      });
    }
    return filtered;
  }, [prescriptions, selectedDentist, search]);

  // Pagination
  const totalPages = Math.ceil(filteredPrescriptions.length / PAGE_SIZE) || 1;
  const paginatedPrescriptions = filteredPrescriptions.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  // Reset to first page on filter/search change
  useEffect(() => {
    setPage(1);
  }, [search, selectedDentist]);

  // Actions (edit/delete) - for now, just reload on success
  const handleEdit = () => {
    // Optionally, open a dialog for editing
    toast.info("Edit prescription (not implemented)");
  };
  const handleDelete = () => {
    // Optionally, reload prescriptions after delete
    toast.info("Delete prescription (not implemented)");
  };

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      { accessorKey: "id", header: "ID" },
      // Add more columns if needed for filtering/sorting
    ],
    []
  );

  const table = useReactTable({
    data: filteredPrescriptions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 8 } },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Prescriptions</h2>
          <p className="text-muted-foreground">
            Browse and manage all prescriptions.
          </p>
        </div>
        {/* Removed Create Prescription Button */}
      </div>
      <div className="flex flex-col md:flex-row gap-2 md:items-center">
        <Input
          placeholder="Search by patient, ID, or medication..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-64"
        />
        <Select value={selectedDentist} onValueChange={setSelectedDentist}>
          <SelectTrigger className="w-full md:w-56">
            <SelectValue placeholder="Filter by dentist" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Dentists</SelectItem>
            {dentists.map((d: any) => (
              <SelectItem key={d.id} value={d.id}>
                {d.firstName} {d.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-sm text-muted-foreground">
            Loading prescriptions...
          </span>
        </div>
      ) : filteredPrescriptions.length === 0 ? (
        <div className="text-center py-16">
          <Pill className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">
            No prescriptions found
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {table.getRowModel().rows.map((row) => {
            const prescription = row.original;
            return (
              <div
                key={prescription.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                    <Pill className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-primary">
                        {prescription.id || "Unknown"}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {prescription.details?.length || 0} medication
                        {(prescription.details?.length || 0) !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {format(
                            new Date(prescription.issuedAt),
                            "MMM dd, yyyy"
                          )}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>
                          Dr.{" "}
                          {prescription.prescribedBy?.firstName ||
                            prescription.prescribedBy?.name ||
                            "Unknown"}
                        </span>
                      </div>
                      {prescription.patient && (
                        <div className="flex items-center space-x-1">
                          <span className="font-semibold">
                            {prescription.patient.firstName}{" "}
                            {prescription.patient.lastName}
                          </span>
                          <span className="text-xs">
                            ({prescription.patient.gender}, Age:{" "}
                            {prescription.patient.dateOfBirth
                              ? new Date().getFullYear() -
                                new Date(
                                  prescription.patient.dateOfBirth
                                ).getFullYear()
                              : "N/A"}
                            )
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <PrescriptionCellAction
                  prescription={prescription}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </div>
            );
          })}
        </div>
      )}
      {/* Pagination Controls (patients style) */}
      <DataTablePagination table={table} />
    </div>
  );
}
