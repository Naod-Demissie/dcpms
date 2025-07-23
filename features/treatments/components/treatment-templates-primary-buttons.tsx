"use client";

import { IconPlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { useTreatmentTemplates } from "../context/treatment-templates-context";

export function TreatmentTemplatesPrimaryButtons() {
  const { setOpen } = useTreatmentTemplates();
  return (
    <div className="flex gap-2">
      <Button className="space-x-1" onClick={() => setOpen("add")}>
        <span>Add New Treatment Template</span> <IconPlus size={18} />
      </Button>
    </div>
  );
}
