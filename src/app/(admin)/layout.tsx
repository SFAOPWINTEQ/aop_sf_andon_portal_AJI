import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header/Header";
import { Toaster } from "@/components/ui/sonner";
import { SidebarProvider } from "@/context/sidebar-context";
import { Content } from "@/components/layout/Content";
import { SessionValidator } from "@/components/layout/SessionValidator";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="min-h-screen">
        {/* Session Validator - Checks user status periodically */}
        <SessionValidator />

        {/* Sidebar - Fixed on desktop, drawer on mobile */}
        <Sidebar />

        {/* Main Content Area */}
        <Content>
          {/* Header - Sticky at top */}
          <Header />

          {/* Scrollable Content Area */}
          <main className="flex-1">{children}</main>
        </Content>

        {/* Toast Notifications */}
        <Toaster />
      </div>
    </SidebarProvider>
  );
}
