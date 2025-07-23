"use client";

import { useEffect, useState } from "react";
import { StaffTable } from "../../../features/staff/components/staff-table";
import { StaffInviteDialog } from "../../../features/staff/components/staff-invite-dialog";
import StaffProvider from "../../../features/staff/context/staff-context";
import { staffListSchema, Staff } from "../../../features/staff/data/schema";
import staffColumns from "../../../features/staff/components/staff-columns";
import { getStaff } from "@/server/staff";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { useStaff } from "../../../features/staff/context/staff-context";
import { toast } from "sonner";

function StaffPageContent() {
  const [staffData, setStaffData] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { setIsInviteDialogOpen, setRefreshStaff } = useStaff();

  const fetchStaff = async () => {
    try {
      setIsLoading(true);
      const result = await getStaff();

      if (result.success && result.data) {
        // Transform the data to match our schema
        const transformedData = result.data.map((staff: any) => ({
          ...staff,
          createdAt: new Date(staff.createdAt),
          updatedAt: new Date(staff.updatedAt),
        }));

        const validatedData = staffListSchema.parse(transformedData);
        setStaffData(validatedData);
      } else {
        toast.error(result.message || "Failed to fetch staff");
        setStaffData([]);
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
      toast.error("An unexpected error occurred");
      setStaffData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
    setRefreshStaff(() => fetchStaff);
  }, [setRefreshStaff]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading staff...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-2 flex flex-wrap items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Staff Management
          </h2>
          <p className="text-muted-foreground">
            Manage your staff members and their roles here.
          </p>
        </div>
        <Button onClick={() => setIsInviteDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Staff
        </Button>
      </div>
      <div className="-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12">
        <StaffTable data={staffData} columns={staffColumns} />
      </div>
      <StaffInviteDialog />
    </>
  );
}

export default function StaffPage() {
  return (
    <StaffProvider>
      <StaffPageContent />
    </StaffProvider>
  );
}
