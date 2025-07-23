import { IconCircle, IconCircleDashed, IconCircleFilled } from "@tabler/icons-react";

export const patientStatusTypes = [
  { value: "active", label: "Active", icon: IconCircleFilled },
  { value: "inactive", label: "Inactive", icon: IconCircle },
  { value: "pending", label: "Pending", icon: IconCircleDashed },
];

