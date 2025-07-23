 "use client";

import { ColumnDef } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import LongText from "@/components/long-text";
import { Patient } from "../data/schema";
import { DataTableColumnHeader } from "../../../components/table/data-table-column-header";
import { DataTableRowActions } from "@/components/table/data-table-row-actions";
import { usePatients } from "../context/patients-context";

const patientColumns: ColumnDef<Patient>[] = [
  {
    accessorKey: "fullName",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Patient Name" />;
    },
    cell: ({ row }) => {
      const firstName = row.original.firstName;
      const lastName = row.original.lastName;
      const initials = `${firstName ? firstName.charAt(0) : ''}${lastName ? lastName.charAt(0) : ''}`.toUpperCase();
      const fullName = `${firstName} ${lastName}`;

      return (
        <div className="flex items-center space-x-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <LongText className="max-w-36">{fullName}</LongText>
        </div>
      );
    },
    enableHiding: false,
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Email" />;
    },
    cell: ({ row }) => {
      return <div className="w-fit text-nowrap">{row.getValue("email")}</div>;
    },
  },
  {
    accessorKey: "phoneNumber",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Phone Number" />;
    },
    cell: ({ row }) => {
      const value = row.getValue("phoneNumber");
      return <div>{value ? value : "—"}</div>;
    },
    enableSorting: false,
  },
  {
    accessorKey: "gender",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Gender" />;
    },
    cell: ({ row }) => {
      const gender = row.getValue("gender") as string;
      const genderColors: Record<string, string> = {
        Male: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300",
        Female: "bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-300",
      };
      return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${genderColors[gender] || "bg-gray-50 text-gray-600"}`}>
          {gender}
        </span>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "city",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="City" />;
    },
    cell: ({ row }) => {
      const value = row.getValue("city");
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-300">
          {value || "—"}
        </span>
      );
    },
    enableSorting: false,
  },

  {
    id: "actions",
    cell: ({ row }) => {
      const { setOpen, setCurrentRow } = usePatients();
      return (
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
      );
    },
  },
];

export default patientColumns;


