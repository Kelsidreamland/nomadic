import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { PWAPrompt } from './components/PWAPrompt';
import { OfflineBanner } from './components/OfflineBanner';

const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const Luggages = lazy(() => import('./pages/Luggages').then(module => ({ default: module.Luggages })));
const Items = lazy(() => import('./pages/Items').then(module => ({ default: module.Items })));
const Outfits = lazy(() => import('./pages/Outfits').then(module => ({ default: module.Outfits })));
const Overview = lazy(() => import('./pages/Overview').then(module => ({ default: module.Overview })));
const FlightMemory = lazy(() => import('./pages/FlightMemory').then(module => ({ default: module.FlightMemory })));

const RouteFallback = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-brand-stone)] border-t-[var(--color-brand-terracotta)]" />
  </div>
);

function App() {
  return (
    <Router>
      <OfflineBanner />
      <Layout>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/luggages" element={<Luggages />} />
            <Route path="/items" element={<Items />} />
            <Route path="/outfits" element={<Outfits />} />
            <Route path="/overview" element={<Overview />} />
            <Route path="/memory" element={<FlightMemory />} />
          </Routes>
        </Suspense>
        {import.meta.env.PROD && <PWAPrompt />}
      </Layout>
    </Router>
  );
}

export default App;
