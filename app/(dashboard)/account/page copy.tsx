import { Suspense } from "react";
import { AccountForm } from "@/features/account/components/account-form";

export default function SettingsAccount() {
  return (
    <Suspense fallback={<div>Loading account settings...</div>}>
      <AccountForm />
    </Suspense>
  );
}
