import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { StatsChart } from '../components/StatsChart';
import { Package, AlertTriangle, TrendingUp, ChevronDown, ChevronUp, RefreshCw, ChevronRight, History } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

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

interface RestockHistory {
  item_name: string;
  last_restock: string;
  days_between_restocks: number | null;
}

export function Stats() {
  const [items, setItems] = useState<Item[]>([]);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<'details' | 'restock' | null>(null);
  const [historyData, setHistoryData] = useState<HistoryPoint[]>([]);
  const [lowStockItems, setLowStockItems] = useState<Item[]>([]);
  const [restockHistory, setRestockHistory] = useState<RestockHistory[]>([]);
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

  useEffect(() => {
    async function loadRestockHistory() {
      const { data, error } = await supabase
        .from('inventory_history')
        .select(`
          item_id,
          created_at,
          items (
            name
          )
        `)
        .eq('type', 'add')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading restock history:', error);
        return;
      }

      // Process the data to calculate time between restocks
      const historyByItem = data.reduce((acc: { [key: string]: { dates: string[], name: string } }, record) => {
        const itemId = record.item_id;
        if (!acc[itemId]) {
          acc[itemId] = {
            dates: [],
            name: record.items.name
          };
        }
        acc[itemId].dates.push(record.created_at);
        return acc;
      }, {});

      const processedHistory = Object.entries(historyByItem).map(([_, info]) => {
        const sortedDates = info.dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        const lastRestock = sortedDates[0];
        
        // Calculate average days between restocks if there are at least 2 restocks
        let daysBetweenRestocks = null;
        if (sortedDates.length >= 2) {
          const timeDiffs = sortedDates.slice(0, -1).map((date, index) => {
            const currentDate = new Date(date);
            const nextDate = new Date(sortedDates[index + 1]);
            return (currentDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24);
          });
          daysBetweenRestocks = Math.round(timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length);
        }

        return {
          item_name: info.name,
          last_restock: lastRestock,
          days_between_restocks: daysBetweenRestocks
        };
      });

      setRestockHistory(processedHistory);
    }

    loadRestockHistory();
  }, []);

  const toggleItemExpansion = async (itemId: string) => {
    if (expandedItemId === itemId) {
      setExpandedItemId(null);
      setExpandedSection(null);
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
  
  const renderRestockHistory = () => (
    <div className="bg-white shadow rounded-lg mt-4">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Historial de Reposiciones</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {restockHistory.map((record, index) => (
          <div key={index} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-gray-900">{record.item_name}</h4>
                <p className="text-sm text-gray-500">
                  Última reposición: {formatDistanceToNow(new Date(record.last_restock), { addSuffix: true, locale: es })}
                </p>
              </div>
              {record.days_between_restocks !== null && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {record.days_between_restocks} días entre reposiciones
                </span>
              )}
            </div>
          </div>
        ))}
        {restockHistory.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            No hay historial de reposiciones
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 px-4 py-4">Estadísticas</h1>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 mb-4">
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

          <div className="bg-white p-4">
            <button 
              onClick={() => setExpandedSection(expandedSection === 'restock' ? null : 'restock')}
              className="w-full h-full flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm font-medium text-gray-600">Reposiciones</p>
                <p className="mt-1 text-3xl font-semibold text-gray-900">{restockHistory.length}</p>
              </div>
              <div className="p-3 bg-indigo-50 rounded-lg flex items-center space-x-2">
                <History className="w-6 h-6 text-indigo-600" />
                {expandedSection === 'restock' ? (
                  <ChevronUp className="w-4 h-4 text-indigo-600" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-indigo-600" />
                )}
              </div>
            </button>
          </div>

          <div className="bg-white p-4 relative">
            <button 
              onClick={() => setExpandedSection(expandedSection === 'details' ? null : 'details')}
              className="w-full flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm font-medium text-gray-600">Necesitan Reposición</p>
                <p className="mt-1 text-3xl font-semibold text-gray-900">{stats.itemsNeedingRestock}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg flex items-center space-x-2">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                {expandedSection === 'details' ? (
                  <ChevronUp className="w-4 h-4 text-red-600" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-red-600" />
                )}
              </div>
            </button>
          </div>
        </div>
      )}

      {expandedSection === 'restock' && renderRestockHistory()}

      {expandedSection === 'details' && (
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