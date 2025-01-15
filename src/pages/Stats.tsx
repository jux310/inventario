import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { StatsChart } from '../components/StatsChart';
import { Package, AlertTriangle, TrendingUp, ChevronDown, ChevronUp, RefreshCw, ChevronRight } from 'lucide-react';

interface Item {
  id: string;
  name: string;
  current_units: number;
  restock_point: number;
}

interface HistoryPoint {
  created_at: string;
  units: number;
}

export function Stats() {
  const [items, setItems] = useState<Item[]>([]);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<HistoryPoint[]>([]);
  const [lowStockItems, setLowStockItems] = useState<Item[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const stats = useMemo(() => {
    if (!items.length) return null;
    const totalStock = items.reduce((sum, item) => sum + item.current_units, 0);
    const totalItems = items.length;
    const itemsNeedingRestock = items.filter(
      item => item.current_units <= item.restock_point
    ).length;
    return {
      totalStock,
      totalItems,
      itemsNeedingRestock
    };
  }, [items]);

  useEffect(() => {
    async function loadItems() {
      setLoading(true);
      setError(null);

      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select('id, name, current_units, restock_point')
        .order('name');

      if (itemsError) {
        console.error('Error loading items:', itemsError);
        setError('No se pudieron cargar los datos. Por favor, intente nuevamente.');
        setLoading(false);
        return;
      }

      setItems(itemsData);
      setLowStockItems(itemsData.filter(item => item.current_units <= item.restock_point));
      setLoading(false);
    }

    loadItems();
  }, []);

  const toggleItemExpansion = async (itemId: string) => {
    if (expandedItemId === itemId) {
      setExpandedItemId(null);
      return;
    }

    setError(null);
    const { data, error } = await supabase
      .from('inventory_history')
      .select('created_at, units, type')
      .limit(100)
      .eq('item_id', itemId)
      .order('created_at');

    if (error) {
      console.error('Error loading history:', error);
      setError('No se pudo cargar el historial. Por favor, intente nuevamente.');
      return;
    }

    // Calculate running total
    let runningTotal = 0;
    const chartData = data.map(record => {
      runningTotal += record.type === 'add' ? record.units : -record.units;
      return {
        date: record.created_at,
        units: runningTotal
      };
    });

    setHistoryData(chartData);
    setExpandedItemId(itemId);
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
          <button onClick={() => window.location.reload()} className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
            <RefreshCw className="h-4 w-4 mr-2" /> Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 px-4 py-4">Estadísticas</h1>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 mb-4">
          <div className="bg-white p-4">
            <div className="w-full flex items-center justify-between">
              <div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-600">Total de Ítems</p>
                  <p className="mt-1 text-3xl font-semibold text-gray-900 text-left">{stats.totalItems}</p>
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm font-medium text-gray-600">Stock Total</p>
                <p className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalStock}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 relative">
            <button 
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm font-medium text-gray-600">Necesitan Reposición</p>
                <p className="mt-1 text-3xl font-semibold text-gray-900">{stats.itemsNeedingRestock}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg flex items-center space-x-2">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                {showDetails ? (
                  <ChevronUp className="w-4 h-4 text-red-600" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-red-600" />
                )}
              </div>
            </button>
          </div>
        </div>
      )}

      {showDetails && (
        <div className="bg-white">
          <div className="border-t border-gray-100">
            {lowStockItems.map((item) => (
              <div key={item.id} className="border-b border-gray-100">
                <button
                  onClick={() => toggleItemExpansion(item.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-2">
                    {expandedItemId === item.id ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <span className="text-red-600">{item.current_units} / {item.restock_point}</span>
                </button>
                {expandedItemId === item.id && (
                  <div className="p-4 bg-gray-50">
                    <div className="h-[200px]">
                      <StatsChart
                        data={historyData}
                        title={item.name}
                        restockPoint={item.restock_point}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          {lowStockItems.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-500" />
              No hay ítems por debajo del punto de reposición
            </div>
          )}
          </div>
        </div>
      )}
    </div>
  );
}