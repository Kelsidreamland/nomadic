import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Luggages } from './pages/Luggages';
import { Items } from './pages/Items';
import { Outfits } from './pages/Outfits';
import { Overview } from './pages/Overview';
import { PWAPrompt } from './components/PWAPrompt';
import { OfflineBanner } from './components/OfflineBanner';

function App() {
  return (
    <Router>
      <OfflineBanner />
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/luggages" element={<Luggages />} />
          <Route path="/items" element={<Items />} />
          <Route path="/outfits" element={<Outfits />} />
          <Route path="/overview" element={<Overview />} />
        </Routes>
        {import.meta.env.PROD && <PWAPrompt />}
      </Layout>
    </Router>
  );
}

export default App;
