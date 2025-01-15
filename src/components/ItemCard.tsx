import React from 'react';
import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';

interface ItemCardProps {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  currentUnits: number;
  restockPoint: number;
}

export function ItemCard({ id, name, description, imageUrl, currentUnits, restockPoint }: ItemCardProps) {
  const needsRestock = currentUnits <= restockPoint;

  return (
    <Link to={`/item/${id}`} className="block">
      <div className="bg-white rounded-lg shadow p-4 flex items-center space-x-4">
        <div className="flex-shrink-0 w-16">
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="w-16 h-16 rounded-lg object-cover" />
          ) : (
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1 mr-2">
              <h3 className="text-base font-semibold text-gray-900 truncate">{name}</h3>
              {description && (
                <p className="mt-1 text-sm text-gray-600 line-clamp-1">{description}</p>
              )}
            </div>
            {needsRestock && (
              <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 whitespace-nowrap">
                Reponer
              </span>
            )}
          </div>
          <div className="mt-1">
            <span className="text-sm text-gray-600">
              {currentUnits} unidades
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}