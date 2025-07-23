import transporter from "@/lib/nodemailer"; 
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
    // Configure user model to use Staff
    user: {
        modelName: "staff", 
        fields: {
            name: "name",
            email: "email",
            emailVerified: "emailVerified",
            image: "image",
            createdAt: "createdAt", 
            updatedAt: "updatedAt",
        },
        additionalFields: {
            firstName: {
                type: "string",
                required: true,
                input: true,
            },
            lastName: {
                type: "string", 
                required: true,
                input: true,
            },
            phoneNumber: {
                type: "string",
                required: false,
                input: true,
            },
            role: {
                type: ["ADMIN", "RECEPTIONIST", "DENTIST"], 
                required: true,
                input: true,
                defaultValue: 'RECEPTIONIST', 

            },
            isActive: {
                type: "boolean",
                required: true,
                defaultValue: true,
                input: true,
            },
        },
    },
    
    // Configure session model
    session: {
        modelName: "sessions",
        fields: {
            userId: "userId", // References Staff.id
            expiresAt: "expiresAt",
            token: "token",
            createdAt: "createdAt",
            updatedAt: "updatedAt",
            ipAddress: "ipAddress",
            userAgent: "userAgent",
        },
    },

    // Configure account model
    account: {
        modelName: "accounts",
        fields: {
            userId: "userId", // References Staff.id
            accountId: "accountId",
            providerId: "providerId",
            accessToken: "accessToken",
            refreshToken: "refreshToken",
            idToken: "idToken",
            accessTokenExpiresAt: "accessTokenExpiresAt",
            refreshTokenExpiresAt: "refreshTokenExpiresAt",
            scope: "scope",
            password: "password",
            createdAt: "createdAt",
            updatedAt: "updatedAt",
        },
    },

    // Configure verification model
    verification: {
        modelName: "verifications",
        fields: {
            identifier: "identifier",
            value: "value",
            expiresAt: "expiresAt",
            createdAt: "createdAt",
            updatedAt: "updatedAt",
        },
    },

    // Social providers
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
    },
// Email and password authentication
    emailAndPassword: {
        enabled: true,
        sendResetPassword: async ({ user, url }) => {
            const mailOptions = {
                from: process.env.NODEMAILER_USER,
                to: user.email,
                subject: "Reset Password Link",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Password Reset - ${process.env.NEXT_PUBLIC_CLINIC_NAME || 'Our Clinic'}</h2>
                        <p>Hello ${user.email || 'User'},</p>
                        <p>You have requested to reset your password. Please click the link below to set a new password:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${url}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
                        </div>
                        <p style="color: #666; font-size: 14px;">This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.</p>
                        <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
                        <p style="color: #007bff; word-break: break-all;">${url}</p>
                        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                        <p style="color: #999; font-size: 12px;">This email was sent from ${process.env.NEXT_PUBLIC_CLINIC_NAME || 'Our Clinic'} system.</p>
                    </div>
                `,
            };

            try {
                await transporter.sendMail(mailOptions);
                console.log(`Reset password email sent to ${user.email}`);
            } catch (error) {
                console.error("Failed to send reset password email:", error);
                throw new Error("Failed to send reset password email");
            }
        },
        requireEmailVerification: false,
        resetPasswordTokenExpiresIn: 3600, // 1 hour in seconds
    },

    // Database adapter
    database: prismaAdapter(prisma, {
        // provider: "mysql",
        provider: "postgresql",
    }),

    // Plugins
    plugins: [
        nextCookies(),
    ],

});

