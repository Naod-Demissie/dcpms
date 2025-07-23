"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  CreditCard,
  Edit,
  Trash2,
  MoreHorizontal,
  Save,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DentalChart } from "@prisma/client";
import {
  createDentalChart,
  getDentalChartsByPatient,
  updateDentalChart,
  deleteDentalChart,
} from "@/server/dental-charts";

const formSchema = z.object({
  toothNumber: z.number().int().min(1).max(32),
  surface: z.string().optional().nullable(),
  condition: z.enum([
    "HEALTHY",
    "CARIES",
    "FILLING",
    "CROWN",
    "BRIDGE",
    "IMPLANT",
    "EXTRACTION",
    "ROOT_CANAL",
    "GINGIVITIS",
    "PERIODONTITIS",
    "ABSCESS",
    "FRACTURE",
    "OTHER",
  ]),
  notes: z.string().optional().nullable(),
});

type DentalChartForm = z.infer<typeof formSchema>;

interface DentalChartSectionProps {
  patientId: string;
  patientAge: number;
}

export function DentalChartSection({
  patientId,
  patientAge,
}: DentalChartSectionProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [isAnnotationDialogOpen, setIsAnnotationDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] =
    useState<DentalChart | null>(null);
  const [annotations, setAnnotations] = useState<DentalChart[]>([]);

  const form = useForm<DentalChartForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      toothNumber: 0,
      surface: "",
      condition: "HEALTHY",
      notes: "",
    },
  });

  const conditionOptions = [
    { value: "HEALTHY", label: "Healthy", color: "#51cf66" },
    { value: "CARIES", label: "Caries", color: "#ff6b6b" },
    { value: "FILLING", label: "Filling", color: "#339af0" },
    { value: "CROWN", label: "Crown", color: "#4ecdc4" },
    { value: "ROOT_CANAL", label: "Root Canal", color: "#9775fa" },
    { value: "EXTRACTION", label: "Extraction", color: "#495057" },
    { value: "IMPLANT", label: "Implant", color: "#ffd43b" },
    { value: "BRIDGE", label: "Bridge", color: "#ff8cc8" },
    { value: "GINGIVITIS", label: "Gingivitis", color: "#f08c00" },
    { value: "PERIODONTITIS", label: "Periodontitis", color: "#e64980" },
    { value: "ABSCESS", label: "Abscess", color: "#be4bdb" },
    { value: "FRACTURE", label: "Fracture", color: "#845ef7" },
    { value: "OTHER", label: "Other", color: "#fd7e14" },
  ];

  const fetchAnnotations = async () => {
    const result = await getDentalChartsByPatient(patientId);
    if (result.success && result.data) {
      setAnnotations(result.data);
    } else {
      toast.error(result.error || "Failed to fetch dental charts");
    }
  };

  useEffect(() => {
    fetchAnnotations();
  }, [patientId]);

  // Determine if we should show adult or child teeth based on age
  const isAdult = patientAge >= 12;

  useEffect(() => {
    if (canvasRef.current) {
      initializeDentalChart();
    }
  }, [isAdult, annotations]);

  const initializeDentalChart = () => {
    if (!canvasRef.current) return;

    // Clear existing content
    canvasRef.current.innerHTML = "";

    // Create canvas container
    const canvasContainer = document.createElement("div");
    canvasContainer.id = "canvas_container";
    canvasContainer.style.width = "100%";
    canvasContainer.style.height = "400px";
    canvasContainer.style.display = "flex";
    canvasContainer.style.justifyContent = "center";
    canvasContainer.style.alignItems = "center";
    canvasContainer.style.border = "1px solid #e2e8f0";
    canvasContainer.style.borderRadius = "8px";
    canvasContainer.style.backgroundColor = "#f8fafc";

    canvasRef.current.appendChild(canvasContainer);

    // Load Raphael.js if not already loaded
    if (typeof window !== "undefined" && !(window as any).Raphael) {
      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/raphael/2.3.0/raphael.min.js";
      script.onload = () => {
        setTimeout(() => createDentalChart(), 100);
      };
      document.head.appendChild(script);
    } else {
      createDentalChart();
    }
  };

  const createDentalChart = () => {
    if (!(window as any).Raphael || !canvasRef.current) return;

    const Raphael = (window as any).Raphael;
    const container = canvasRef.current.querySelector("#canvas_container");
    if (!container) return;

    // Create paper
    const paper = new Raphael(container, 600, 400);

    // Define tooth positions and numbers based on age
    const toothData = isAdult ? getAdultTeethData() : getChildTeethData();

    // Create teeth
    toothData.forEach((tooth) => {
      const toothElement = paper.circle(tooth.x, tooth.y, 15);
      const toothText = paper.text(tooth.x, tooth.y, tooth.number);

      // Get annotation for this tooth
      const annotation = annotations.find(
        (a) => a.toothNumber === parseInt(tooth.number)
      );
      const fillColor = annotation
        ? conditionOptions.find((c) => c.value === annotation.condition)
            ?.color || "#ffffff"
        : "#ffffff";

      toothElement.attr({
        fill: fillColor,
        stroke: "#333",
        "stroke-width": 2,
        cursor: "pointer",
      });

      toothText.attr({
        "font-size": 12,
        "font-weight": "bold",
        fill: "#333",
        cursor: "pointer",
      });

      // Add hover effects
      const onMouseOver = () => {
        toothElement.attr({ stroke: "#1693A5", "stroke-width": 3 });
        toothText.attr({ fill: "#1693A5", "font-weight": "bold" });
      };

      const onMouseOut = () => {
        toothElement.attr({ stroke: "#333", "stroke-width": 2 });
        toothText.attr({ fill: "#333", "font-weight": "bold" });
      };

      const onClick = () => {
        setSelectedTooth(parseInt(tooth.number));
        const existing = annotations.find(
          (a) => a.toothNumber === parseInt(tooth.number)
        );
        if (existing) {
          setCurrentAnnotation(existing);
          form.reset({
            toothNumber: existing.toothNumber,
            surface: existing.surface || "",
            condition: existing.condition,
            notes: existing.notes || "",
          });
          setIsEditDialogOpen(true);
        } else {
          form.reset({
            toothNumber: parseInt(tooth.number),
            surface: "",
            condition: "HEALTHY",
            notes: "",
          });
          setIsAnnotationDialogOpen(true);
        }
      };

      toothElement.node.addEventListener("mouseover", onMouseOver);
      toothElement.node.addEventListener("mouseout", onMouseOut);
      toothElement.node.addEventListener("click", onClick);
      toothText.node.addEventListener("mouseover", onMouseOver);
      toothText.node.addEventListener("mouseout", onMouseOut);
      toothText.node.addEventListener("click", onClick);
    });

    // Add legend
    const legendY = 350;
    paper
      .text(50, legendY - 20, "Legend:")
      .attr({ "font-size": 14, "font-weight": "bold" });

    conditionOptions.slice(0, 5).forEach((condition, index) => {
      const x = 50 + index * 100;
      paper
        .circle(x, legendY, 8)
        .attr({ fill: condition.color, stroke: "#333" });
      paper.text(x + 20, legendY, condition.label).attr({ "font-size": 10 });
    });
  };

  const getAdultTeethData = () => {
    // Adult teeth positions (simplified layout)
    return [
      // Upper jaw (right to left)
      { number: "18", x: 100, y: 100 },
      { number: "17", x: 130, y: 100 },
      { number: "16", x: 160, y: 100 },
      { number: "15", x: 190, y: 100 },
      { number: "14", x: 220, y: 100 },
      { number: "13", x: 250, y: 100 },
      { number: "12", x: 280, y: 100 },
      { number: "11", x: 310, y: 100 },
      { number: "21", x: 340, y: 100 },
      { number: "22", x: 370, y: 100 },
      { number: "23", x: 400, y: 100 },
      { number: "24", x: 430, y: 100 },
      { number: "25", x: 460, y: 100 },
      { number: "26", x: 490, y: 100 },
      { number: "27", x: 520, y: 100 },
      { number: "28", x: 550, y: 100 },

      // Lower jaw (right to left)
      { number: "48", x: 100, y: 200 },
      { number: "47", x: 130, y: 200 },
      { number: "46", x: 160, y: 200 },
      { number: "45", x: 190, y: 200 },
      { number: "44", x: 220, y: 200 },
      { number: "43", x: 250, y: 200 },
      { number: "42", x: 280, y: 200 },
      { number: "41", x: 310, y: 200 },
      { number: "31", x: 340, y: 200 },
      { number: "32", x: 370, y: 200 },
      { number: "33", x: 400, y: 200 },
      { number: "34", x: 430, y: 200 },
      { number: "35", x: 460, y: 200 },
      { number: "36", x: 490, y: 200 },
      { number: "37", x: 520, y: 200 },
      { number: "38", x: 550, y: 200 },
    ];
  };

  const getChildTeethData = () => {
    // Child teeth positions (simplified layout)
    return [
      // Upper jaw (right to left)
      { number: "55", x: 150, y: 100 },
      { number: "54", x: 190, y: 100 },
      { number: "53", x: 230, y: 100 },
      { number: "52", x: 270, y: 100 },
      { number: "51", x: 310, y: 100 },
      { number: "61", x: 340, y: 100 },
      { number: "62", x: 380, y: 100 },
      { number: "63", x: 420, y: 100 },
      { number: "64", x: 460, y: 100 },
      { number: "65", x: 500, y: 100 },

      // Lower jaw (right to left)
      { number: "85", x: 150, y: 200 },
      { number: "84", x: 190, y: 200 },
      { number: "83", x: 230, y: 200 },
      { number: "82", x: 270, y: 200 },
      { number: "81", x: 310, y: 200 },
      { number: "71", x: 340, y: 200 },
      { number: "72", x: 380, y: 200 },
      { number: "73", x: 420, y: 200 },
      { number: "74", x: 460, y: 200 },
      { number: "75", x: 500, y: 200 },
    ];
  };

  const handleAddAnnotation = async (values: DentalChartForm) => {
    try {
      const result = await createDentalChart({
        ...values,
        patientId,
      });
      if (result.success) {
        toast.success("Tooth annotation added successfully.");
        fetchAnnotations();
        setIsAnnotationDialogOpen(false);
      } else {
        toast.error(result.error || "Failed to add annotation.");
      }
    } catch (error) {
      console.error("Error adding annotation:", error);
      toast.error("Failed to add annotation.");
    }
  };

  const handleEditAnnotation = async (values: DentalChartForm) => {
    if (!currentAnnotation) return;
    try {
      const result = await updateDentalChart(currentAnnotation.id, values);
      if (result.success) {
        toast.success("Tooth annotation updated successfully.");
        fetchAnnotations();
        setIsEditDialogOpen(false);
      } else {
        toast.error(result.error || "Failed to update annotation.");
      }
    } catch (error) {
      console.error("Error updating annotation:", error);
      toast.error("Failed to update annotation.");
    }
  };

  const handleDeleteAnnotation = async (annotationId: string) => {
    try {
      const result = await deleteDentalChart(annotationId);
      if (result.success) {
        toast.success("Tooth annotation deleted successfully.");
        fetchAnnotations();
      } else {
        toast.error(result.error || "Failed to delete annotation.");
      }
    } catch (error) {
      console.error("Error deleting annotation:", error);
      toast.error("Failed to delete annotation.");
    }
  };

  const clearAllAnnotations = () => {
    // This would typically involve a bulk delete server action
    // For now, we'll just clear the local state and inform the user
    setAnnotations([]);
    toast.success(
      "All annotations cleared (local only). Please implement bulk delete server action."
    );
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Chart Type Indicator */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium">
                  {isAdult ? "Adult Dentition" : "Primary Dentition"}
                </p>
                <p className="text-sm text-gray-500">
                  Patient age: {patientAge} years
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={clearAllAnnotations}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Clear All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dental Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="mr-2 h-5 w-5" />
            Interactive Dental Chart
          </CardTitle>
          <CardDescription>
            Click on any tooth to add or edit annotations. Colors indicate
            different conditions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div ref={canvasRef} className="w-full" />
        </CardContent>
      </Card>

      {/* Annotations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tooth Annotations</CardTitle>
          <CardDescription>
            Detailed view of all tooth conditions and treatments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {annotations.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No annotations
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Click on teeth in the chart above to add annotations.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tooth #</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {annotations.map((annotation) => {
                  const conditionLabel =
                    conditionOptions.find(
                      (c) => c.value === annotation.condition
                    )?.label || annotation.condition;
                  const conditionColor =
                    conditionOptions.find(
                      (c) => c.value === annotation.condition
                    )?.color || "#ffffff";
                  return (
                    <TableRow key={annotation.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: conditionColor }}
                          />
                          <span className="font-medium">
                            {annotation.toothNumber}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{conditionLabel}</div>
                        </div>
                      </TableCell>
                      <TableCell>{annotation.notes || "—"}</TableCell>
                      <TableCell>{formatDate(annotation.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setCurrentAnnotation(annotation);
                                form.reset({
                                  toothNumber: annotation.toothNumber,
                                  surface: annotation.surface || "",
                                  condition: annotation.condition,
                                  notes: annotation.notes || "",
                                });
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleDeleteAnnotation(annotation.id)
                              }
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Annotation Dialog */}
      <Dialog
        open={isAnnotationDialogOpen}
        onOpenChange={setIsAnnotationDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Annotate Tooth {selectedTooth}</DialogTitle>
            <DialogDescription>
              Add condition and treatment information for this tooth.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleAddAnnotation)}
              className="grid gap-4 py-4"
            >
              <FormField
                control={form.control}
                name="condition"
                render={({ field }) => (
                  <FormItem className="grid gap-2">
                    <FormLabel>Condition</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        {conditionOptions.map((condition) => (
                          <SelectItem
                            key={condition.value}
                            value={condition.value}
                          >
                            <div className="flex items-center space-x-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: condition.color }}
                              />
                              <span>{condition.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="surface"
                render={({ field }) => (
                  <FormItem className="grid gap-2">
                    <FormLabel>Surface (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Occlusal, Mesial" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="grid gap-2">
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter additional notes"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" />
                  Save Annotation
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Annotation Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              Edit Tooth {currentAnnotation?.toothNumber}
            </DialogTitle>
            <DialogDescription>
              Update condition and treatment information for this tooth.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleEditAnnotation)}
              className="grid gap-4 py-4"
            >
              <FormField
                control={form.control}
                name="condition"
                render={({ field }) => (
                  <FormItem className="grid gap-2">
                    <FormLabel>Condition</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        {conditionOptions.map((condition) => (
                          <SelectItem
                            key={condition.value}
                            value={condition.value}
                          >
                            <div className="flex items-center space-x-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: condition.color }}
                              />
                              <span>{condition.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="surface"
                render={({ field }) => (
                  <FormItem className="grid gap-2">
                    <FormLabel>Surface (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Occlusal, Mesial" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="grid gap-2">
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter additional notes"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Update Annotation</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
