"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Plus, Pill, Calendar, User, Download, Printer } from "lucide-react";
import { PrescriptionDialog } from "./prescription-dialog";
import { PrescriptionCellAction } from "./prescription-cell-action";
import { PrescriptionDeleteDialog } from "./prescription-delete-dialog";
import { getPrescriptionsByPatient } from "@/server/prescriptions";
import { generatePrescriptionPDF, downloadPDF, printPDF } from "@/lib/pdf-generator";
import { format } from "date-fns";
import { toast } from "sonner";
import { getPatientById } from "@/server/patients";

interface PrescriptionsSectionProps {
  patientId: string;
}

export function PrescriptionsSection({ patientId }: PrescriptionsSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState<any>(null);
  const [deletingPrescription, setDeletingPrescription] = useState<any>(null);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [pdfModal, setPdfModal] = useState<{ open: boolean; pdfDataUri: string | null }>({ open: false, pdfDataUri: null });
  const [loading, setLoading] = useState(false);
  const [patientInfo, setPatientInfo] = useState<any>(null);

  const fetchPatientInfo = async () => {
    try {
      const result = await getPatientById(patientId);
      if (result.success && result.data) {
        setPatientInfo(result.data);
      } else {
        setPatientInfo(null);
      }
    } catch (error) {
      setPatientInfo(null);
    }
  };

  const fetchPrescriptions = async () => {
    setLoading(true);
    const result = await getPrescriptionsByPatient(patientId);
    if (result.success && result.data) {
      setPrescriptions(result.data);
    } else {
      setPrescriptions([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPatientInfo();
    fetchPrescriptions();
  }, [patientId, isDialogOpen]);

  const handleEdit = (prescription: any) => {
    setEditingPrescription(prescription);
    setIsDialogOpen(true);
  };

  const handleDelete = (prescription: any) => {
    setDeletingPrescription(prescription);
  };

  const handleEditSuccess = () => {
    setEditingPrescription(null);
    fetchPrescriptions();
  };

  const handlePrescriptionAdded = () => {
    fetchPrescriptions();
  };

  const handleDeleteSuccess = () => {
    setDeletingPrescription(null);
    fetchPrescriptions();
  };

  const handleViewPDF = async (prescription: any) => {
    try {
      // Use loaded patient info
      const patient = patientInfo;
      const patientAge = patient?.dateOfBirth ? 
        new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear() : 0;
      // Map details to match PDF generator expectations
      const medications = (prescription.details || []).map((med: any) => ({
        name: med.medication, // map 'medication' to 'name'
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
        instructions: med.instructions,
      }));
      const pdfData = {
        id: prescription.id,
        patientName: (patient?.firstName || '') + ' ' + (patient?.lastName || ''),
        patientAge: patientAge,
        patientGender: patient?.gender || '',
        date: new Date(prescription.issuedAt),
        doctorName: prescription.prescribedBy?.name || 'Unknown Doctor',
        doctorSpecialization: prescription.prescribedBy?.role || '',
        medications, // use mapped medications
        diagnosis: '',
        notes: '',
        clinicName: process.env.NEXT_PUBLIC_CLINIC_NAME || 'Dental Clinic',
        clinicAddress: process.env.NEXT_PUBLIC_CLINIC_ADDRESS || 'Clinic Address',
        clinicPhone: process.env.NEXT_PUBLIC_CLINIC_PHONE || 'Clinic Phone',
      };
      const pdfDataUri = await generatePrescriptionPDF(pdfData);
      setPdfModal({ open: true, pdfDataUri });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg">Prescriptions</CardTitle>
          <CardDescription>Manage patient prescriptions</CardDescription>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Prescription
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="ml-2 text-sm text-muted-foreground">Loading prescriptions...</span>
            </div>
          ) : prescriptions.length === 0 ? (
            <div className="text-center py-8">
              <Pill className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">No prescriptions found</p>
              <p className="text-xs text-muted-foreground mt-1">Add a prescription to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {prescriptions.map((prescription) => (
                <div 
                  key={prescription.id} 
                  className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                      <Pill className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-primary">{prescription.id || 'Unknown'}</span>
                        <Badge variant="secondary" className="text-xs">
                          {prescription.details?.length || 0} medication{(prescription.details?.length || 0) !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(prescription.issuedAt), 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>Dr. {prescription.prescribedBy?.name || 'Unknown'}</span>
                        </div>
                        {/* Show patient info if loaded */}
                        {patientInfo && (
                          <div className="flex items-center space-x-1">
                            <span className="font-semibold">{patientInfo.firstName} {patientInfo.lastName}</span>
                            <span className="text-xs">({patientInfo.gender}, Age: {patientInfo.dateOfBirth ? new Date().getFullYear() - new Date(patientInfo.dateOfBirth).getFullYear() : 'N/A'})</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <PrescriptionCellAction
                    prescription={{ ...prescription, patient: patientInfo }}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      
      {/* Prescription Dialog */}
      <PrescriptionDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingPrescription(null);
        }}
        patientId={patientId}
        editingPrescription={editingPrescription}
        onEditSuccess={handleEditSuccess}
        onPrescriptionAdded={handlePrescriptionAdded}
      />
      
      {/* Delete Dialog */}
      {deletingPrescription && (
        <PrescriptionDeleteDialog
          prescription={deletingPrescription}
          open={!!deletingPrescription}
          onOpenChange={(open) => !open && setDeletingPrescription(null)}
          onDeleteSuccess={handleDeleteSuccess}
        />
      )}
      
      {/* PDF Modal */}
      <Dialog open={pdfModal.open} onOpenChange={open => setPdfModal({ open, pdfDataUri: open ? pdfModal.pdfDataUri : null })}>
        <DialogContent className="max-w-3xl w-full h-[90vh] flex flex-col items-center" showCloseButton>
          {pdfModal.pdfDataUri && (
            <>
              <div className="flex gap-2 mb-2 w-full justify-end">
                <Button size="sm" variant="secondary" onClick={() => downloadPDF(pdfModal.pdfDataUri!, 'prescription.pdf')}>
                  <Download className="mr-1 h-4 w-4" /> Download
                </Button>
                <Button size="sm" variant="secondary" onClick={() => printPDF(pdfModal.pdfDataUri!)}>
                  <Printer className="mr-1 h-4 w-4" /> Print
                </Button>
              </div>
              <iframe
                src={pdfModal.pdfDataUri}
                title="Prescription PDF"
                className="w-full h-full border rounded bg-white"
                style={{ minHeight: 600 }}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

