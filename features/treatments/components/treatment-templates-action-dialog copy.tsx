"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { showSubmittedData } from "@/components/show-submitted-data";
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
import {
  TreatmentTemplate,
  treatmentTemplateSchema,
} from "../data/treatment-template-schema";

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
  const form = useForm<TreatmentTemplate>({
    resolver: zodResolver(treatmentTemplateSchema),
    defaultValues: isEdit
      ? {
          ...currentRow,
        }
      : {
          name: "",
          description: "",
          estimatedCost: 0,
          durationMinutes: 0,
        },
  });

  const onSubmit = (values: TreatmentTemplate) => {
    form.reset();
    showSubmittedData(values);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset();
        onOpenChange(state);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-left">
          <DialogTitle>
            {isEdit ? "Edit Treatment Template" : "Add New Treatment Template"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the treatment template here. "
              : "Create new treatment template here. "}
            Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <div className="-mr-4 h-[26.25rem] w-full overflow-y-auto py-1 pr-4">
          <Form {...form}>
            <form
              id="treatment-template-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 p-0.5"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                    <FormLabel className="col-span-2 text-right">
                      Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Treatment Name"
                        className="col-span-4"
                        autoComplete="off"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="col-span-4 col-start-3" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                    <FormLabel className="col-span-2 text-right">
                      Description
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Treatment Description"
                        className="col-span-4"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="col-span-4 col-start-3" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="estimatedCost"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                    <FormLabel className="col-span-2 text-right">
                      Estimated Cost
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        className="col-span-4"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage className="col-span-4 col-start-3" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="durationMinutes"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                    <FormLabel className="col-span-2 text-right">
                      Duration (Minutes)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        className="col-span-4"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage className="col-span-4 col-start-3" />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        <DialogFooter>
          <Button type="submit" form="treatment-template-form">
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
