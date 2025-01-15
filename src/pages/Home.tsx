import React, { useEffect, useState } from 'react';
import { Plus, Search, QrCode } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ItemCard } from '../components/ItemCard';
import QrScanner from 'qr-scanner';

interface Item {
  id: string;
  name: string;
  description: string;
  image_url: string;
  current_units: number;
  restock_point: number;
}

export function Home() {
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
      const { data, error } = await supabase
        .from('items')
        .select('id, name, description, image_url, current_units, restock_point')
        .order('name');

      if (error) {
        console.error('Error loading items:', error);
        return;
      }

      setItems(data);
      setLoading(false);
    }

    loadItems();
  }, []);

  const handleScan = async () => {
    setScanning(true);
    try {
      const videoElement = document.createElement('video');
      const scanner = new QrScanner(
        videoElement,
        result => {
          const url = new URL(result.data);
          const path = url.pathname;
          if (path.startsWith('/item/')) {
            scanner.stop();
            setScanning(false);
            navigate(path);
          }
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      await scanner.start();

      const dialog = document.createElement('dialog');
      dialog.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
      
      const container = document.createElement('div');
      container.className = 'bg-white p-4 rounded-lg shadow-lg max-w-sm w-full mx-4';
      
      const header = document.createElement('div');
      header.className = 'flex justify-between items-center mb-4';
      
      const title = document.createElement('h3');
      title.className = 'text-lg font-medium';
      title.textContent = 'Escanear Código QR';
      
      const closeButton = document.createElement('button');
      closeButton.className = 'text-gray-500 hover:text-gray-700';
      closeButton.innerHTML = '&times;';
      closeButton.onclick = () => {
        scanner.stop();
        dialog.remove();
        setScanning(false);
      };
      
      header.appendChild(title);
      header.appendChild(closeButton);
      
      const videoContainer = document.createElement('div');
      videoContainer.className = 'aspect-square bg-black rounded-lg overflow-hidden';
      videoContainer.appendChild(videoElement);
      
      container.appendChild(header);
      container.appendChild(videoContainer);
      dialog.appendChild(container);
      
      document.body.appendChild(dialog);
      dialog.showModal();
    } catch (error) {
      console.error('Error accessing camera:', error);
      setScanning(false);
      alert('No se pudo acceder a la cámara. Por favor, verifica los permisos.');
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