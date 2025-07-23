// If you see type errors for Node.js modules, run:
// npm i --save-dev @types/node @types/puppeteer @types/buffer
// If you see type errors for jsPDF, run:
// npm i --save-dev @types/jspdf
import jsPDF from 'jspdf';

export interface InvoiceData {
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  date: Date;
  treatments: {
    name: string;
    description: string;
    price: number;
    quantity: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  clinicEmail: string;
}

export interface PrescriptionData {
  id: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  date: Date;
  doctorName: string;
  doctorSpecialization: string;
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }[];
  diagnosis: string;
  notes: string;
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
}

function generateRxId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < 4; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `RX-${id}`;
}

// Function to load and optimize logo as base64 (for better PDF integration)
async function loadLogoAsBase64(): Promise<string | null> {
  try {
    const response = await fetch('/logo.png');
    const blob = await response.blob();
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Create canvas to resize and optimize the logo
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Set very small dimensions to minimize file size
          const maxWidth = 32; // Small size for PDF
          const maxHeight = 24; // Small size for PDF
          
          // Calculate aspect ratio
          const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
          const newWidth = img.width * ratio;
          const newHeight = img.height * ratio;
          
          canvas.width = newWidth;
          canvas.height = newHeight;
          
          // Draw resized image
          ctx?.drawImage(img, 0, 0, newWidth, newHeight);
          
          // Convert to base64 with very low quality to reduce file size
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.5);
          resolve(optimizedDataUrl);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Could not load logo as base64:', error);
    return null;
  }
}

export function generateInvoicePDF(data: InvoiceData): string {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(data.clinicName, 20, 30);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(data.clinicAddress, 20, 40);
  doc.text(`Phone: ${data.clinicPhone}`, 20, 50);
  doc.text(`Email: ${data.clinicEmail}`, 20, 60);
  
  // Invoice title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 150, 30);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: ${data.id}`, 150, 45);
  doc.text(`Date: ${data.date.toLocaleDateString()}`, 150, 55);
  
  // Patient information
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 20, 80);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(data.patientName, 20, 90);
  doc.text(data.patientEmail, 20, 100);
  doc.text(data.patientPhone, 20, 110);
  
  // Treatments table (improved spacing, ETB units)
  let yPosition = 130;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Treatment', 20, yPosition);
  doc.text('Qty', 100, yPosition, { align: 'left' });
  doc.text('Price (ETB)', 120, yPosition, { align: 'left' });
  doc.text('Total (ETB)', 160, yPosition, { align: 'left' });
  
  // Draw line under header
  doc.line(20, yPosition + 5, 190, yPosition + 5);
  
  yPosition += 15;
  doc.setFont('helvetica', 'normal');
  
  data.treatments.forEach((treatment) => {
    const total = treatment.price * treatment.quantity;
    doc.text(treatment.name, 20, yPosition);
    doc.text(treatment.quantity.toString(), 100, yPosition, { align: 'left' });
    doc.text(`${treatment.price.toFixed(2)} ETB`, 120, yPosition, { align: 'left' });
    doc.text(`${total.toFixed(2)} ETB`, 160, yPosition, { align: 'left' });
    yPosition += 10;
  });
  
  // Totals
  yPosition += 10;
  doc.line(120, yPosition, 190, yPosition);
  yPosition += 10;
  
  doc.text('Subtotal:', 120, yPosition, { align: 'left' });
  doc.text(`${data.subtotal.toFixed(2)} ETB`, 160, yPosition, { align: 'left' });
  yPosition += 10;
  
  doc.text('Tax:', 120, yPosition, { align: 'left' });
  doc.text(`${data.tax.toFixed(2)} ETB`, 160, yPosition, { align: 'left' });
  yPosition += 10;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Total:', 120, yPosition, { align: 'left' });
  doc.text(`${data.total.toFixed(2)} ETB`, 160, yPosition, { align: 'left' });
  
  // Footer
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Thank you for choosing our dental clinic!', 20, 270);
  doc.text('Payment is due within 30 days of invoice date.', 20, 280);
  
  return doc.output('datauristring');
}

