"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma"; 
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// Schema for creating a patient
const createPatientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  gender: z.enum(["MALE", "FEMALE"]),
  dateOfBirth: z.coerce.date(),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional(),
  bloodType: z.enum(["A_POSITIVE", "A_NEGATIVE", "B_POSITIVE", "B_NEGATIVE", "AB_POSITIVE", "AB_NEGATIVE", "O_POSITIVE", "O_NEGATIVE"]).optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  subcity: z.string().optional(),
  woreda: z.string().optional(),
  houseNumber: z.string().optional(),
});

export async function getPatients() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
        return {
            success: false,
            message: "Authentication required"
        };
    }

    const patients = await prisma.patient.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    return { success: true, data: patients };
  } catch (error) {
    console.error('Error fetching patients:', error);
    return { success: false, message: 'Failed to fetch patients' };
  }
}

export async function getPatientById(id: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
        return {
            success: false,
            message: "Authentication required"
        };
    }

    const patient = await prisma.patient.findUnique({
      where: { id }
    });
    return { success: true, data: patient };
  } catch (error) {
    console.error("Error fetching patient:", error);
    return { success: false, message: "Failed to fetch patient" };
  }
}

export async function createPatient(formData: FormData) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
        return {
            success: false,
            message: "Authentication required"
        };
    }

    // Extract data from FormData
    const rawData = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      gender: formData.get('gender') as string,
      dateOfBirth: formData.get('dateOfBirth') as string || '1990-01-01',
      phoneNumber: formData.get('phoneNumber') as string,
      email: formData.get('email') as string,
      bloodType: formData.get('bloodType') as string,
      street: formData.get('address') as string || formData.get('street') as string,
      city: formData.get('city') as string,
      subcity: formData.get('subcity') as string,
      woreda: formData.get('woreda') as string,
      houseNumber: formData.get('houseNumber') as string,
    };

    // Map frontend gender values to database enum values
    if (rawData.gender === 'Male') {
      rawData.gender = 'MALE';
    } else if (rawData.gender === 'Female') {
      rawData.gender = 'FEMALE';
    }

    // Map frontend blood type to database enum
    if (rawData.bloodType) {
      const bloodTypeMap: { [key: string]: string } = {
        'A+': 'A_POSITIVE',
        'A-': 'A_NEGATIVE',
        'B+': 'B_POSITIVE',
        'B-': 'B_NEGATIVE',
        'AB+': 'AB_POSITIVE',
        'AB-': 'AB_NEGATIVE',
        'O+': 'O_POSITIVE',
        'O-': 'O_NEGATIVE',
      };
      rawData.bloodType = bloodTypeMap[rawData.bloodType] || rawData.bloodType;
    }

    // Validate the data
    const validatedData = createPatientSchema.parse(rawData);
    
    // Create the patient
    const patient = await prisma.patient.create({
      data: validatedData
    });

    revalidatePath('/patients');
    return { success: true, patient };
  } catch (error) {
    console.error('Error creating patient:', error);
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: 'Validation failed', 
        details: error.errors 
      };
    }
    
    return { 
      success: false, 
      error: 'Failed to create patient' 
    };
  }
}

export async function updatePatient(id: string, formData: FormData) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
        return {
            success: false,
            message: "Authentication required"
        };
    }

    // Extract data from FormData
    const rawData = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      gender: formData.get('gender') as string,
      dateOfBirth: formData.get('dateOfBirth') as string,
      phoneNumber: formData.get('phoneNumber') as string,
      email: formData.get('email') as string,
      bloodType: formData.get('bloodType') as string,
      street: formData.get('address') as string || formData.get('street') as string,
      city: formData.get('city') as string,
      subcity: formData.get('subcity') as string,
      woreda: formData.get('woreda') as string,
      houseNumber: formData.get('houseNumber') as string,
    };

    // Map frontend gender values to database enum values
    if (rawData.gender === 'Male') {
      rawData.gender = 'MALE';
    } else if (rawData.gender === 'Female') {
      rawData.gender = 'FEMALE';
    }

    // Map frontend blood type to database enum
    if (rawData.bloodType) {
      const bloodTypeMap: { [key: string]: string } = {
        'A+': 'A_POSITIVE',
        'A-': 'A_NEGATIVE',
        'B+': 'B_POSITIVE',
        'B-': 'B_NEGATIVE',
        'AB+': 'AB_POSITIVE',
        'AB-': 'AB_NEGATIVE',
        'O+': 'O_POSITIVE',
        'O-': 'O_NEGATIVE',
      };
      rawData.bloodType = bloodTypeMap[rawData.bloodType] || rawData.bloodType;
    }

    // Filter out empty values
    const filteredData = Object.fromEntries(
      Object.entries(rawData).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
    );

    // Validate the data
    const validatedData = createPatientSchema.partial().parse(filteredData);
    
    // Update the patient
    const patient = await prisma.patient.update({
      where: { id },
      data: validatedData
    });

    revalidatePath('/patients');
    return { success: true, patient };
  } catch (error) {
    console.error('Error updating patient:', error);
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: 'Validation failed', 
        details: error.errors 
      };
    }
    
    return { 
      success: false, 
      error: 'Failed to update patient' 
    };
  }
}

export async function deletePatient(id: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
        return {
            success: false,
            message: "Authentication required"
        };
    }

    await prisma.patient.delete({
      where: { id }
    });

    revalidatePath("/patients");
    return { success: true };
  } catch (error) {
    console.error("Error deleting patient:", error);
    return { 
      success: false, 
      error: "Failed to delete patient" 
    };
  }
}

export async function deletePatients(ids: string[]) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
        return {
            success: false,
            message: "Authentication required"
        };
    }

    await prisma.$transaction(
      ids.map(id => 
        prisma.patient.delete({
          where: { id }
        })
      )
    );

    revalidatePath("/patients");
    return { success: true };
  } catch (error) {
    console.error("Error deleting patients:", error);
    return { 
      success: false, 
      error: "Failed to delete patients",
      details: error instanceof Error ? error.message : undefined
    };
  }
}