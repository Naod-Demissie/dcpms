import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { TreatmentTemplate } from "../data/treatment-template-schema";
import { TreatmentTemplatesActionDialog } from "./treatment-templates-action-dialog";
import { TreatmentTemplatesDeleteDialog } from "./treatment-templates-delete-dialog";

interface CellActionProps {
  data: TreatmentTemplate;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  return (
    <>
      <TreatmentTemplatesActionDialog
        currentRow={data}
        open={openEditDialog}
        onOpenChange={setOpenEditDialog}
      />
      <TreatmentTemplatesDeleteDialog
        currentRow={data}
        open={openDeleteDialog}
        onOpenChange={setOpenDeleteDialog}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setOpenEditDialog(true)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenDeleteDialog(true)}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
