import { TreatmentTemplatesDialogs } from "@/features/treatments/components/treatment-templates-dialogs";
import TreatmentTemplatesProvider from "@/features/treatments/context/treatment-templates-context";

export default function TreatmentTemplatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TreatmentTemplatesProvider>
      {children}
      <TreatmentTemplatesDialogs />
    </TreatmentTemplatesProvider>
  );
}


