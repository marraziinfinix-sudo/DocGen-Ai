import React, { useState } from 'react';
import { Item } from '../types';

interface ItemListPageProps {
  items: Item[];
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
  formatCurrency: (amount: number) => string;
  onDone: () => void;
}

// FIX: Changed the type definition to correctly handle the price as a string for the form input.
// `Omit<Item, 'id' | 'price'>` prevents a type conflict on the `price` property, which was previously `number & string`, resulting in `never`.
const emptyFormState: Omit<Item, 'id' | 'price'> & { id: number | null; price: string } = {
  id: null,
  description: '',
  price: '',
};

const ItemListPage: React.FC<ItemListPageProps> = ({ items, setItems, formatCurrency, onDone }) => {
  const [formState, setFormState] = useState(emptyFormState);
  const [isEditing, setIsEditing] = useState(false);

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
      setItems(prev => [...prev, { id: Date.now(), description: formState.description, price }]);
    }
    setFormState(emptyFormState);
    setIsEditing(false);
  };
  
  const handleEditItem = (item: Item) => {
    setFormState({...item, price: String(item.price)});
    setIsEditing(true);
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

  return (
    <main className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">Manage Items</h2>

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
            <div className="space-y-3">
                {items.length > 0 ? items.map(item => (
                    <div key={item.id} className="bg-white p-4 rounded-lg shadow-sm border flex justify-between items-center">
                        <div>
                            <p className="font-bold text-slate-800">{item.description}</p>
                            <p className="text-sm text-slate-500">{formatCurrency(item.price)}</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => handleEditItem(item)} className="font-semibold text-indigo-600 py-1 px-3 rounded-lg hover:bg-indigo-50">Edit</button>
                            <button onClick={() => handleDeleteItem(item.id)} className="font-semibold text-red-600 py-1 px-3 rounded-lg hover:bg-red-50">Delete</button>
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