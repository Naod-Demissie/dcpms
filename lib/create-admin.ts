import { prisma } from "../lib/prisma";
import { auth } from "../lib/auth";

async function createAdmin() {
  try {
    const config = {
      firstName: "Creator3",
      lastName: "Administrator",
      email: "admin4@example.com",
      password: "admin1234",
      phoneNumber: "123-456-7890",
      role: "ADMIN",
    };

    console.log("Config:", config);

    if (!config.email) throw new Error("ADMIN_EMAIL is required");
    if (!config.password) throw new Error("ADMIN_PASSWORD is required");
    if (config.password.length < 8)
      throw new Error("ADMIN_PASSWORD must be at least 8 characters");

    // Check if user already exists
    const existing = await prisma.staff.findUnique({
      where: { email: config.email },
    });
    if (existing) {
      throw new Error(`Email ${config.email} already exists`);
    }

    // Sign up user
    const result = await auth.api.signUpEmail({
      body: {
        name: `${config.firstName} ${config.lastName}`,
        email: config.email,
        password: config.password,
        firstName: config.firstName,
        lastName: config.lastName,
        phoneNumber: config.phoneNumber,
      },
    });

    console.log("Sign up result:", result);

    // Update role to ADMIN
    if (result && result.user) {
      const user = await prisma.staff.update({
        where: { id: result.user.id },
        data: {
          role: config.role,
        },
      });
      console.log("User updated with role:", user);

      console.log(`✅ Admin user ${config.email} created successfully.`);
    } else {
      throw new Error("Sign up failed, no user returned");
    }
  } catch (err) {
    if (err instanceof Error) {
      console.error("❌ Failed to create admin:", err.message);
    } else {
      console.error("❌ Failed to create admin:", err);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
