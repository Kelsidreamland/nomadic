import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Luggages } from './pages/Luggages';
import { Items } from './pages/Items';
import { Outfits } from './pages/Outfits';
import { PWAPrompt } from './components/PWAPrompt';
import { OfflineBanner } from './components/OfflineBanner';

const GOOGLE_CLIENT_ID = '877596566146-tafsrq2soog22qd9fbvf0rj9kctdfmi3.apps.googleusercontent.com';

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Router>
        <OfflineBanner />
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/luggages" element={<Luggages />} />
            <Route path="/items" element={<Items />} />
            <Route path="/outfits" element={<Outfits />} />
          </Routes>
          {import.meta.env.PROD && <PWAPrompt />}
        </Layout>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
