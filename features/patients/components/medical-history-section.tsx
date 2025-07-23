"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Heart,
  AlertTriangle,
  Pill,
  Edit,
  Trash2,
  MoreHorizontal,
  Activity,
} from "lucide-react";
import { toast } from "sonner";

interface MedicalHistory {
  id: string;
  type: "allergy" | "condition" | "medication" | "surgery";
  name: string;
  description?: string;
  severity?: "low" | "medium" | "high";
  status: "active" | "inactive" | "resolved";
  startDate: Date;
  endDate?: Date;
  notes?: string;
  recordedBy: string;
  recordedAt: Date;
}

interface MedicalHistorySectionProps {
  patientId: string;
}

export function MedicalHistorySection({
  patientId,
}: MedicalHistorySectionProps) {
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory[]>([
    {
      id: "1",
      type: "allergy",
      name: "Penicillin",
      description: "Severe allergic reaction",
      severity: "high",
      status: "active",
      startDate: new Date("2020-03-15"),
      notes: "Patient experienced rash and difficulty breathing",
      recordedBy: "Dr. Smith",
      recordedAt: new Date("2020-03-15"),
    },
    {
      id: "2",
      type: "condition",
      name: "Hypertension",
      description: "High blood pressure",
      severity: "medium",
      status: "active",
      startDate: new Date("2019-08-20"),
      notes: "Controlled with medication",
      recordedBy: "Dr. Johnson",
      recordedAt: new Date("2019-08-20"),
    },
    {
      id: "3",
      type: "medication",
      name: "Lisinopril 10mg",
      description: "Blood pressure medication",
      status: "active",
      startDate: new Date("2019-08-25"),
      notes: "Take once daily in the morning",
      recordedBy: "Dr. Johnson",
      recordedAt: new Date("2019-08-25"),
    },
    {
      id: "4",
      type: "surgery",
      name: "Wisdom Tooth Extraction",
      description: "Removal of impacted wisdom teeth",
      status: "resolved",
      startDate: new Date("2018-06-10"),
      endDate: new Date("2018-06-10"),
      notes: "No complications, healed well",
      recordedBy: "Dr. Brown",
      recordedAt: new Date("2018-06-10"),
    },
  ]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<MedicalHistory | null>(
    null
  );
  const [formData, setFormData] = useState({
    type: "condition" as MedicalHistory["type"],
    name: "",
    description: "",
    severity: "medium" as MedicalHistory["severity"],
    status: "active" as MedicalHistory["status"],
    startDate: "",
    endDate: "",
    notes: "",
  });

  const handleAddHistory = () => {
    if (!formData.name || !formData.startDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const newHistory: MedicalHistory = {
      id: Date.now().toString(),
      type: formData.type,
      name: formData.name,
      description: formData.description,
      severity:
        formData.type === "allergy" || formData.type === "condition"
          ? formData.severity
          : undefined,
      status: formData.status,
      startDate: new Date(formData.startDate),
      endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      notes: formData.notes,
      recordedBy: "Current User",
      recordedAt: new Date(),
    };

    setMedicalHistory([...medicalHistory, newHistory]);
    setIsAddDialogOpen(false);
    resetForm();

    toast({
      title: "Success",
      description: "Medical history record added successfully.",
    });
  };

  const handleEditHistory = () => {
    if (!selectedHistory || !formData.name || !formData.startDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setMedicalHistory(
      medicalHistory.map((history) =>
        history.id === selectedHistory.id
          ? {
              ...history,
              type: formData.type,
              name: formData.name,
              description: formData.description,
              severity:
                formData.type === "allergy" || formData.type === "condition"
                  ? formData.severity
                  : undefined,
              status: formData.status,
              startDate: new Date(formData.startDate),
              endDate: formData.endDate
                ? new Date(formData.endDate)
                : undefined,
              notes: formData.notes,
            }
          : history
      )
    );

    setIsEditDialogOpen(false);
    setSelectedHistory(null);
    resetForm();

    toast({
      title: "Success",
      description: "Medical history record updated successfully.",
    });
  };

  const handleDeleteHistory = (historyId: string) => {
    setMedicalHistory(
      medicalHistory.filter((history) => history.id !== historyId)
    );
    toast({
      title: "Success",
      description: "Medical history record deleted successfully.",
    });
  };

  const openEditDialog = (history: MedicalHistory) => {
    setSelectedHistory(history);
    setFormData({
      type: history.type,
      name: history.name,
      description: history.description || "",
      severity: history.severity || "medium",
      status: history.status,
      startDate: history.startDate.toISOString().split("T")[0],
      endDate: history.endDate
        ? history.endDate.toISOString().split("T")[0]
        : "",
      notes: history.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      type: "condition",
      name: "",
      description: "",
      severity: "medium",
      status: "active",
      startDate: "",
      endDate: "",
      notes: "",
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getTypeIcon = (type: MedicalHistory["type"]) => {
    switch (type) {
      case "allergy":
        return <AlertTriangle className="h-4 w-4" />;
      case "condition":
        return <Heart className="h-4 w-4" />;
      case "medication":
        return <Pill className="h-4 w-4" />;
      case "surgery":
        return <Activity className="h-4 w-4" />;
      default:
        return <Heart className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: MedicalHistory["type"]) => {
    switch (type) {
      case "allergy":
        return "bg-red-100 text-red-800";
      case "condition":
        return "bg-blue-100 text-blue-800";
      case "medication":
        return "bg-green-100 text-green-800";
      case "surgery":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "resolved":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const groupedHistory = medicalHistory.reduce(
    (acc, history) => {
      if (!acc[history.type]) {
        acc[history.type] = [];
      }
      acc[history.type].push(history);
      return acc;
    },
    {} as Record<string, MedicalHistory[]>
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm font-medium">Allergies</p>
                <p className="text-2xl font-bold">
                  {groupedHistory.allergy?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Heart className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Conditions</p>
                <p className="text-2xl font-bold">
                  {groupedHistory.condition?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Pill className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Medications</p>
                <p className="text-2xl font-bold">
                  {groupedHistory.medication?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Surgeries</p>
                <p className="text-2xl font-bold">
                  {groupedHistory.surgery?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Medical History Records */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Heart className="mr-2 h-5 w-5" />
                Medical History
              </CardTitle>
              <CardDescription>
                Complete medical history including allergies, conditions,
                medications, and surgeries
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Record
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add Medical History Record</DialogTitle>
                  <DialogDescription>
                    Add a new medical history record for the patient.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: MedicalHistory["type"]) =>
                        setFormData({ ...formData, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="allergy">Allergy</SelectItem>
                        <SelectItem value="condition">
                          Medical Condition
                        </SelectItem>
                        <SelectItem value="medication">Medication</SelectItem>
                        <SelectItem value="surgery">
                          Surgery/Procedure
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Enter name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Enter description"
                    />
                  </div>
                  {(formData.type === "allergy" ||
                    formData.type === "condition") && (
                    <div className="grid gap-2">
                      <Label htmlFor="severity">Severity</Label>
                      <Select
                        value={formData.severity}
                        onValueChange={(value: MedicalHistory["severity"]) =>
                          setFormData({ ...formData, severity: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: MedicalHistory["status"]) =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            startDate: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="endDate">End Date (Optional)</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) =>
                          setFormData({ ...formData, endDate: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      placeholder="Enter additional notes"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleAddHistory}>
                    Add Record
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {medicalHistory.length === 0 ? (
            <div className="text-center py-8">
              <Heart className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No medical history
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding a medical record.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedHistory).map(([type, records]) => (
                <div key={type}>
                  <h3 className="text-lg font-semibold mb-3 capitalize flex items-center">
                    {getTypeIcon(type as MedicalHistory["type"])}
                    <span className="ml-2">
                      {type === "allergy"
                        ? "Allergies"
                        : type === "condition"
                          ? "Medical Conditions"
                          : type === "medication"
                            ? "Medications"
                            : "Surgeries & Procedures"}
                    </span>
                  </h3>
                  <div className="space-y-3">
                    {records.map((history) => (
                      <Card
                        key={history.id}
                        className="border-l-4 border-l-blue-500"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h4 className="font-semibold">
                                  {history.name}
                                </h4>
                                <Badge className={getTypeColor(history.type)}>
                                  {history.type}
                                </Badge>
                                <Badge
                                  className={getStatusColor(history.status)}
                                >
                                  {history.status}
                                </Badge>
                                {history.severity && (
                                  <Badge
                                    className={getSeverityColor(
                                      history.severity
                                    )}
                                  >
                                    {history.severity} severity
                                  </Badge>
                                )}
                              </div>
                              {history.description && (
                                <p className="text-sm text-gray-600 mb-2">
                                  {history.description}
                                </p>
                              )}
                              <div className="text-xs text-gray-500 space-y-1">
                                <p>
                                  <strong>Date:</strong>{" "}
                                  {formatDate(history.startDate)}
                                  {history.endDate &&
                                    ` - ${formatDate(history.endDate)}`}
                                </p>
                                <p>
                                  <strong>Recorded by:</strong>{" "}
                                  {history.recordedBy}
                                </p>
                                {history.notes && (
                                  <p>
                                    <strong>Notes:</strong> {history.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => openEditDialog(history)}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleDeleteHistory(history.id)
                                  }
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {type !==
                    Object.keys(groupedHistory)[
                      Object.keys(groupedHistory).length - 1
                    ] && <Separator className="mt-6" />}
                </div>
              ))}
            </div>
          )}

          {/* Edit Medical History Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Edit Medical History Record</DialogTitle>
                <DialogDescription>
                  Update the medical history record.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: MedicalHistory["type"]) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="allergy">Allergy</SelectItem>
                      <SelectItem value="condition">
                        Medical Condition
                      </SelectItem>
                      <SelectItem value="medication">Medication</SelectItem>
                      <SelectItem value="surgery">Surgery/Procedure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Input
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Enter description"
                  />
                </div>
                {(formData.type === "allergy" ||
                  formData.type === "condition") && (
                  <div className="grid gap-2">
                    <Label htmlFor="edit-severity">Severity</Label>
                    <Select
                      value={formData.severity}
                      onValueChange={(value: MedicalHistory["severity"]) =>
                        setFormData({ ...formData, severity: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: MedicalHistory["status"]) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-startDate">Start Date</Label>
                    <Input
                      id="edit-startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-endDate">End Date (Optional)</Label>
                    <Input
                      id="edit-endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea
                    id="edit-notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Enter additional notes"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleEditHistory}>
                  Update Record
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
