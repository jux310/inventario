import React, { useEffect, useState } from 'react';
import { Plus, Search, QrCode } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ItemCard } from '../components/ItemCard';
import { QrScannerDialog } from '../components/QrScanner';

export default function Home() {
interface Item {
  id: string;
  name: string;
  description: string;
  image_url: string;
  current_units: number;
  restock_point: number;
}

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  useEffect(() => {
    async function loadItems() {
      try {
        if (!supabase) {
          throw new Error('Supabase client not initialized');
        }

        const { data, error } = await supabase
          .from('items')
          .select('id, name, description, image_url, current_units, restock_point, deleted')
          .eq('deleted', false)
          .order('name');

        if (error) {
          throw error;
        }

        setItems(data || []);
      } catch (error) {
        console.error('Error loading items:', error instanceof Error ? error.message : error);
        // Set empty array to prevent undefined items
        setItems([]);
      }
      setLoading(false);
    }

    loadItems();
  }, []);

  const handleScan = async () => {
    setScanning(true);
  };

  const handleQrResult = (result: string) => {
    try {
      // Check if the result is a valid item URL or just an ID
      let itemPath;
      if (result.includes('/item/')) {
        // If it's a full URL, parse it
        const url = new URL(result);
        itemPath = url.pathname;
      } else {
        // If it's just an ID, construct the path
        itemPath = `/item/${result}`;
      }

      // Validate that we have a proper item path
      if (itemPath.startsWith('/item/') && itemPath.length > 6) {
        setScanning(false);
        navigate(itemPath);
      }
    } catch (error) {
      console.error('Invalid QR code data:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar por nombre o descripción..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <button
              onClick={handleScan}
              disabled={scanning}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <QrCode className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {filteredItems.map((item) => (
            <ItemCard
              key={item.id}
              id={item.id}
              name={item.name}
              description={item.description || ''}
              imageUrl={item.image_url}
              currentUnits={item.current_units}
              restockPoint={item.restock_point}
            />
          ))}
          {filteredItems.length === 0 && searchQuery && (
            <div className="text-center py-8">
              <p className="text-gray-500">No se encontraron ítems que coincidan con la búsqueda</p>
            </div>
          )}
        </div>
      </div>
      
      <QrScannerDialog
        isOpen={scanning}
        onClose={() => setScanning(false)}
        onScan={handleQrResult}
      />

      <Link
        to="/item/new"
        className="fixed right-4 bottom-24 inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <Plus className="h-6 w-6" />
        <span className="sr-only">Nuevo Ítem</span>
      </Link>
    </div>
  );
}