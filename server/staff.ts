"use server";

import { auth } from "@/lib/auth";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma"; 
import { headers } from "next/headers";
import transporter from "@/lib/nodemailer"; 

// ===================
// Authentication Actions
// ===================

export const signIn = async (email: string, password: string) => {
    try {
        await auth.api.signInEmail({
            body: {
                email,
                password,
            }
        });

        return {
            success: true,
            message: "Signed in successfully."
        };
    } catch (error) {
        const e = error as Error;
        console.log(e)

        return {
            success: false,
            message: e.message || "An unknown error occurred."
        };
    }
};


// export const signOut = async () => {
//     try {
//         await auth.api.signOut({
//             fetchOptions: {
//               onRequest: () => {
//                 setIsPending(true);
//               },
//               onResponse: () => {
//                 setIsPending(false);
//               },
//               onError: (ctx) => {
//                 toast.error(ctx.error.message);
//               },
//               onSuccess: () => {
//                 toast.success("You’ve logged out. See you soon!");
//                 router.push("/auth/login");
//               },
//             },
//           });
        
//         return {
//             success: true,
//             message: "Signed out successfully."
//         };
//     } catch (error) {
//         const e = error as Error;

//         return {
//             success: false,
//             message: e.message || "Failed to sign out."
//         };
//     }
// };


export const signOut = async () => {
    try {
        await auth.api.signOut({ headers: {} });
        
        return {
            success: true,
            message: "Signed out successfully."
        };
    } catch (error) {
        const e = error as Error;

        return {
            success: false,
            message: e.message || "Failed to sign out."
        };
    }
};




export const getCurrentSession = async () => {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        
        if (!session) {
            return {
                success: false,
                message: "No active session found."
            };
        }

        return {
            success: true,
            data: session
        };
    } catch (error) {
        const e = error as Error;

        return {
            success: false,
            message: e.message || "Failed to get session."
        };
    }
};

// ===================
// Staff Management Actions
// ===================

