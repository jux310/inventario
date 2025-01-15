import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package, Plus, Minus, ArrowLeft, Save, Upload, QrCode, Pencil, Download, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { QrScannerDialog } from '../components/QrScanner';
import QRCode from 'qrcode';

interface Item {
  id: string;
  name: string;
  description: string;
  image_url: string;
  current_units: number;
  restock_point: number;
}

interface ItemProps {
  mode?: 'edit';
}

export function Item({ mode }: ItemProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [restockPoint, setRestockPoint] = useState(10);
  const [item, setItem] = useState<Item | null>(null);
  const [units, setUnits] = useState(1);
  const [loading, setLoading] = useState(id !== 'new');
  const [uploading, setUploading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDeleteItem() {
    if (!item || !confirm('¿Estás seguro de que quieres mover este ítem a la papelera?')) return;
    
    setDeleting(true);
    const { error } = await supabase
      .from('items')
      .update({ deleted: true })
      .eq('id', item.id);

    if (error) {
      console.error('Error deleting item:', error);
      alert('Error al mover el ítem a la papelera. Por favor, intente nuevamente.');
      setDeleting(false);
      return;
    }

    setDeleting(false);
    navigate('/');
  }

  const handleGenerateQR = async () => {
    if (!item) return;
    setGeneratingQR(true);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Could not get canvas context');
      setGeneratingQR(false);
      return;
    }

    try {
      const url = `https://inventario.anticorr.xyz/item/${item.id}`;
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 1000,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });

      // Load QR code image
      const qrImage = new Image();
      qrImage.src = qrDataUrl;
      
      await new Promise((resolve, reject) => {
        qrImage.onload = resolve;
        qrImage.onerror = reject;
      });

      // Set canvas size
      canvas.width = qrImage.width;
      canvas.height = qrImage.height + 100; // Extra space for title

      // Fill background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add title
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 70px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.name, canvas.width / 2, 50);

      // Draw QR code
      ctx.drawImage(qrImage, 0, 100);

      // Convert to data URL and trigger download
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `qr-${item.name.toLowerCase().replace(/\s+/g, '-')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error('Error generating QR code:', error);
      alert('Error al generar el código QR');
    }
    setGeneratingQR(false);
  };

  const handleScan = async () => {
    setScanning(true);
  };

  const handleQrResult = (result: string) => {
    try {
      const url = new URL(result);
      const path = url.pathname;
      if (path.startsWith('/item/')) {
        setScanning(false);
        navigate(path);
      }
    } catch (error) {
      console.error('Invalid QR code data:', error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (id === 'new') return;
    
    async function loadItem() {
      setLoading(true);
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error loading item:', error);
        navigate('/');
        return;
      }

      setItem(data);
      // Initialize form fields with item data when in edit mode
      if (mode === 'edit' && data) {
        setName(data.name);
        setDescription(data.description || '');
        setRestockPoint(data.restock_point);
        if (data.image_url) {
          setImagePreview(data.image_url);
        }
      }
      setLoading(false);
    }

    loadItem();
  }, [id, navigate, mode]);

  async function handleUpdateItem(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return;
    setUploading(true);

    // Check if name was changed and if so, check for duplicates
    if (name.trim() !== item.name) {
      const { data: existingItems, error: checkError } = await supabase
        .from('items')
        .select('id')
        .ilike('name', name.trim())
        .neq('id', item.id)
        .limit(1);

      if (checkError) {
        setUploading(false);
        console.error('Error checking existing items:', checkError);
        return;
      }

      if (existingItems && existingItems.length > 0) {
        setUploading(false);
        alert('Ya existe un ítem con este nombre. Por favor, use un nombre diferente.');
        return;
      }
    }

    let imageUrl = item.image_url;

    if (image) {
      const fileExt = image.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      
      try {
        // Convert image to blob
        const response = await fetch(imagePreview);
        const blob = await response.blob();
        
        // Upload blob to Supabase
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('items')
          .upload(fileName, blob, {
            cacheControl: '3600',
            contentType: image.type
          });

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          alert('Error al subir la imagen. Por favor, intente nuevamente.');
          setUploading(false);
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('items')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      } catch (error) {
        console.error('Error processing image:', error);
        alert('Error al procesar la imagen. Por favor, intente nuevamente.');
        setUploading(false);
        return;
      }
    }

    const { error } = await supabase
      .from('items')
      .update({
        name: name.trim(),
        description,
        image_url: imageUrl,
        restock_point: restockPoint
      })
      .eq('id', item.id);

    if (error) {
      console.error('Error updating item:', error);
      alert('Error al actualizar el ítem. Por favor, intente nuevamente.');
      setUploading(false);
      return;
    }

    setUploading(false);
    navigate(`/item/${item.id}`);
  }

  async function handleCreateItem(e: React.FormEvent) {
    e.preventDefault();
    setUploading(true);
    
    // Check if an item with the same name already exists
    const { data: existingItems, error: checkError } = await supabase
      .from('items')
      .select('id')
      .ilike('name', name.trim())
      .limit(1);

    if (checkError) {
      setUploading(false);
      console.error('Error checking existing items:', checkError);
      return;
    }

    if (existingItems && existingItems.length > 0) {
      setUploading(false);
      alert('Ya existe un ítem con este nombre. Por favor, use un nombre diferente.');
      return;
    }

    let imageUrl = '';

    if (image) {
      const fileExt = image.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      
      try {
        // Convert image to blob
        const response = await fetch(imagePreview);
        const blob = await response.blob();
        
        // Upload blob to Supabase
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('items')
          .upload(fileName, blob, {
            cacheControl: '3600',
            contentType: image.type
          });

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          alert('Error al subir la imagen. Por favor, intente nuevamente.');
          setUploading(false);
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('items')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      } catch (error) {
        console.error('Error processing image:', error);
        alert('Error al procesar la imagen. Por favor, intente nuevamente.');
        setUploading(false);
        return;
      }
    }

    const { data, error } = await supabase
      .from('items')
      .insert({
        name: name.trim(),
        description,
        image_url: imageUrl,
        restock_point: restockPoint,
        current_units: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating item:', error);
      return;
    }

    setUploading(false);
    navigate(`/item/${data.id}`);
  }

  async function handleUpdateUnits(type: 'add' | 'remove') {
    if (!item) return;
    if (isUpdating) return;

    const newUnits = type === 'add' 
      ? item.current_units + units
      : item.current_units - units;

    if (newUnits < 0) {
      alert('No hay suficientes unidades para retirar');
      return;
    }

    setIsUpdating(true);
    
    // Instantly update the UI
    setItem({ ...item, current_units: newUnits });

    const { error: updateError } = await supabase
      .from('items')
      .update({ current_units: newUnits })
      .eq('id', item.id);

    if (updateError) {
      console.error('Error updating units:', updateError);
      // Revert the UI update if there was an error
      setItem({ ...item, current_units: item.current_units });
      setIsUpdating(false);
      return;
    }

    const { error: historyError } = await supabase
      .from('inventory_history')
      .insert({
        item_id: item.id,
        units,
        type
      });

    if (historyError) {
      console.error('Error recording history:', historyError);
      setIsUpdating(false);
      return;
    }

    setIsUpdating(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (mode === 'edit' && item) {
    return (
      <div className="px-4 py-6">
        <button
          onClick={() => navigate(`/item/${item.id}`)}
          className="mb-6 inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Volver
        </button>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <form onSubmit={handleUpdateItem} className="p-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Editar Ítem</h1>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nombre
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Descripción
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Describe el ítem..."
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="image" className="block text-sm font-medium text-gray-700">
                  Imagen
                </label>
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 h-32 w-32 border-2 border-gray-300 border-dashed rounded-lg overflow-hidden">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Upload className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      id="image"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="sr-only"
                    />
                    <label
                      htmlFor="image"
                      className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <Upload className="h-5 w-5 mr-2" />
                      {imagePreview ? 'Cambiar imagen' : 'Seleccionar imagen'}
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="restockPoint" className="block text-sm font-medium text-gray-700">
                  Punto de reposición
                </label>
                <input
                  type="number"
                  id="restockPoint"
                  required
                  min="0"
                  value={restockPoint}
                  onChange={(e) => setRestockPoint(parseInt(e.target.value) || 0)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-2"
              >
                <Save className="h-5 w-5 mr-2" />
                {uploading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
              <button
                type="button"
                onClick={handleDeleteItem}
                disabled={deleting}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Trash2 className="h-5 w-5 mr-2" />
                {deleting ? 'Moviendo a papelera...' : 'Mover a papelera'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (id === 'new') {
    return (
      <div className="px-4 py-6">
        <button
          onClick={() => navigate('/')}
          className="mb-6 inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Volver
        </button>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <form onSubmit={handleCreateItem} className="p-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Nuevo Ítem</h1>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nombre
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Descripción
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Describe el ítem..."
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="image" className="block text-sm font-medium text-gray-700">
                  Imagen
                </label>
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 h-32 w-32 border-2 border-gray-300 border-dashed rounded-lg overflow-hidden">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Upload className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      id="image"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="sr-only"
                    />
                    <label
                      htmlFor="image"
                      className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <Upload className="h-5 w-5 mr-2" />
                      Seleccionar imagen
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="restockPoint" className="block text-sm font-medium text-gray-700">
                  Punto de reposición
                </label>
                <input
                  type="number"
                  id="restockPoint"
                  required
                  min="0"
                  value={restockPoint}
                  onChange={(e) => setRestockPoint(parseInt(e.target.value) || 0)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Save className="h-5 w-5 mr-2" />
                {uploading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <button
        onClick={() => navigate('/')}
        className="mb-6 inline-flex items-center text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Volver
      </button>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{item?.name}</h1>
            {item?.description && (
              <p className="text-gray-600 mb-6">{item.description}</p>
            )}
            
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Unidades actuales:</span>
                <span className="text-xl font-semibold">{item?.current_units}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Punto de reposición:</span>
                <span className="text-xl font-semibold">{item?.restock_point}</span>
              </div>
              {item && item.current_units <= item.restock_point && (
                <div className="mt-4 p-4 bg-red-50 rounded-md">
                  <p className="text-red-800">
                    ⚠️ El stock está bajo
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="text-gray-600">Unidades:</label>
                <input
                  type="number"
                  min="1"
                  value={units}
                  onChange={(e) => setUnits(Math.max(1, parseInt(e.target.value) || 1))}
                  className="shadow-sm rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div className="flex space-x-4">
                <div className="grid grid-cols-2 gap-4 w-full">
                  <button
                    onClick={() => handleUpdateUnits('remove')}
                    disabled={isUpdating}
                    className={`flex-1 inline-flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                      isUpdating
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                    }`}
                  >
                    <Minus className="h-5 w-5 mr-2" />
                    {isUpdating ? 'Actualizando...' : 'Retirar'}
                  </button>
                  <button
                    onClick={() => handleUpdateUnits('add')}
                    disabled={isUpdating}
                    className={`flex-1 inline-flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                      isUpdating
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                    }`}
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    {isUpdating ? 'Actualizando...' : 'Agregar'}
                  </button>
                </div>
              </div>
              <button
                onClick={handleScan}
                disabled={scanning}
                className="mt-4 w-full inline-flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <QrCode className="h-5 w-5 mr-2" />
                {scanning ? 'Escaneando...' : 'Escanear QR'}
              </button>
            </div>
            
            <QrScannerDialog
              isOpen={scanning}
              onClose={() => setScanning(false)}
              onScan={handleQrResult}
            />

            <div className="mt-8">
              {item?.image_url ? (
                <img
                  className="w-full h-64 object-cover rounded-lg mb-6"
                  src={item.image_url}
                  alt={item.name}
                />
              ) : (
                <div className="w-full h-48 bg-gray-100 flex items-center justify-center rounded-lg mb-6">
                  <Package className="h-16 w-16 text-gray-400" />
                </div>
              )}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <button
                onClick={() => navigate(`/item/${item?.id}/edit`)}
                className="inline-flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Pencil className="h-5 w-5 mr-2" />
                Editar
              </button>
              <button
                onClick={handleGenerateQR}
                disabled={generatingQR}
                className="inline-flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Download className="h-5 w-5 mr-2" />
                {generatingQR ? 'Generando...' : 'QR'}
              </button>
            </div>
          </div>
      </div>
    </div>
  );
}