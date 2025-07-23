"use client";

import { useEffect, useState } from "react";
import { TreatmentTemplatesTable } from "../../../features/treatments/components/treatment-templates-table";
import { TreatmentTemplatesDialogs } from "@/features/treatments/components/treatment-templates-dialogs";
import TreatmentTemplatesProvider from "@/features/treatments/context/treatment-templates-context";

import {
  treatmentTemplateListSchema,
  TreatmentTemplate,
} from "../../../features/treatments/data/treatment-template-schema";
import treatmentTemplatesColumns from "../../../features/treatments/components/treatment-templates-columns";
import { getTreatmentTemplates } from "@/server/treatment-templates";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useTreatmentTemplates } from "../../../features/treatments/context/treatment-templates-context";
import { toast } from "sonner";

function TreatmentTemplatesPageContent() {
  const [treatmentTemplateData, setTreatmentTemplateData] = useState<
    TreatmentTemplate[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const { setOpen, setRefreshTreatmentTemplates } = useTreatmentTemplates();

  const fetchTreatmentTemplates = async () => {
    try {
      setIsLoading(true);
      const treatmentTemplatesResult = await getTreatmentTemplates();

      if (!treatmentTemplatesResult.success) {
        console.error(
          "Error fetching treatment templates:",
          treatmentTemplatesResult.error
        );
        toast.error(treatmentTemplatesResult.error);
        setTreatmentTemplateData([]);
        return;
      }

      const transformedData = treatmentTemplatesResult.data
        ? treatmentTemplatesResult.data.map((template: any) => ({
            id: template.id || "",
            name: template.name || "",
            description: template.description || "",
            price: template.estimatedCost ?? 0,
            durationMinutes: template.durationMinutes ?? null,
            createdAt: new Date(template.createdAt),
            updatedAt: new Date(template.updatedAt),
          }))
        : [];

      const validatedData = treatmentTemplateListSchema.parse(transformedData);
      setTreatmentTemplateData(validatedData);
    } catch (error) {
      console.error("Error fetching treatment templates:", error);
      toast.error("An unexpected error occurred");
      setTreatmentTemplateData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTreatmentTemplates();
    setRefreshTreatmentTemplates(() => fetchTreatmentTemplates);
  }, [setRefreshTreatmentTemplates]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">
            Loading treatment templates...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-2 flex flex-wrap items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Treatment Templates
          </h2>
          <p className="text-muted-foreground">
            Manage your treatment templates here.
          </p>
        </div>
        <Button onClick={() => setOpen("add")}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Treatment Template
        </Button>
      </div>
      <div className="-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12">
        <TreatmentTemplatesTable
          data={treatmentTemplateData}
          columns={treatmentTemplatesColumns}
        />
      </div>
      <TreatmentTemplatesDialogs />
    </>
  );
}

export default function TreatmentTemplatesPage() {
  return (
    <TreatmentTemplatesProvider>
      <TreatmentTemplatesPageContent />
    </TreatmentTemplatesProvider>
  );
}
