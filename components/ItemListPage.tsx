import React, { useState } from 'react';
import { Item } from '../types';
import { TrashIcon } from './Icons';

interface ItemListPageProps {
  items: Item[];
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
  formatCurrency: (amount: number) => string;
  onDone: () => void;
}

const emptyFormState: Omit<Item, 'id' | 'price'> & { id: number | null; price: string } = {
  id: null,
  description: '',
  price: '',
};

const ItemListPage: React.FC<ItemListPageProps> = ({ items, setItems, formatCurrency, onDone }) => {
  const [formState, setFormState] = useState(emptyFormState);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveItem = () => {
    const price = parseFloat(formState.price);
    if (!formState.description || isNaN(price)) return;

    if (isEditing && formState.id) {
      setItems(prev => prev.map(i => i.id === formState.id ? { ...formState, id: i.id, price } : i));
    } else {
      setItems(prev => [{ id: Date.now(), description: formState.description, price }, ...prev]);
    }
    setFormState(emptyFormState);
    setIsEditing(false);
  };
  
  const handleEditItem = (item: Item) => {
    setFormState({...item, price: String(item.price)});
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteItem = (id: number) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
        setItems(prev => prev.filter(i => i.id !== id));
    }
  };

  const handleCancelEdit = () => {
    setFormState(emptyFormState);
    setIsEditing(false);
  };
  
  const handleSelect = (id: number) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(items.map(i => i.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedIds.size} selected item(s)? This action cannot be undone.`)) {
      setItems(prev => prev.filter(i => !selectedIds.has(i.id)));
      setSelectedIds(new Set());
    }
  };

  const isAllSelected = items.length > 0 && selectedIds.size === items.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < items.length;

  return (
    <main className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto bg-white p-4 sm:p-8 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-800">Manage Items</h2>
          {selectedIds.size > 0 && (
              <button onClick={handleDeleteSelected} className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-red-700 flex items-center gap-2 transition-all duration-200">
                  <TrashIcon />
                  Delete ({selectedIds.size})
              </button>
          )}
        </div>

        <div className="bg-slate-50 p-6 rounded-lg mb-8 border border-slate-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">{isEditing ? 'Edit Item' : 'Add New Item'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <textarea name="description" placeholder="Item Description" value={formState.description} onChange={handleInputChange} rows={2} className="md:col-span-2 w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"/>
                <input type="number" name="price" placeholder="Price" value={formState.price} onChange={handleInputChange} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"/>
            </div>
            <div className="mt-4 flex gap-4">
                <button onClick={handleSaveItem} className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700">
                    {isEditing ? 'Update Item' : 'Save Item'}
                </button>
                {isEditing && (
                    <button onClick={handleCancelEdit} className="bg-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300">
                        Cancel
                    </button>
                )}
            </div>
        </div>

        <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Saved Items</h3>
             {items.length > 0 && (
                <div className="flex items-center p-2 rounded-t-lg bg-slate-50 border-b">
                    <input 
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        onChange={handleSelectAll}
                        checked={isAllSelected}
                        ref={el => el && (el.indeterminate = isIndeterminate)}
                    />
                    <label className="ml-3 text-sm font-medium text-gray-600">Select All</label>
                </div>
            )}
            <div className="space-y-3">
                {items.length > 0 ? items.map(item => (
                    <div key={item.id} className={`p-4 border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-2 ${selectedIds.has(item.id) ? 'bg-indigo-50 border-indigo-200' : 'bg-white'}`}>
                        <div className="flex items-start w-full sm:w-auto">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-1"
                              checked={selectedIds.has(item.id)}
                              onChange={() => handleSelect(item.id)}
                            />
                            <div className="ml-4">
                                <p className="font-bold text-slate-800">{item.description}</p>
                                <p className="text-sm text-slate-500">{formatCurrency(item.price)}</p>
                            </div>
                        </div>
                        <div className="flex gap-2 self-end sm:self-center flex-shrink-0">
                            <button onClick={() => handleEditItem(item)} className="font-semibold text-indigo-600 py-1 px-3 rounded-lg hover:bg-indigo-100">Edit</button>
                            <button onClick={() => handleDeleteItem(item.id)} className="font-semibold text-red-600 py-1 px-3 rounded-lg hover:bg-red-100">Delete</button>
                        </div>
                    </div>
                )) : (
                    <p className="text-slate-500 text-center py-4 bg-slate-50 rounded-lg">No items saved yet.</p>
                )}
            </div>
        </div>
      </div>
    </main>
  );
};

export default ItemListPage;
