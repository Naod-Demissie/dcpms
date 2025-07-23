"use client";

import { Suspense } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

import {
  IconCamera,
  IconUser,
  IconMail,
  IconPhone,
  IconShield,
} from "@tabler/icons-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { getCurrentSession, updateStaff } from "@/server/staff";

const accountFormSchema = z.object({
  firstName: z
    .string()
    .min(2, {
      message: "First name must be at least 2 characters.",
    })
    .max(30, {
      message: "First name must not be longer than 30 characters.",
    }),
  lastName: z
    .string()
    .min(2, {
      message: "Last name must be at least 2 characters.",
    })
    .max(30, {
      message: "Last name must not be longer than 30 characters.",
    }),
  phoneNumber: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 10, {
      message: "Phone number must be at least 10 digits.",
    }),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role: string;
  image?: string;
  isActive: boolean;
  createdAt: Date;
}

export function AccountForm() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
    },
  });

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const session = await getCurrentSession();
        if (session.success && session.data?.user) {
          const user = session.data.user as UserData;
          setUserData(user);
          setProfileImage(user.image || null);

          // Update form with user data
          form.reset({
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            phoneNumber: user.phoneNumber || "",
          });
        } else {
          toast.error("Failed to load user data");
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        toast.error("Failed to load user data");
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [form]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Invalid file type. Please select an image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File too large. Please select an image smaller than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setProfileImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: AccountFormValues) => {
    if (!userData) return;

    setIsUpdating(true);
    try {
      const result = await updateStaff(userData.id, {
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
      });

      if (result.success) {
        setUserData((prev) =>
          prev
            ? {
                ...prev,
                firstName: data.firstName,
                lastName: data.lastName,
                name: `${data.firstName} ${data.lastName}`,
                phoneNumber: data.phoneNumber,
              }
            : null
        );

        toast.success("Your profile has been updated successfully");
        window.location.reload(); // Reload to update session everywhere
      } else {
        toast.error(result.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "DENTIST":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "RECEPTIONIST":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load user data</p>
      </div>
    );
  }

  return (
    <Suspense fallback={<div>Loading account form...</div>}>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Account</h3>
          <p className="text-sm text-muted-foreground">
            Update your account settings. Set your preferred language and
            timezone.
          </p>
        </div>

        <Separator />

        {/* Profile Overview Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconUser className="h-5 w-5" />
              Profile Overview
            </CardTitle>
            <CardDescription>
              Your current profile information and account status.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Image Section */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage
                    src={profileImage || userData.image || ""}
                    alt="Profile"
                  />
                  <AvatarFallback className="text-lg">
                    {getInitials(userData.firstName, userData.lastName)}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <IconCamera className="h-4 w-4" />
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-semibold">{userData.name}</h4>
                <div className="flex items-center gap-2">
                  <Badge className={getRoleColor(userData.role)}>
                    {userData.role}
                  </Badge>
                  {userData.isActive && (
                    <Badge variant="outline" className="text-green-600">
                      Active
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <IconMail className="h-4 w-4" />
                  Email Address
                </Label>
                <p className="text-sm text-muted-foreground">
                  {userData.email}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <IconPhone className="h-4 w-4" />
                  Phone Number
                </Label>
                <p className="text-sm text-muted-foreground">
                  {userData.phoneNumber || "Not provided"}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <IconShield className="h-4 w-4" />
                  Role
                </Label>
                <p className="text-sm text-muted-foreground">{userData.role}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Member Since</Label>
                <p className="text-sm text-muted-foreground">
                  {new Date(userData.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Profile Form */}
        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>
              Update your personal information below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your first name"
                            {...field}
                          />
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
                          <Input
                            placeholder="Enter your last name"
                            {...field}
                          />
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
                        <Input
                          placeholder="Enter your phone number"
                          type="tel"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Your phone number for contact purposes.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isUpdating}
                    className="w-full sm:w-auto"
                  >
                    {isUpdating ? "Updating..." : "Update Profile"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Suspense>
  );
}
