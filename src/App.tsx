import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Luggages } from './pages/Luggages';
import { Items } from './pages/Items';
import { Outfits } from './pages/Outfits';
import { Settings } from './pages/Settings';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/luggages" element={<Luggages />} />
          <Route path="/items" element={<Items />} />
          <Route path="/outfits" element={<Outfits />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
