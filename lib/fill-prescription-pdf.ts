import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

export type PrescriptionData = {
  'name-field': string;
  'age-field': string;
  'sex-field': string;
  'address-field': string;
  'medicine-1': string;
  'medicine-2'?: string;
  'medicine-3'?: string;
  'medicine-4'?: string;
  'date-field': string;
  'presciption-id-field': string;
  'doctor-name-field': string;
};

export async function fillPrescriptionPDF(data: PrescriptionData): Promise<Uint8Array> {
  const pdfPath = path.join(process.cwd(), 'templates/prescription-templete.pdf');
  const pdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();

  // Fill fields
  form.getTextField('name-field').setText(data['name-field']);
  form.getTextField('age-field').setText(data['age-field']);
  form.getTextField('sex-field').setText(data['sex-field']);
  form.getTextField('address-field').setText(data['address-field']);
  form.getTextField('medicine-1').setText(data['medicine-1'] || '');
  form.getTextField('medicine-2').setText(data['medicine-2'] || '');
  form.getTextField('medicine-3').setText(data['medicine-3'] || '');
  form.getTextField('medicine-4').setText(data['medicine-4'] || '');
  form.getTextField('date-field').setText(data['date-field']);
  form.getTextField('presciption-id-field').setText(data['presciption-id-field']);
  form.getTextField('doctor-name-field').setText(data['doctor-name-field']);

  form.flatten();
  return await pdfDoc.save();
}