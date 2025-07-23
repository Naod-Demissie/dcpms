"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 1.2,
      staggerChildren: 0.15,
      ease: [0.23, 1, 0.32, 1], // Smooth ease out
    },
  },
};

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 12, // Reduced movement for smoother feel
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1,
      ease: [0.23, 1, 0.32, 1],
    },
  },
};

const logoVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95, // Subtle scale change
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 1.2,
      ease: [0.23, 1, 0.32, 1],
    },
  },
};

const buttonVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.96, // Very subtle scale
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: [0.23, 1, 0.32, 1],
    },
  },
};

export default function Home() {
  return (
    <section className="dark relative flex h-screen w-screen overflow-hidden bg-[url('/hero-image.jpg')] bg-cover bg-center bg-no-repeat font-sans after:absolute after:left-0 after:top-0 after:z-10 after:h-full after:w-full after:bg-black/60 after:content-['']">
      {/* 🌈 Gradient overlay */}
      <motion.div
        className="absolute inset-0 z-20 bg-gradient-to-t from-black/70 via-black/40 to-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: 1.5,
          ease: [0.23, 1, 0.32, 1],
        }}
        style={{ willChange: "opacity" }}
      />

      <motion.div
        className="relative z-40 m-auto flex max-w-2xl flex-col items-center justify-center gap-6 px-5 text-center text-white"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ willChange: "opacity" }}
      >
        <motion.div
          variants={logoVariants}
          style={{ willChange: "opacity, transform" }}
        >
          <Image
            src="/logo.png"
            alt="Beka Dental Clinic"
            width={200}
            height={100}
            priority
            // className="rounded-lg dark:invert"
          />
        </motion.div>

        <motion.h1
          className="text-4xl font-bold"
          variants={itemVariants}
          style={{ willChange: "opacity, transform" }}
        >
          Beka Dental Clinic Patient Portal
        </motion.h1>

        <motion.p
          className="text-lg"
          variants={itemVariants}
          style={{ willChange: "opacity, transform" }}
        >
          Manage your patient appointments, records, and care — all in one
          secure platform.
        </motion.p>

        <motion.div
          className="flex gap-2"
          variants={buttonVariants}
          style={{ willChange: "opacity, transform" }}
        >
          <Link href="/signin">
            <Button
              variant="outline"
              className="h-fit w-fit rounded-full px-10 py-4 text-md font-medium leading-tight"
            >
              Sign In
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
