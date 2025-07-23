"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useStaff } from "../context/staff-context";
import { inviteStaff } from "@/server/staff";
import { toast } from "sonner";

const inviteFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["ADMIN", "DENTIST", "RECEPTIONIST"], {
    required_error: "Please select a role",
  }),
});

type InviteFormValues = z.infer<typeof inviteFormSchema>;

export function StaffInviteDialog() {
  const { isInviteDialogOpen, setIsInviteDialogOpen, refreshStaff } = useStaff();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      email: "",
      role: "RECEPTIONIST",
    },
  });

  const onSubmit = async (data: InviteFormValues) => {
    setIsLoading(true);
    try {
      const result = await inviteStaff(data.email, data.role);
      
      if (result.success) {
        toast.success("Invitation sent successfully!");
        form.reset();
        setIsInviteDialogOpen(false);
        refreshStaff();
      } else {
        toast.error(result.message || "Failed to send invitation");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite Staff Member</DialogTitle>
          <DialogDescription>
            Send an invitation email to a new staff member. They will receive a magic link to complete their registration.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter email address"
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
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="RECEPTIONIST">Receptionist</SelectItem>
                      <SelectItem value="DENTIST">Dentist</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsInviteDialogOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

