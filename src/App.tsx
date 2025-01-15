import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Home } from './pages/Home';
import { Item } from './pages/Item';
import { Stats } from './pages/Stats';
import { BarChart3, Package } from 'lucide-react';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
          <div className="flex justify-around py-2">
            <Link
              to="/"
              className="flex flex-col items-center px-3 py-2 text-sm text-gray-600 hover:text-indigo-600"
            >
              <Package className="h-6 w-6" />
              <span className="mt-1">Inventario</span>
            </Link>
            <Link
              to="/stats"
              className="flex flex-col items-center px-3 py-2 text-sm text-gray-600 hover:text-indigo-600"
            >
              <BarChart3 className="h-6 w-6" />
              <span className="mt-1">Estadísticas</span>
            </Link>
          </div>
        </nav>

        <main className="pb-20">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/item/:id" element={<Item />} />
            <Route path="/stats" element={<Stats />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
