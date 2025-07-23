"use client";

import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { SelectDropdown } from "@/components/select-dropdown";
import { Patient } from "../data/schema";
import { createPatient, updatePatient } from "@/server/patients";
import { usePatients } from "../context/patients-context";

const formSchema = z.object({
  firstName: z.string().min(1, { message: "First Name is required." }),
  lastName: z.string().min(1, { message: "Last Name is required." }),
  gender: z.enum(["Male", "Female"], { message: "Gender is required." }),
  dateOfBirth: z.coerce.date(),
  phoneNumber: z.string().optional(),
  email: z.string().email({ message: "Invalid email address." }).optional(),
  bloodType: z
    .enum([
      "A_POSITIVE",
      "A_NEGATIVE",
      "B_POSITIVE",
      "B_NEGATIVE",
      "AB_POSITIVE",
      "AB_NEGATIVE",
      "O_POSITIVE",
      "O_NEGATIVE",
    ])
    .optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  subcity: z.string().optional(),
  woreda: z.string().optional(),
  houseNumber: z.string().optional(),
  isEdit: z.boolean(),
});
type PatientForm = z.infer<typeof formSchema>;

interface Props {
  currentRow?: Patient;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PatientsActionDialog({
  currentRow,
  open,
  onOpenChange,
}: Props) {
  const isEdit = !!currentRow;
  const { onPatientAdded, refreshPatients } = usePatients();

  const form = useForm<PatientForm>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? {
          ...currentRow,
          isEdit,
          dateOfBirth: new Date(currentRow.dateOfBirth),
        }
      : {
          firstName: "",
          lastName: "",
          gender: "Male" as const,
          dateOfBirth: new Date(),
          email: "",
          phoneNumber: "",
          bloodType: "A_POSITIVE" as const,
          street: "",
          city: "",
          subcity: "",
          woreda: "",
          houseNumber: "",
          isEdit,
        },
  });

  const onSubmit = async (values: PatientForm) => {
    const formData = new FormData();
    for (const key in values) {
      if (Object.prototype.hasOwnProperty.call(values, key)) {
        const value = values[key as keyof PatientForm];
        if (value instanceof Date) {
          formData.append(key, value.toISOString().split("T")[0]);
        } else if (typeof value === "boolean") {
          formData.append(key, value.toString());
        } else if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      }
    }

    try {
      let result;
      if (isEdit) {
        result = await updatePatient(currentRow.id, formData);
      } else {
        result = await createPatient(formData);
      }

      if (result.success) {
        toast.success(
          isEdit
            ? "Patient updated successfully"
            : "Patient created successfully"
        );
        form.reset();
        onOpenChange(false);
        refreshPatients(); // Trigger refresh of patient list
      } else {
        toast.error(result.error || "Failed to save patient");
        console.error("Server error:", result.details || result.error);
      }
    } catch (error) {
      console.error("Error saving patient:", error);
      toast.error("Failed to save patient");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset();
        onOpenChange(state);
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader className="text-left">
          <DialogTitle>
            {isEdit ? "Edit Patient" : "Add New Patient"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the patient information below. "
              : "Enter patient information below. "}
            Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[28rem] overflow-y-auto">
          <Form {...form}>
            <form
              id="patient-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 p-1"
            >
              {/* Personal Information Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground border-b pb-2">
                  Personal Information
                </h4>

                {/* First Name & Last Name */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="John"
                            autoComplete="off"
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
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Doe"
                            autoComplete="off"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Gender & Date of Birth */}
                <div className="grid grid-cols-3 gap-2 ">
                  <FormField
                    control={form.control}
                    name="bloodType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Blood Type</FormLabel>
                        <SelectDropdown
                          defaultValue={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select blood type"
                          items={[
                            { label: "A+", value: "A_POSITIVE" },
                            { label: "A-", value: "A_NEGATIVE" },
                            { label: "B+", value: "B_POSITIVE" },
                            { label: "B-", value: "B_NEGATIVE" },
                            { label: "AB+", value: "AB_POSITIVE" },
                            { label: "AB-", value: "AB_NEGATIVE" },
                            { label: "O+", value: "O_POSITIVE" },
                            { label: "O-", value: "O_NEGATIVE" },
                          ]}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender *</FormLabel>
                        <SelectDropdown
                          defaultValue={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select gender"
                          items={[
                            { label: "Male", value: "Male" },
                            { label: "Female", value: "Female" },
                          ]}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            value={
                              field.value?.toISOString().split("T")[0] || ""
                            }
                            onChange={(e) =>
                              field.onChange(new Date(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground border-b pb-2">
                  Contact Information
                </h4>

                {/* Email & Phone */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="john.doe@gmail.com"
                            type="email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Address - Full Width */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter street address"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter city" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="subcity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subcity</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter subcity" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="woreda"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Woreda</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter woreda" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="houseNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>House Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter house number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </form>
          </Form>
        </div>
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" form="patient-form">
            {isEdit ? "Update Patient" : "Create Patient"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
