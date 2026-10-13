// Every page in app/(app)/ (Discover, I'm here, Your Sky, Sun Road) sits inside the nav.
// The (app) folder name groups them without adding to the address: /discover stays /discover.

import type { ReactNode } from "react";
import AppShell from "@/components/AppShell";

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
