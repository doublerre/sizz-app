import type { FC } from "react";
import AppSidebar from "@/components/AppSidebar";


interface SidebarProps {
  userName?: string;
  userRole?: string;
}

export const Sidebar: FC<SidebarProps> = () => <AppSidebar />;