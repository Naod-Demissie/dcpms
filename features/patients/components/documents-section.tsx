"use client";

import { useState, useEffect, useRef } from "react";
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
  FileText,
  Download,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useForm, UseFormReturn, ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Document } from "@/server/documents";
import {
  createDocument,
  getDocumentsByPatient,
  updateDocument,
  deleteDocument,
} from "@/server/documents";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const formSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  fileType: z.string().optional(),
  fileUrl: z.string().optional(),
  notes: z.string().optional(),
});

type DocumentForm = z.infer<typeof formSchema>;

interface DocumentsSectionProps {
  patientId: string;
}

export function DocumentsSection({ patientId }: DocumentsSectionProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<DocumentForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fileName: "",
      fileType: "",
      fileUrl: "",
      notes: "",
    },
  }) as unknown as UseFormReturn<DocumentForm>;

  const fetchDocuments = async () => {
    const result = await getDocumentsByPatient(patientId);
    if (result.success && result.data) {
      setDocuments(result.data);
    } else {
      toast.error(result.error || "Failed to fetch documents");
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [patientId]);

  // File upload helper functions
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    form.setValue("fileName", file.name);
    form.setValue("fileType", file.type);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const resetUploadForm = () => {
    setSelectedFile(null);
    form.reset({
      fileName: "",
      fileType: "",
      fileUrl: "",
      notes: "",
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleViewDocument = (document: Document) => {
    setCurrentDocument(document);
    setIsViewDialogOpen(true);
  };

  const handleDownloadDocument = (doc: Document) => {
    try {
      // Create a download link for base64 data
      const link = window.document.createElement("a");
      link.href = doc.fileUrl;
      link.download = doc.fileName;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      toast.success("Download started");
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Failed to download document");
    }
  };

  const handleAddDocument = async (values: DocumentForm) => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }

    setIsUploading(true);
    try {
      // Convert file to base64 for storage
      const base64Data = await convertFileToBase64(selectedFile);

      // Create document record with base64 data as URL
      const result = await createDocument({
        fileName: values.fileName,
        fileType: selectedFile.type,
        fileUrl: base64Data, // Store base64 data as URL
        notes: values.notes,
        patientId,
      });

      if (result.success) {
        toast.success("Document uploaded successfully.");
        fetchDocuments();
        setIsAddDialogOpen(false);
        resetUploadForm();
      } else {
        toast.error(result.error || "Failed to upload document.");
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error("Failed to upload document.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditDocument = async (values: DocumentForm) => {
    if (!currentDocument) return;

    setIsUploading(true);
    try {
      let updateData = { ...values };

      // If a new file is selected, convert it to base64
      if (selectedFile) {
        const base64Data = await convertFileToBase64(selectedFile);
        updateData.fileUrl = base64Data;
        updateData.fileType = selectedFile.type;
      }

      const result = await updateDocument(currentDocument.id, updateData);
      if (result.success) {
        toast.success("Document updated successfully.");
        fetchDocuments();
        setIsEditDialogOpen(false);
        resetUploadForm();
      } else {
        toast.error(result.error || "Failed to update document.");
      }
    } catch (error) {
      console.error("Error updating document:", error);
      toast.error("Failed to update document.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const result = await deleteDocument(documentId);
      if (result.success) {
        toast.success("Document deleted successfully.");
        fetchDocuments();
      } else {
        toast.error(result.error || "Failed to delete document.");
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document.");
    }
  };

  const openEditDialog = (document: Document) => {
    setCurrentDocument(document);
    setSelectedFile(null); // Reset selected file
    form.reset({
      fileName: document.fileName,
      fileType: document.fileType,
      fileUrl: document.fileUrl,
      notes: document.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) {
      return "🖼️";
    } else if (type === "application/pdf") {
      return "📄";
    } else if (type.includes("word")) {
      return "📝";
    } else if (type.includes("video")) {
      return "🎥";
    } else if (type.includes("audio")) {
      return "🎵";
    } else {
      return "📁";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Documents
            </CardTitle>
            <CardDescription>
              Patient documents, images, and files
            </CardDescription>
          </div>
          <Dialog
            open={isAddDialogOpen}
            onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              if (open) {
                resetUploadForm(); // Reset form when dialog opens
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Upload New Document</DialogTitle>
                <DialogDescription>
                  Add a new document to the patient's file. Drag and drop or
                  click to browse.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleAddDocument)}
                  className="space-y-4 p-1"
                >
                  {/* File Drop Zone */}
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                      isDragOver
                        ? "border-primary bg-primary/5"
                        : selectedFile
                          ? "border-green-300 bg-green-50"
                          : "border-gray-200"
                    }`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {selectedFile ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center space-x-2">
                          <span className="text-2xl">
                            {getFileIcon(selectedFile.type)}
                          </span>
                          <div className="text-left">
                            <p className="font-medium text-green-700">
                              {selectedFile.name}
                            </p>
                            <p className="text-sm text-green-600">
                              {formatFileSize(selectedFile.size)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFile(null);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <FileText className="w-12 h-12 mx-auto text-gray-400" />
                        <p className="text-sm font-medium text-gray-500">
                          Drag and drop a file or click to browse
                        </p>
                        <p className="text-xs text-gray-500">
                          PDF, image, video, or audio files
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*,application/pdf,.doc,.docx,video/*,audio/*"
                    onChange={handleFileInputChange}
                  />

                  <FormField
                    control={form.control}
                    name="fileName"
                    render={({
                      field,
                    }: {
                      field: ControllerRenderProps<DocumentForm>;
                    }) => (
                      <FormItem>
                        <FormLabel>Document Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter document name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter document description"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        resetUploadForm();
                        setIsAddDialogOpen(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={!selectedFile || isUploading}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {isUploading ? "Uploading..." : "Upload Document"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No documents
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by uploading a document.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((document) => (
                <TableRow key={document.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">
                        {getFileIcon(document.fileType)}
                      </span>
                      <div>
                        <div className="font-medium">{document.fileName}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{document.fileType}</TableCell>
                  <TableCell>{formatDate(document.uploadDate)}</TableCell>
                  <TableCell>{document.notes || "—"}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleViewDocument(document)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDownloadDocument(document)}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openEditDialog(document)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteDocument(document.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Edit Document Dialog */}
        <Dialog
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) {
              resetUploadForm();
            }
          }}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Document</DialogTitle>
              <DialogDescription>
                Update document information. Upload a new file to replace the
                existing one.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleEditDocument)}
                className="space-y-4 p-1"
              >
                {/* File Drop Zone for Edit */}
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                    isDragOver
                      ? "border-primary bg-primary/5"
                      : selectedFile
                        ? "border-green-300 bg-green-50"
                        : "border-gray-200"
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => editFileInputRef.current?.click()}
                >
                  {selectedFile ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-2xl">
                          {getFileIcon(selectedFile.type)}
                        </span>
                        <div className="text-left">
                          <p className="font-medium text-green-700">
                            {selectedFile.name}
                          </p>
                          <p className="text-sm text-green-600">
                            {formatFileSize(selectedFile.size)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <FileText className="w-12 h-12 mx-auto text-gray-400" />
                      <p className="text-sm font-medium text-gray-500">
                        Drag and drop a new file or click to browse
                      </p>
                      <p className="text-xs text-gray-500">
                        Leave empty to keep existing file
                      </p>
                    </div>
                  )}
                </div>

                {/* Hidden File Input for Edit */}
                <input
                  ref={editFileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*,application/pdf,.doc,.docx,video/*,audio/*"
                  onChange={handleFileInputChange}
                />
                <FormField
                  control={form.control}
                  name="fileName"
                  render={({ field }) => (
                    <FormItem className="grid gap-2">
                      <FormLabel>Document Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter document name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter document description"
                          rows={3}
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      resetUploadForm();
                      setIsEditDialogOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isUploading}>
                    <Upload className="mr-2 h-4 w-4" />
                    {isUploading ? "Updating..." : "Update Document"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* View Document Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <span className="text-lg">
                  {currentDocument && getFileIcon(currentDocument.fileType)}
                </span>
                <span>{currentDocument?.fileName}</span>
              </DialogTitle>
              <DialogDescription>
                Document preview and download
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {currentDocument && (
                <>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Type:</span>{" "}
                      {currentDocument.fileType}
                    </div>
                    <div>
                      <span className="font-medium">Uploaded:</span>{" "}
                      {formatDate(currentDocument.uploadDate)}
                    </div>
                    {currentDocument.notes && (
                      <div className="col-span-2">
                        <span className="font-medium">Notes:</span>{" "}
                        {currentDocument.notes}
                      </div>
                    )}
                  </div>

                  <div className="border rounded-lg p-4 bg-gray-50 min-h-[300px] flex items-center justify-center">
                    {currentDocument.fileType.startsWith("image/") ? (
                      <img
                        src={currentDocument.fileUrl}
                        alt={currentDocument.fileName}
                        className="max-w-full max-h-[400px] object-contain"
                      />
                    ) : currentDocument.fileType === "application/pdf" ? (
                      <iframe
                        src={currentDocument.fileUrl}
                        className="w-full h-[400px] border-0"
                        title={currentDocument.fileName}
                      />
                    ) : (
                      <div className="text-center space-y-4">
                        <span className="text-6xl">
                          {getFileIcon(currentDocument.fileType)}
                        </span>
                        <p className="text-gray-600">
                          Preview not available for this file type
                        </p>
                        <Button
                          onClick={() =>
                            handleDownloadDocument(currentDocument)
                          }
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download to view
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsViewDialogOpen(false)}
              >
                Close
              </Button>
              {currentDocument && (
                <Button onClick={() => handleDownloadDocument(currentDocument)}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
