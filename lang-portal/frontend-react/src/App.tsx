
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/layout/Layout';

// Import pages
import Dashboard from './pages/Dashboard';
import StudyActivities from './pages/StudyActivities';
import StudyActivity from './pages/StudyActivity';
import Words from './pages/Words';
import Word from './pages/Word';
import Groups from './pages/Groups';
import Group from './pages/Group';
import Sessions from './pages/Sessions';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/study-activities" element={<StudyActivities />} />
            <Route path="/study-activities/:id" element={<StudyActivity />} />
            <Route path="/words" element={<Words />} />
            <Route path="/words/:id" element={<Word />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/groups/:id" element={<Group />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
