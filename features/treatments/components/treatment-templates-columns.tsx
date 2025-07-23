"use client";
import { ColumnDef } from "@tanstack/react-table";
import { TreatmentTemplate } from "../data/treatment-template-schema";
import { cn } from "@/lib/utils";
import LongText from "@/components/long-text";
import { DataTableColumnHeader } from "../../../components/table/data-table-column-header";
import { DataTableRowActions } from "@/components/table/data-table-row-actions";
import { useTreatmentTemplates } from "../context/treatment-templates-context";

const treatmentTemplatesColumns: ColumnDef<TreatmentTemplate>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Name" />;
    },
    cell: ({ row }) => {
      return <LongText className="max-w-36">{row.getValue("name")}</LongText>;
    },
    meta: {
      className: cn(
        "px-4 py-2 min-w-[8rem]",
        "drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)] lg:drop-shadow-none",
        "bg-background transition-colors duration-200 group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted"
      ),
    },
    enableHiding: false,
  },
  {
    accessorKey: "description",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Description" />;
    },
    cell: ({ row }) => {
      return (
        <LongText className="max-w-full">{row.getValue("description")}</LongText>
      );
    },
    meta: { className: "px-4 py-2 w-full" },
  },
  {
    accessorKey: "durationMinutes",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Duration" />;
    },
    cell: ({ row }) => {
      const value = row.getValue("durationMinutes");
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-300">
          {value ? `${value} min` : "—"}
        </span>
      );
    },
    meta: { className: "px-4 py-2 min-w-[6rem] text-center" },
  },
  {
    accessorKey: "price",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Price" />;
    },
    cell: ({ row }) => {
      const value = row.getValue("price");
      const amount = typeof value === "number" ? value : parseFloat(value);
      const formatted = isNaN(amount)
        ? "—"
        : new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "ETB",
            minimumFractionDigits: 2,
          }).format(amount);
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-300">
          {formatted}
        </span>
      );
    },
    meta: { className: "px-4 py-2 min-w-[7rem] text-center" },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const { setOpen, setCurrentRow } = useTreatmentTemplates();
      return (
        <div className="flex justify-end pr-4">
          <DataTableRowActions
            row={row}
            onEdit={() => {
              setCurrentRow(row.original);
              setOpen("edit");
            }}
            onDelete={() => {
              setCurrentRow(row.original);
              setOpen("delete");
            }}
          />
        </div>
      );
    },
    meta: { className: "px-2 py-2 min-w-[4rem] text-right" },
  },
];

export default treatmentTemplatesColumns;
