"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import { Staff } from "../data/schema";
import { format } from "date-fns";

const staffColumns: ColumnDef<Staff>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      const staff = row.original;
      return (
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={staff.image || ""} alt={staff.name} />
            <AvatarFallback>
              {staff.firstName.charAt(0)}
              {staff.lastName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{staff.name}</div>
            <div className="text-sm text-muted-foreground">{staff.email}</div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "role",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Role" />
    ),
    cell: ({ row }) => {
      const role = row.getValue("role") as string;
      const roleColors = {
        ADMIN: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
        DENTIST:
          "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
        RECEPTIONIST:
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      };

      return (
        <Badge className={roleColors[role as keyof typeof roleColors]}>
          {role}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "phoneNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Phone" />
    ),
    cell: ({ row }) => {
      const phone = row.getValue("phoneNumber") as string;
      return <div className="text-sm">{phone || "Not provided"}</div>;
    },
  },
  {
    accessorKey: "isActive",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const isActive = row.getValue("isActive") as boolean;

      return (
        <Badge variant={isActive ? "default" : "secondary"}>
          {isActive ? "Active" : "Inactive"}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      const isActive = row.getValue(id) as boolean;

      if (isActive && value.includes("active")) return true;
      if (!isActive && value.includes("inactive")) return true;

      return false;
    },
  },
];

export default staffColumns;
