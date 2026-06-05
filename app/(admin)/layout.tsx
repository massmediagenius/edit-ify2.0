import { AdminSidebar } from "./_components/AdminSidebar";
import { AdminTopBar } from "./_components/AdminTopBar";
import { AdminMobileNav } from "./_components/AdminMobileNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <AdminTopBar />
      <main className="md:ml-[220px] mt-14 p-4 md:p-6 pb-24 md:pb-6 min-h-[calc(100vh-56px)] overflow-y-auto">
        {children}
      </main>
      <AdminMobileNav />
    </div>
  );
}
