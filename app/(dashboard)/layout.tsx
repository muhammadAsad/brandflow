import { Header } from '@/components/dashboard/header';
import { Sidebar } from '@/components/dashboard/sidebar';
import { AnnouncementBanner } from '@/components/dashboard/announcement-banner';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'DM Sans','Segoe UI',sans-serif", background: '#f4f5ff', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header />
        <AnnouncementBanner />
        <main style={{ flex: 1, overflowY: 'auto', paddingTop: 20 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
