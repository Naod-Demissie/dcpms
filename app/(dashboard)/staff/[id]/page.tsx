"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Edit, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { getStaffById, updateStaff } from "@/server/staff";
import { toast } from "sonner";
import { format } from "date-fns";

const updateStaffSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phoneNumber: z.string().optional(),
  role: z.enum(["ADMIN", "DENTIST", "RECEPTIONIST"]).optional(),
  isActive: z.boolean().optional(),
});

type UpdateStaffValues = z.infer<typeof updateStaffSchema>;

export default function StaffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [staff, setStaff] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<UpdateStaffValues>({
    resolver: zodResolver(updateStaffSchema),
  });

  const fetchStaffDetails = async () => {
    try {
      setIsLoading(true);
      const result = await getStaffById(params.id as string);

      if (result.success && result.data) {
        setStaff(result.data);
        // Set form values
        form.reset({
          firstName: result.data.firstName,
          lastName: result.data.lastName,
          phoneNumber: result.data.phoneNumber || "",
          isActive: result.data.isActive,
        });
      } else {
        toast.error(result.message || "Failed to fetch staff details");
        router.push("/staff");
      }
    } catch (error) {
      console.error("Error fetching staff details:", error);
      toast.error("An unexpected error occurred");
      router.push("/staff");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchStaffDetails();
    }
  }, [params.id]);

  const onSubmit = async (data: UpdateStaffValues) => {
    setIsSaving(true);
    try {
      const result = await updateStaff(params.id as string, data);

      if (result.success) {
        toast.success("Staff member updated successfully!");
        setIsEditing(false);
        fetchStaffDetails(); // Refresh data
      } else {
        toast.error(result.message || "Failed to update staff member");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form to original values
    if (staff) {
      form.reset({
        firstName: staff.firstName,
        lastName: staff.lastName,
        phoneNumber: staff.phoneNumber || "",
        role: staff.role,
        isActive: staff.isActive,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">
            Loading staff details...
          </p>
        </div>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Staff member not found</p>
        <Button onClick={() => router.push("/staff")} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Staff
        </Button>
      </div>
    );
  }

  const getRoleColor = (role: string) => {
    const colors = {
      ADMIN: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      DENTIST: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      RECEPTIONIST:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    };
    return colors[role as keyof typeof colors] || "";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/staff")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Staff
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Staff Details</h1>
            <p className="text-muted-foreground">
              View and edit staff member information
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancelEdit}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={form.handleSubmit(onSubmit)} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <Avatar className="h-24 w-24 mx-auto">
              <AvatarImage src={staff.image || ""} alt={staff.name} />
              <AvatarFallback className="text-lg">
                {staff.firstName.charAt(0)}
                {staff.lastName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="mt-4">{staff.name}</CardTitle>
            <CardDescription>{staff.email}</CardDescription>
            <div className="flex justify-center space-x-2 mt-2">
              <Badge className={getRoleColor(staff.role)}>{staff.role}</Badge>
              <Badge variant={staff.isActive ? "default" : "secondary"}>
                {staff.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Member Since:</span>
                <p className="text-muted-foreground">
                  {format(new Date(staff.createdAt), "MMM dd, yyyy")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              {isEditing ? "Edit staff member details" : "Staff member details"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter phone number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="RECEPTIONIST">
                                Receptionist
                              </SelectItem>
                              <SelectItem value="DENTIST">Dentist</SelectItem>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(value === "true")
                            }
                            defaultValue={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="true">Active</SelectItem>
                              <SelectItem value="false">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </form>
              </Form>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">First Name</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {staff.firstName}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Last Name</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {staff.lastName}
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Phone Number</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {staff.phoneNumber || "Not provided"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Role</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {staff.role}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {staff.isActive ? "Active" : "Inactive"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      {staff.sessions && staff.sessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
            <CardDescription>Latest login sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {staff.sessions.map((session: any) => (
                <div
                  key={session.id}
                  className="flex justify-between items-center py-2 border-b last:border-b-0"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {format(
                        new Date(session.createdAt),
                        "MMM dd, yyyy 'at' HH:mm"
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {session.ipAddress} •{" "}
                      {session.userAgent?.split(" ")[0] || "Unknown browser"}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {new Date(session.expiresAt) > new Date()
                      ? "Active"
                      : "Expired"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
