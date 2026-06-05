import { AdminSidebar } from "./_components/AdminSidebar";
import { AdminTopBar } from "./_components/AdminTopBar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <AdminTopBar />
      <main className="ml-[220px] mt-14 p-6 min-h-[calc(100vh-56px)] overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
