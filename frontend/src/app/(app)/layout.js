'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import GamificationToast from '@/components/GamificationToast';
import FocusTimer from '@/components/FocusTimer';
import { CurrentContextProvider } from '@/lib/CurrentContext';
import { FocusProvider } from '@/lib/FocusContext';

export default function AppLayout({ children }) {
  const pathname = usePathname();
  // Is user inside the active live interview room? (e.g. /interview/6acfa8452126666378aae9b6, but not /interview or /scorecard)
  const isLiveInterviewRoom = pathname?.startsWith('/interview/') && !pathname?.endsWith('/scorecard');
  // Is user inside an active live collaborative study room? (e.g. /rooms/6ad0b1db..., but not /rooms lobby)
  const isLiveStudyRoom = pathname?.startsWith('/rooms/') && pathname !== '/rooms';

  return (
    <CurrentContextProvider>
      <FocusProvider>
        <div className="app-container">
          {!isLiveInterviewRoom && <Sidebar />}
          <main className={`main-content ${isLiveInterviewRoom ? 'interview-proctor-full' : ''} ${isLiveStudyRoom ? 'room-proctor-full' : ''}`}>
            {children}
          </main>
          {!isLiveInterviewRoom && <GamificationToast />}
          {!isLiveInterviewRoom && <FocusTimer />}
        </div>
      </FocusProvider>
    </CurrentContextProvider>
  );
}