export const getStaff = async () => {
    try {
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session?.user) {
            return {
                success: false,
                message: "Authentication required"
            };
        }

        const staff = await prisma.staff.findMany({
            orderBy: {
                createdAt: "desc",
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                name: true,
                email: true,
                emailVerified: true,
                image: true,
                phoneNumber: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return {
            success: true,
            data: staff
        };
    } catch (error) {
        const e = error as Error;
        return {
            success: false,
            message: e.message || "Failed to fetch staff"
        };
    }
};

export const getStaffById = async (id: string) => {
    try {
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session?.user) {
            return {
                success: false,
                message: "Authentication required"
            };
        }

        const staff = await prisma.staff.findUnique({
            where: { id },
            include: {
                // appointmentsAsDentist: {
                //     select: {
                //         id: true,
                //         startTime: true,
                //         endTime: true,
                //         status: true,
                //         patient: {
                //             select: {
                //                 firstName: true,
                //                 lastName: true,
                //             },
                //         },
                //     },
                //     orderBy: {
                //         startTime: "desc",
                //     },
                //     take: 5, // Last 5 appointments
                // },
                // appointmentsAsReceptionist: {
                //     select: {
                //         id: true,
                //         startTime: true,
                //         endTime: true,
                //         status: true,
                //         patient: {
                //             select: {
                //                 firstName: true,
                //                 lastName: true,
                //             },
                //         },
                //     },
                //     orderBy: {
                //         startTime: "desc",
                //     },
                //     take: 5, // Last 5 appointments
                // },
                sessions: {
                    select: {
                        id: true,
                        createdAt: true,
                        expiresAt: true,
                        ipAddress: true,
                        userAgent: true,
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                    take: 3, // Last 3 sessions
                },
            },
        });

        if (!staff) {
            return {
                success: false,
                message: "Staff member not found"
            };
        }

        return {
            success: true,
            data: staff
        };
    } catch (error) {
        const e = error as Error;
        return {
            success: false,
            message: e.message || "Failed to fetch staff member"
        };
    }
};

export const updateStaff = async (
    id: string,
    data: {
        firstName: string;
        lastName: string;
        phoneNumber?: string;
        role?: string;
        isActive?: boolean;
        image?: string;
    }
) => {
    try {
        const session = await auth.api.getSession({ headers: await headers() });


        if (!session?.user) {
            return {
                success: false,
                message: "Authentication required"
            };
        }

        const currentUser = session.user as any;

        // Check permissions - admin can update anyone, staff can update themselves
        if (currentUser.role !== "ADMIN" && currentUser.id !== id) {
            return {
                success: false,
                message: "Insufficient permissions"
            };
        }

        // Validate required fields
        if (!data.firstName || !data.lastName) {
            return {
                success: false,
                message: "First name and last name are required"
            };
        }

        // Prepare update data
        let updateData: any = {
            firstName: data.firstName,
            lastName: data.lastName,
            name: `${data.firstName} ${data.lastName}`,
            phoneNumber: data.phoneNumber,
        };

        // Include image if provided
        if (data.image !== undefined) {
            updateData.image = data.image;
        }

        // Only admins can change role and active status
        if (currentUser.role === "ADMIN") {
            if (data.role && ["ADMIN", "DENTIST", "RECEPTIONIST"].includes(data.role)) {
                updateData.role = data.role;
            }
            if (typeof data.isActive === "boolean") {
                updateData.isActive = data.isActive;
            }
        }

        const updatedStaff = await prisma.staff.update({
            where: { id },
            data: updateData,
        });

        return {
            success: true,
            data: updatedStaff,
            message: "Staff member updated successfully"
        };
    } catch (error) {
        const e = error as Error;
        return {
            success: false,
            message: e.message || "Failed to update staff member"
        };
    }
};

export const inviteStaff = async (email: string, role: string) => {
    try {
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session?.user) {
            return {
                success: false,
                message: "Authentication required"
            };
        }

        const currentUser = session.user as any;
        if (currentUser.role !== "ADMIN") {
            return {
                success: false,
                message: "Admin access required"
            };
        }

        // Validate input
        if (!email || !role) {
            return {
                success: false,
                message: "Email and role are required"
            };
        }

        if (!["ADMIN", "DENTIST", "RECEPTIONIST"].includes(role)) {
            return {
                success: false,
                message: "Invalid role"
            };
        }

        // Check if email is already in use
        const existingStaff = await prisma.staff.findFirst({
            where: { email }
        });

        if (existingStaff) {
            return {
                success: false,
                message: "Email is already in use"
            };
        }

        // Check if there's already a pending invite
        const existingInvite = await prisma.invite.findUnique({
            where: { email }
        });

        if (existingInvite && !existingInvite.isUsed && existingInvite.expiresAt > new Date()) {
            return {
                success: false,
                message: "Pending invitation already exists for this email"
            };
        }

        // Generate invite token
        const inviteToken = randomBytes(32).toString("hex");
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now
        const url = `${process.env.NEXT_PUBLIC_APP_URL}/complete-registration?token=${inviteToken}&email=${encodeURIComponent(email)}`;

        // Create or update invite
        const invite = await prisma.invite.upsert({
            where: { email },
            update: {
                role: role as any,
                token: inviteToken,
                expiresAt,
                isUsed: false,
                createdById: currentUser.id,
                updatedAt: new Date(),
            },
            create: {
                email,
                role: role as any,
                token: inviteToken,
                expiresAt,
                createdById: currentUser.id,
            },
        });

        // Send magic link
        try {
                const mailOptions = {
                    from: process.env.NODEMAILER_USER,
                    to: email,
                    subject: "Complete Your Staff Registration - Magic Link",
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #333;">Welcome to ${process.env.NEXT_PUBLIC_CLINIC_NAME || 'Our Clinic'}</h2>
                            <p>You have been invited to join our staff. Please click the link below to complete your registration:</p>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${url}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Complete Registration</a>
                            </div>
                            <p style="color: #666; font-size: 14px;">This link will expire in 24 hours. If you didn't expect this invitation, please ignore this email.</p>
                            <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
                            <p style="color: #007bff; word-break: break-all;">${url}</p>
                        </div>
                    `,
                };

                try {
                    await transporter.sendMail(mailOptions);
                    console.log(`Magic link sent to ${email}`);
                } catch (error) {
                    console.error("Failed to send magic link email:", error);
                    throw error;
                }

            return {
                success: true,
                message: "Invitation sent successfully",
                data: {
                    id: invite.id,
                    email: invite.email,
                    role: invite.role,
                    expiresAt: invite.expiresAt,
                }
            };
        } catch (emailError) {
            // If email sending fails, delete the invite
            await prisma.invite.delete({
                where: { id: invite.id }
            });

            console.error("Failed to send invitation email:", emailError);
            return {
                success: false,
                message: "Failed to send invitation email"
            };
        }

    } catch (error) {
        const e = error as Error;
        return {
            success: false,
            message: e.message || "Failed to invite staff member"
        };
    }
};

export const getPendingInvites = async () => {
    try {
        const session = await auth.api.getSession({
            headers: new Headers()
        });

        if (!session?.user) {
            return {
                success: false,
                message: "Authentication required"
            };
        }

        const currentUser = session.user as any;
        if (currentUser.role !== "ADMIN") {
            return {
                success: false,
                message: "Admin access required"
            };
        }

        const pendingInvites = await prisma.invite.findMany({
            where: {
                isUsed: false,
                expiresAt: {
                    gt: new Date(),
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            select: {
                id: true,
                email: true,
                role: true,
                expiresAt: true,
                createdAt: true,
            },
        });

        return {
            success: true,
            data: pendingInvites
        };
    } catch (error) {
        const e = error as Error;
        return {
            success: false,
            message: e.message || "Failed to fetch pending invites"
        };
    }
};

// ===================
// Invite Completion Actions
// ===================

export const validateInvite = async (token: string, email: string) => {
    try {
        const invite = await prisma.invite.findUnique({
            where: { email }
        });

        if (!invite) {
            return {
                success: false,
                message: "Invitation not found"
            };
        }

        if (invite.token !== token) {
            return {
                success: false,
                message: "Invalid invitation token"
            };
        }

        if (invite.isUsed) {
            return {
                success: false,
                message: "Invitation has already been used"
            };
        }

        if (invite.expiresAt < new Date()) {
            return {
                success: false,
                message: "Invitation has expired"
            };
        }

        return {
            success: true,
            data: {
                email: invite.email,
                role: invite.role,
                expiresAt: invite.expiresAt,
            }
        };
    } catch (error) {
        const e = error as Error;
        return {
            success: false,
            message: e.message || "Failed to validate invitation"
        };
    }
};

export const completeStaffRegistration = async (
    token: string,
    email: string,
    staffData: {
        firstName: string;
        lastName: string;
        password: string;
        phoneNumber?: string;
        image?: string;
    }
) => {
    try {
        // First validate the invite
        const inviteValidation = await validateInvite(token, email);
        if (!inviteValidation.success) {
            return inviteValidation;
        }

        const invite = await prisma.invite.findUnique({
            where: { email }
        });

        if (!invite) {
            return {
                success: false,
                message: "Invitation not found"
            };
        }

        const name = `${staffData.firstName} ${staffData.lastName}`;

        // Create the staff account using Better Auth
        try {
              const result = await auth.api.signUpEmail({
                body: {
                  name: name,
                  email: email,
                  password: staffData.password,
                  firstName: staffData.firstName,
                  lastName: staffData.lastName,
                  phoneNumber: staffData.phoneNumber,
                  role: invite.role,
                  isActive: true,

                },
              });
            //   change the role to ADMIN
              if (result && result.user) {
                const user = await prisma.staff.update({
                  where: { id: result.user.id },
                  data: {
                    image: staffData.image,
                    },
                });
                console.log("User updated with role:", user);
              }
            
              if (!result) {
                // log error
                console.error("Error during sign up:", result);
              }
              console.log("Sign up result:", result);




            // Mark invite as used
            await prisma.invite.update({
                where: { id: invite.id },
                data: { isUsed: true }
            });

            // Sign in the user automatically
            const signInResult = await signIn(email, staffData.password);
            
            return {
                success: true,
                message: "Registration completed successfully",
                data: {
                    email,
                    role: invite.role,
                    signedIn: signInResult.success
                }
            };

            // await auth.api.signUpEmail({
            //     body: {
            //         email,
            //         password: staffData.password,
            //         name,
            //         firstName: staffData.firstName,
            //         lastName: staffData.lastName,
            //         phoneNumber: staffData.phoneNumber,
            //         role: invite.role,
            //         image: staffData.image,
            //         isActive: true,
            //     }
            // });

            // // Mark invite as used
            // await prisma.invite.update({
            //     where: { id: invite.id },
            //     data: { isUsed: true }
            // });

            // // Sign in the user automatically
            // const signInResult = await signIn(email, staffData.password);
            
            // return {
            //     success: true,
            //     message: "Registration completed successfully",
            //     data: {
            //         email,
            //         role: invite.role,
            //         signedIn: signInResult.success
            //     }
            // };

        } catch (authError) {
            console.error("Failed to create staff account:", authError);
            return {
                success: false,
                message: "Failed to create staff account"
            };
        }

    } catch (error) {
        const e = error as Error;
        return {
            success: false,
            message: e.message || "Failed to complete registration"
        };
    }
};
