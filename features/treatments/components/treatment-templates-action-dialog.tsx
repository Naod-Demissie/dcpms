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
import { Textarea } from "@/components/ui/textarea";

import { TreatmentTemplate } from "../data/treatment-template-schema";
import {
  createTreatmentTemplate,
  updateTreatmentTemplate,
} from "@/server/treatment-templates";
import { useTreatmentTemplates } from "../context/treatment-templates-context";

const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  description: z.string().optional(),
  price: z.coerce
    .number()
    .min(0, { message: "Price must be a positive number." }),
  durationMinutes: z.coerce
    .number()
    .min(0, { message: "Duration must be a positive number." })
    .optional(),
  isEdit: z.boolean(),
});
type TreatmentTemplateForm = z.infer<typeof formSchema>;

interface Props {
  currentRow?: TreatmentTemplate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TreatmentTemplatesActionDialog({
  currentRow,
  open,
  onOpenChange,
}: Props) {
  const isEdit = !!currentRow;
  const { refreshTreatmentTemplates } = useTreatmentTemplates();

  const form = useForm<TreatmentTemplateForm>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? {
          ...currentRow,
          isEdit,
        }
      : {
          name: "",
          description: "",
          price: 0,
          durationMinutes: 0,
          isEdit,
        },
  });

  const onSubmit = async (values: TreatmentTemplateForm) => {
    const formData = new FormData();
    for (const key in values) {
      if (Object.prototype.hasOwnProperty.call(values, key)) {
        const value = values[key as keyof TreatmentTemplateForm];
        if (key === "price" && typeof value === "number") {
          formData.append(key, value.toString());
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
        result = await updateTreatmentTemplate(currentRow.id, formData);
      } else {
        result = await createTreatmentTemplate(formData);
      }

      if (result.success) {
        toast.success(
          isEdit
            ? "Treatment Template updated successfully"
            : "Treatment Template created successfully"
        );
        form.reset();
        onOpenChange(false);
        refreshTreatmentTemplates(); // Trigger refresh of treatment template list
      } else {
        toast.error(result.error || "Failed to save treatment template");
        console.error("Server error:", result.details || result.error);
      }
    } catch (error) {
      console.error("Error saving treatment template:", error);
      toast.error("Failed to save treatment template");
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
            {isEdit ? "Edit Treatment Template" : "Add New Treatment Template"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the treatment template information below. "
              : "Enter treatment template information below. "}
            Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[28rem] overflow-y-auto">
          <Form {...form}>
            <form
              id="treatment-template-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 p-1"
            >
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground border-b pb-2">
                  Treatment Template Details
                </h4>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Treatment Name"
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Treatment Description"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="durationMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (Minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="60"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
          <Button type="submit" form="treatment-template-form">
            {isEdit ? "Update Treatment Template" : "Create Treatment Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
