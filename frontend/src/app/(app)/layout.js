import Sidebar from '@/components/Sidebar';
import GamificationToast from '@/components/GamificationToast';
import FocusTimer from '@/components/FocusTimer';
export default function AppLayout({ children }) {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
      <GamificationToast />
      <FocusTimer />
    </div>
  );
}
