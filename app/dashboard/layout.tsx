import { Sidebar } from "./_components/Sidebar";
import { TopBar } from "./_components/TopBar";
import { GuidedTour } from "./_components/GuidedTour";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <GuidedTour autoStart />
      <Sidebar />
      <TopBar />
      <main className="ml-[220px] mt-14 p-6 min-h-[calc(100vh-56px)] overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