export async function generatePrescriptionPDF(data: PrescriptionData): Promise<string> {
  const doc = new jsPDF();
  
  // Use neutral colors that work well for printing
  const primaryColor = '#000000';
  const secondaryColor = '#666666';
  const faintColor = '#cccccc';

  // Draw faint Rx icon with snakes as background
  doc.setTextColor(faintColor);
  doc.setFontSize(100);
  doc.setFont('helvetica', 'bold');
  doc.text('℞', 120, 80);
  
  // Header divider
  doc.setDrawColor(primaryColor);
  doc.setLineWidth(1.2);
  doc.line(20, 35, 190, 35);

  // Try to add logo (optional, won't break if logo fails to load)
  try {
    const logoBase64 = await loadLogoAsBase64();
    if (logoBase64) {
      // Add logo with smaller dimensions to reduce file size
      doc.addImage(logoBase64, 'JPEG', 20, 10, 20, 15);
    } else {
      // Add a simple text logo as fallback
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor);
      doc.text('LOGO', 20, 20);
    }
  } catch (error) {
    console.warn('Could not add logo to PDF:', error);
    // Add a simple text logo as fallback
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.text('LOGO', 20, 20);
  }
  // Clinic info
  doc.setFontSize(18);
  doc.setTextColor(primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text(data.clinicName, 50, 22);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(secondaryColor);
  doc.text(data.clinicAddress, 50, 28);
  doc.text('Phone: ' + data.clinicPhone, 50, 33);

  // Rx ID and date
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor);
  doc.text('PRESCRIPTION', 150, 22);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(secondaryColor);
  doc.text('Prescription #: ' + (data.id || generateRxId()), 150, 28);
  doc.text('Date: ' + (data.date ? new Date(data.date).toLocaleDateString() : ''), 150, 33);

  // Divider
  doc.setDrawColor(faintColor);
  doc.setLineWidth(0.5);
  doc.line(20, 38, 190, 38);

  // Patient info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor);
  doc.text('Patient Information:', 20, 48);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(secondaryColor);
  doc.text('Name: ' + (data.patientName || 'N/A'), 40, 48);
  doc.text('Age: ' + (data.patientAge || 'N/A') + ' years', 100, 48);
  doc.text('Gender: ' + (data.patientGender || 'N/A'), 140, 48);

  // Doctor info
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor);
  doc.text('Prescriber Information:', 20, 56);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(secondaryColor);
  doc.text('Name: ' + (data.doctorName || 'N/A'), 45, 56);
  doc.text('Specialization: ' + (data.doctorSpecialization || 'N/A'), 100, 56);

  // Divider
  doc.setDrawColor(faintColor);
  doc.setLineWidth(0.5);
  doc.line(20, 60, 190, 60);

  // Medications
  let y = 70;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(primaryColor);
  doc.text('Medications', 20, y);
  y += 6;
  doc.setDrawColor(faintColor);
  doc.line(20, y, 190, y);
  y += 6;
  data.medications.forEach((med, i) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(primaryColor);
    doc.text(`${i + 1}. ${med.name}`, 22, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(secondaryColor);
    doc.text(`Dosage: ${med.dosage}`, 28, y);
    doc.text(`Frequency: ${med.frequency}`, 80, y);
    doc.text(`Duration: ${med.duration}`, 140, y);
    y += 6;
    doc.text(`Instructions: ${med.instructions}`, 28, y);
    y += 10;
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
  });

  // Divider
  doc.setDrawColor(faintColor);
  doc.line(20, y, 190, y);
  y += 8;

  // Footer
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(secondaryColor);
  doc.text('This prescription is valid for 30 days from the date of issue.', 20, y);
  y += 6;
  doc.text('Please follow the medication instructions carefully.', 20, y);

  return doc.output('datauristring');
}

export function downloadPDF(dataUri: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUri;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function printPDF(dataUri: string) {
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = dataUri;
  document.body.appendChild(iframe);
  
  iframe.onload = () => {
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  };
}

