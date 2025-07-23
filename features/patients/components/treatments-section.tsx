"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope, Plus, Calendar, Trash2, Edit } from "lucide-react";
import { Treatment } from "../data/treatment-schema";
import { TreatmentDialog } from "./treatment-dialog";
import { getTreatmentsByPatient, deleteTreatment } from "@/server/treatments";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

interface TreatmentsSectionProps {
  patientId: string;
}

export function TreatmentsSection({ patientId }: TreatmentsSectionProps) {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editTreatment, setEditTreatment] = useState<Treatment | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTreatments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getTreatmentsByPatient(patientId);
      if (result.success && result.data) {
        // Map backend result to expected Treatment[] shape
        setTreatments(
          result.data.map((t: any) => ({
            id: t.id,
            patientId: t.patientId,
            name: t.treatmentType || (t.template && t.template.name) || t.name || "",
            description: t.description || undefined,
            date: t.date || t.createdAt,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
            notes: t.notes || undefined,
            cost: t.cost,
            durationMinutes: t.durationMinutes,
            appointment: t.appointment,
            templateId: t.templateId,
            status: t.status,
            treatedById: t.treatedById,
          }))
        );
      } else {
        setError(result.error || "Failed to fetch treatments");
      }
    } catch (e) {
      setError("Failed to fetch treatments");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTreatments();
  }, [patientId]);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const result = await deleteTreatment(id);
      if (result.success) {
        toast.success("Treatment deleted successfully");
        fetchTreatments();
      } else {
        toast.error(result.error || "Failed to delete treatment");
      }
    } catch (e) {
      toast.error("Failed to delete treatment");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(d);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg">Treatments</CardTitle>
          <CardDescription>Medical treatments and procedures</CardDescription>
        </div>
        <Button onClick={() => { setEditTreatment(null); setIsDialogOpen(true); }} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Treatment
        </Button>
      </CardHeader>
      <CardContent className="p-4 rounded-b-lg">
        <div className="space-y-4">
          {isLoading ? (
            <p className="text-center text-muted-foreground">Loading treatments...</p>
          ) : error ? (
            <p className="text-center text-destructive">{error}</p>
          ) : treatments.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No treatments recorded</p>
          ) : (
            treatments.map((treatment) => (
              <div
                key={treatment.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-card dark:bg-card/80 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex flex-col items-center text-sm text-gray-500">
                    <Stethoscope className="h-4 w-4 mb-1" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-base">{treatment.name}</span>
                    </div>
                    {treatment.description && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {treatment.description}
                      </div>
                    )}
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(treatment.createdAt)}</span>
                    </div>
                    {treatment.notes && (
                      <p className="text-sm text-muted-foreground mt-1">
                        <span className="font-medium">Notes:</span> {treatment.notes}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setEditTreatment(treatment); setIsDialogOpen(true); }}>
                      <Edit className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDeleteId(treatment.id)} className="text-red-600">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>
        {/* Delete confirmation */}
        {deleteId && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 dark:bg-black/70">
            <div className="bg-card dark:bg-card/80 hover:dark:bg-muted/60 rounded-lg shadow-lg p-6 w-full max-w-sm border border-border transition-colors">
              <h3 className="font-semibold text-lg mb-2">Delete Treatment?</h3>
              <p className="mb-4 text-muted-foreground">Are you sure you want to delete this treatment? This action cannot be undone.</p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDeleteId(null)} disabled={isDeleting}>Cancel</Button>
                <Button variant="destructive" onClick={() => handleDelete(deleteId!)} disabled={isDeleting}>
                  {isDeleting ? (
                    <span className="inline-block w-4 h-4 mr-2 align-middle animate-spin border-2 border-current border-t-transparent rounded-full"></span>
                  ) : null}
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
        <TreatmentDialog
          isOpen={isDialogOpen}
          onClose={() => { setIsDialogOpen(false); setEditTreatment(null); fetchTreatments(); }}
          patientId={patientId}
          initialData={editTreatment}
        />
      </CardContent>
    </Card>
  );
}

