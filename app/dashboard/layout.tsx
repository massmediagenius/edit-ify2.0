import { Sidebar } from "./_components/Sidebar";
import { TopBar } from "./_components/TopBar";
import { GuidedTour } from "./_components/GuidedTour";
import { MobileNav } from "./_components/MobileNav";
import { SubmissionNotifier } from "./_components/SubmissionNotifier";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <GuidedTour autoStart />
      <Sidebar />
      <TopBar />
      <main className="md:ml-[220px] mt-14 min-h-[calc(100vh-56px)] overflow-y-auto pb-20 md:pb-0">
        {children}
      </main>
      <MobileNav />
      <SubmissionNotifier />
    </div>
  );
}
