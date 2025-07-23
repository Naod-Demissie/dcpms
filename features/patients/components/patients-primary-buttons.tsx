"use client";
import { IconMailPlus, IconUserPlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { usePatients } from "../context/patients-context";

export function PatientsPrimaryButtons() {
  const { setOpen } = usePatients();
  return (
    <div>
      {/* <div className="flex gap-2"> */}
      <Button className="space-x-1" onClick={() => setOpen("add")}>
        <span>Add Patient</span> <IconUserPlus size={18} />
      </Button>
    </div>
  );
}
