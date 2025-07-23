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
  Clock,
  User,
  ArrowUp,
  ArrowDown,
  Edit,
  Trash2,
  MoreHorizontal,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

interface QueueEntry {
  id: string;
  position: number;
  priority: "low" | "normal" | "high" | "urgent";
  reason: string;
  estimatedDuration: number;
  notes?: string;
  status: "waiting" | "in_progress" | "completed" | "cancelled";
  addedAt: Date;
  addedBy: string;
}

interface QueueSectionProps {
  patientId: string;
}

export function QueueSection({ patientId }: QueueSectionProps) {
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([
    {
      id: "1",
      position: 1,
      priority: "high",
      reason: "Emergency - Severe tooth pain",
      estimatedDuration: 30,
      notes: "Patient in severe pain, needs immediate attention",
      status: "waiting",
      addedAt: new Date("2024-01-15T09:00:00"),
      addedBy: "Reception",
    },
    {
      id: "2",
      position: 2,
      priority: "normal",
      reason: "Regular checkup",
      estimatedDuration: 45,
      notes: "Routine cleaning and examination",
      status: "waiting",
      addedAt: new Date("2024-01-15T09:15:00"),
      addedBy: "Reception",
    },
  ]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<QueueEntry | null>(null);
  const [formData, setFormData] = useState({
    priority: "normal" as QueueEntry["priority"],
    reason: "",
    estimatedDuration: 30,
    notes: "",
  });

  const priorityOptions = [
    { value: "low", label: "Low", color: "bg-gray-100 text-gray-800" },
    { value: "normal", label: "Normal", color: "bg-blue-100 text-blue-800" },
    { value: "high", label: "High", color: "bg-orange-100 text-orange-800" },
    { value: "urgent", label: "Urgent", color: "bg-red-100 text-red-800" },
  ];

  const statusOptions = [
    {
      value: "waiting",
      label: "Waiting",
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      value: "in_progress",
      label: "In Progress",
      color: "bg-blue-100 text-blue-800",
    },
    {
      value: "completed",
      label: "Completed",
      color: "bg-green-100 text-green-800",
    },
    {
      value: "cancelled",
      label: "Cancelled",
      color: "bg-red-100 text-red-800",
    },
  ];

  const handleAddToQueue = () => {
    if (!formData.reason) {
      toast.error("Please provide a reason for the queue entry.");
      return;
    }

    const newEntry: QueueEntry = {
      id: Date.now().toString(),
      position: queueEntries.length + 1,
      priority: formData.priority,
      reason: formData.reason,
      estimatedDuration: formData.estimatedDuration,
      notes: formData.notes,
      status: "waiting",
      addedAt: new Date(),
      addedBy: "Current User",
    };

    setQueueEntries([...queueEntries, newEntry]);
    setIsAddDialogOpen(false);
    resetForm();
    toast.success("Patient added to queue successfully.");
  };

  const handleEditEntry = () => {
    if (!selectedEntry || !formData.reason) {
      toast.error("Please provide a reason for the queue entry.");

      return;
    }

    setQueueEntries(
      queueEntries.map((entry) =>
        entry.id === selectedEntry.id
          ? {
              ...entry,
              priority: formData.priority,
              reason: formData.reason,
              estimatedDuration: formData.estimatedDuration,
              notes: formData.notes,
            }
          : entry
      )
    );

    setIsEditDialogOpen(false);
    setSelectedEntry(null);
    resetForm();
    toast.success("Queue entry updated successfully.");
  };

  const handleDeleteEntry = (entryId: string) => {
    setQueueEntries(queueEntries.filter((entry) => entry.id !== entryId));
    toast.success("Queue entry updated successfully.");
  };

  const handleStatusChange = (
    entryId: string,
    newStatus: QueueEntry["status"]
  ) => {
    setQueueEntries(
      queueEntries.map((entry) =>
        entry.id === entryId ? { ...entry, status: newStatus } : entry
      )
    );

    toast.success(`Queue entry status updated to ${newStatus}.`);
  };

  const movePriority = (entryId: string, direction: "up" | "down") => {
    const entryIndex = queueEntries.findIndex((entry) => entry.id === entryId);
    if (entryIndex === -1) return;

    const newEntries = [...queueEntries];
    const targetIndex = direction === "up" ? entryIndex - 1 : entryIndex + 1;

    if (targetIndex >= 0 && targetIndex < newEntries.length) {
      // Swap positions
      [newEntries[entryIndex], newEntries[targetIndex]] = [
        newEntries[targetIndex],
        newEntries[entryIndex],
      ];

      // Update position numbers
      newEntries.forEach((entry, index) => {
        entry.position = index + 1;
      });

      setQueueEntries(newEntries);
      toast.success(`Queue position updated.`);
    }
  };

  const openEditDialog = (entry: QueueEntry) => {
    setSelectedEntry(entry);
    setFormData({
      priority: entry.priority,
      reason: entry.reason,
      estimatedDuration: entry.estimatedDuration,
      notes: entry.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      priority: "normal",
      reason: "",
      estimatedDuration: 30,
      notes: "",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPriorityColor = (priority: string) => {
    const option = priorityOptions.find((p) => p.value === priority);
    return option?.color || "bg-gray-100 text-gray-800";
  };

  const getStatusColor = (status: string) => {
    const option = statusOptions.find((s) => s.value === status);
    return option?.color || "bg-gray-100 text-gray-800";
  };

  const getTotalWaitTime = () => {
    return queueEntries
      .filter((entry) => entry.status === "waiting")
      .reduce((total, entry) => total + entry.estimatedDuration, 0);
  };

  const getAverageWaitTime = () => {
    const waitingEntries = queueEntries.filter(
      (entry) => entry.status === "waiting"
    );
    if (waitingEntries.length === 0) return 0;
    return Math.round(getTotalWaitTime() / waitingEntries.length);
  };

  return (
    <div className="space-y-6">
      {/* Queue Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Queue Position</p>
                <p className="text-2xl font-bold">
                  {queueEntries.find((e) => e.status === "waiting")?.position ||
                    "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Total Wait Time</p>
                <p className="text-2xl font-bold">{getTotalWaitTime()} min</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Avg. Duration</p>
                <p className="text-2xl font-bold">{getAverageWaitTime()} min</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Queue Entries</p>
                <p className="text-2xl font-bold">{queueEntries.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queue Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Patient Queue
              </CardTitle>
              <CardDescription>
                Manage patient queue entries and priorities
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add to Queue
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add Patient to Queue</DialogTitle>
                  <DialogDescription>
                    Add this patient to the waiting queue.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value: QueueEntry["priority"]) =>
                        setFormData({ ...formData, priority: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityOptions.map((priority) => (
                          <SelectItem
                            key={priority.value}
                            value={priority.value}
                          >
                            {priority.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="reason">Reason</Label>
                    <Input
                      id="reason"
                      value={formData.reason}
                      onChange={(e) =>
                        setFormData({ ...formData, reason: e.target.value })
                      }
                      placeholder="Enter reason for visit"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="duration">
                      Estimated Duration (minutes)
                    </Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.estimatedDuration}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          estimatedDuration: parseInt(e.target.value) || 30,
                        })
                      }
                      placeholder="30"
                      min="5"
                      max="180"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
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
                  <Button type="submit" onClick={handleAddToQueue}>
                    Add to Queue
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {queueEntries.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No queue entries
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Add this patient to the queue to get started.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Position</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queueEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">#{entry.position}</span>
                        <div className="flex flex-col space-y-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0"
                            onClick={() => movePriority(entry.id, "up")}
                            disabled={entry.position === 1}
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0"
                            onClick={() => movePriority(entry.id, "down")}
                            disabled={entry.position === queueEntries.length}
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(entry.priority)}>
                        {entry.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{entry.reason}</div>
                        {entry.notes && (
                          <div className="text-sm text-gray-500">
                            {entry.notes}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{entry.estimatedDuration} min</TableCell>
                    <TableCell>
                      <Select
                        value={entry.status}
                        onValueChange={(value: QueueEntry["status"]) =>
                          handleStatusChange(entry.id, value)
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{formatTime(entry.addedAt)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => openEditDialog(entry)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Edit Queue Entry Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Queue Entry</DialogTitle>
                <DialogDescription>
                  Update the queue entry details.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: QueueEntry["priority"]) =>
                      setFormData({ ...formData, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-reason">Reason</Label>
                  <Input
                    id="edit-reason"
                    value={formData.reason}
                    onChange={(e) =>
                      setFormData({ ...formData, reason: e.target.value })
                    }
                    placeholder="Enter reason for visit"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-duration">
                    Estimated Duration (minutes)
                  </Label>
                  <Input
                    id="edit-duration"
                    type="number"
                    value={formData.estimatedDuration}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estimatedDuration: parseInt(e.target.value) || 30,
                      })
                    }
                    placeholder="30"
                    min="5"
                    max="180"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-notes">Notes (Optional)</Label>
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
                <Button type="submit" onClick={handleEditEntry}>
                  Update Entry
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
