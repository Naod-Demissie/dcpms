import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

export type InvoicePDFData = {
  'date-field': string;
  'invoice-id-field': string;
  'name-field': string;
  'phone-field': string;
  'no-1': string;
  'no-2'?: string;
  'no-3'?: string;
  'no-4'?: string;
  'no-5'?: string;
  'description-1': string;
  'description-2'?: string;
  'description-3'?: string;
  'description-4'?: string;
  'description-5'?: string;
  'price-1': string;
  'price-2'?: string;
  'price-3'?: string;
  'price-4'?: string;
  'price-5'?: string;
  'qty-1': string;
  'qty-2'?: string;
  'qty-3'?: string;
  'qty-4'?: string;
  'qty-5'?: string;
  'total-1': string;
  'total-2'?: string;
  'total-3'?: string;
  'total-4'?: string;
  'total-5'?: string;
  'subtotal-field': string;
  'taxrate-field': string;
  'grandtotal-field': string;
  'dr-name-field': string;
};

export async function fillInvoicePDF(data: InvoicePDFData): Promise<Uint8Array> {
  const pdfPath = path.join(process.cwd(), 'templates/invoice-templete.pdf');
  const pdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();

  // Helper: safely set text if field exists
  const safeSet = (name: string, value: string | undefined) => {
    try {
      const field = form.getTextField(name);
      field.setText(value || '');
    } catch {
      // Field not present in template – ignore
    }
  };

  // Fill fields using helper
  safeSet('date-field', data['date-field']);
  safeSet('invoice-id-field', data['invoice-id-field']);
  safeSet('name-field', data['name-field']);
  safeSet('phone-field', data['phone-field']);
  safeSet('no-1', data['no-1']);
  safeSet('no-2', data['no-2']);
  safeSet('no-3', data['no-3']);
  safeSet('no-4', data['no-4']);
  safeSet('no-5', data['no-5']);
  safeSet('description-1', data['description-1']);
  safeSet('description-2', data['description-2']);
  safeSet('description-3', data['description-3']);
  safeSet('description-4', data['description-4']);
  safeSet('description-5', data['description-5']);
  safeSet('price-1', data['price-1']);
  safeSet('price-2', data['price-2']);
  safeSet('price-3', data['price-3']);
  safeSet('price-4', data['price-4']);
  safeSet('price-5', data['price-5']);
  safeSet('qty-1', data['qty-1']);
  safeSet('qty-2', data['qty-2']);
  safeSet('qty-3', data['qty-3']);
  safeSet('qty-4', data['qty-4']);
  safeSet('qty-5', data['qty-5']);
  safeSet('total-1', data['total-1']);
  safeSet('total-2', data['total-2']);
  safeSet('total-3', data['total-3']);
  safeSet('total-4', data['total-4']);
  safeSet('total-5', data['total-5']);
  safeSet('subtotal-field', data['subtotal-field']);
  safeSet('taxrate-field', data['taxrate-field']);
  safeSet('grandtotal-field', data['grandtotal-field']);
  safeSet('dr-name-field', data['dr-name-field']);
 
  form.flatten();
  return await pdfDoc.save();
} 