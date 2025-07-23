"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { validateInvite, completeStaffRegistration } from "@/server/staff";
import { toast } from "sonner";
import { Upload, User, Mail, Phone, Lock } from "lucide-react";

const registrationSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    phoneNumber: z.string().optional(),
    image: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegistrationFormValues = z.infer<typeof registrationSchema>;

function CompleteRegistrationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteData, setInviteData] = useState<any>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      password: "",
      confirmPassword: "",
      phoneNumber: "",
      image: "",
    },
  });

  useEffect(() => {
    const validateInvitation = async () => {
      if (!token || !email) {
        toast.error("Invalid invitation link");
        router.push("/");
        return;
      }

      try {
        const result = await validateInvite(token, email);

        if (result.success) {
          setInviteData(result.data);
        } else {
          toast.error(result.message || "Invalid invitation");
          router.push("/");
        }
      } catch {
        toast.error("Failed to validate invitation");
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    };

    validateInvitation();
  }, [token, email, router]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        form.setValue("image", result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: RegistrationFormValues) => {
    if (!token || !email) {
      toast.error("Invalid invitation data");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await completeStaffRegistration(token, email, {
        firstName: data.firstName,
        lastName: data.lastName,
        password: data.password,
        phoneNumber: data.phoneNumber,
        image: data.image,
      });

      if (result.success) {
        toast.success(
          "Registration completed successfully! Redirecting to dashboard..."
        );
        setTimeout(() => {
          router.push("/home");
        }, 2000);
      } else {
        toast.error(result.message || "Failed to complete registration");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleColor = (role: string) => {
    const colors = {
      ADMIN: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      DENTIST: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      RECEPTIONIST:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    };
    return colors[role as keyof typeof colors] || "";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">
            Validating invitation...
          </p>
        </div>
      </div>
    );
  }

  if (!inviteData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Invalid Invitation</CardTitle>
            <CardDescription>
              This invitation link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Complete Your Registration
          </h1>
          <p className="mt-2 text-gray-600">
            You&apos;clearve been invited to join{" "}
            {process.env.NEXT_PUBLIC_CLINIC_NAME || "our clinic"} as a staff
            member
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>Invitation Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Email: {email}</p>
                <p className="text-sm text-muted-foreground">
                  Role:{" "}
                  <Badge className={getRoleColor(inviteData.role)}>
                    {inviteData.role}
                  </Badge>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">
                  Expires: {new Date(inviteData.expiresAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Please fill in your details to complete your registration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Profile Image Upload */}
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={imagePreview} />
                    <AvatarFallback>
                      <User className="h-12 w-12" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Label htmlFor="image-upload" className="cursor-pointer">
                      <div className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-500">
                        <Upload className="h-4 w-4" />
                        <span>Upload Profile Picture</span>
                      </div>
                    </Label>
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>First Name</span>
                        </FormLabel>
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

                {/* Contact Information */}
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <Phone className="h-4 w-4" />
                        <span>Phone Number (Optional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your phone number"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password Fields */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <Lock className="h-4 w-4" />
                          <span>Password</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Create a secure password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Confirm your password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Completing Registration..."
                    : "Complete Registration & Sign In"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function CompleteRegistrationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">
              Loading registration...
            </p>
          </div>
        </div>
      }
    >
      <CompleteRegistrationContent />
    </Suspense>
  );
}
