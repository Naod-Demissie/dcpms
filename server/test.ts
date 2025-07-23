"use server";

import React from "react";
import { prisma } from "@/lib/prisma"; 
import { auth } from "../lib/auth";

export const handleClick = async () => {
   

  const config = {
    firstName: "Naod",
    lastName: "Demissie",
    email: "contactnaod@gmail.com",
    password: "Admin@1234",
    phoneNumber: "+251904002463",
  };

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

  if (!result) {
    // log error
    console.error("Error during sign up:", result);
  }
  console.log("Sign up result:", result);
};
