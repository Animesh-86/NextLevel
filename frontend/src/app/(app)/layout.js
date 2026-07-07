import Sidebar from '@/components/Sidebar';
import GamificationToast from '@/components/GamificationToast';
import FocusTimer from '@/components/FocusTimer';
import { CurrentContextProvider } from '@/lib/CurrentContext';

export default function AppLayout({ children }) {
  return (
    <CurrentContextProvider>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          {children}
        </main>
        <GamificationToast />
        <FocusTimer />
      </div>
    </CurrentContextProvider>
  );
}
