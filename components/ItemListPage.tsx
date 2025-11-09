

import React, { useState, useMemo, useEffect } from 'react';
import { Item } from '../types';
import { TrashIcon, PlusIcon } from './Icons';

interface ItemListPageProps {
  items: Item[];
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
  formatCurrency: (amount: number) => string;
  onDone: () => void;
}

const emptyFormState: Omit<Item, 'id' | 'price'> & { id: number | null; price: string; category: string } = {
  id: null,
  description: '',
  price: '',
  category: '',
};


const CategoryManager: React.FC<{
    categories: string[],
    setCategories: React.Dispatch<React.SetStateAction<string[]>>,
    items: Item[],
    setItems: React.Dispatch<React.SetStateAction<Item[]>>
}> = ({ categories, setCategories, items, setItems }) => {
    const [newCategory, setNewCategory] = useState('');
    const [editingCategory, setEditingCategory] = useState<{ oldName: string; newName: string } | null>(null);

    const handleAddCategory = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = newCategory.trim();
        if (trimmed && !categories.includes(trimmed)) {
            setCategories(prev => [...prev, trimmed].sort());
            setNewCategory('');
        }
    };

    const handleUpdateCategory = (oldName: string) => {
        if (!editingCategory || !editingCategory.newName.trim() || editingCategory.newName === oldName) {
            setEditingCategory(null);
            return;
        }

        const newName = editingCategory.newName.trim();
        
        if (categories.includes(newName)) {
            alert(`Category "${newName}" already exists.`);
            return;
        }
        
        // Update category in the categories list
        setCategories(prev => prev.map(c => c === oldName ? newName : c).sort());
        
        // Update items with the old category
        setItems(prevItems => prevItems.map(item => item.category === oldName ? { ...item, category: newName } : item));

        setEditingCategory(null);
    };

    const handleDeleteCategory = (categoryToDelete: string) => {
        if (window.confirm(`Are you sure you want to delete the "${categoryToDelete}" category? Items in this category will become uncategorized.`)) {
            // Remove category from list
            setCategories(prev => prev.filter(c => c !== categoryToDelete));
            
            // Un-categorize items
            setItems(prevItems => prevItems.map(item => item.category === categoryToDelete ? { ...item, category: '' } : item));
        }
    };

    return (
        <div className="bg-slate-50 p-6 rounded-lg mb-8 border border-slate-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Manage Categories</h3>
            <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-2 mb-4">
                <input
                    type="text"
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    placeholder="Add new category"
                    className="flex-grow p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                />
                <button type="submit" className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700 flex items-center justify-center gap-2">
                    <PlusIcon /> Add
                </button>
            </form>
            <div className="space-y-2">
                {categories.length > 0 ? categories.map(cat => (
                    <div key={cat} className="flex justify-between items-center bg-white p-2 rounded border">
                        {editingCategory?.oldName === cat ? (
                            <input
                                type="text"
                                value={editingCategory.newName}
                                onChange={e => setEditingCategory({ ...editingCategory, newName: e.target.value })}
                                onBlur={() => handleUpdateCategory(cat)}
                                onKeyDown={e => e.key === 'Enter' && handleUpdateCategory(cat)}
                                autoFocus
                                className="p-1 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                            />
                        ) : (
                            <span className="text-slate-700">{cat}</span>
                        )}
                        <div className="flex gap-2">
                            <button onClick={() => setEditingCategory({ oldName: cat, newName: cat })} className="font-semibold text-indigo-600 text-sm py-1 px-2 rounded-lg hover:bg-indigo-50">Edit</button>
                            <button onClick={() => handleDeleteCategory(cat)} className="font-semibold text-red-600 text-sm py-1 px-2 rounded-lg hover:bg-red-50">Delete</button>
                        </div>
                    </div>
                )) : <p className="text-slate-500 text-center text-sm py-2">No categories created yet.</p>}
            </div>
        </div>
    );
};

const BulkEditModal: React.FC<{
    itemCount: number;
    categories: string[];
    onSave: (category: string) => void;
    onCancel: () => void;
}> = ({ itemCount, categories, onSave, onCancel }) => {
    const [targetCategory, setTargetCategory] = useState('');

    const handleSave = () => {
        onSave(targetCategory.trim());
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
                <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Assign Category to {itemCount} items</h3>
                    <p className="text-sm text-gray-600 mb-4">Select an existing category from the list or type a new one to create it.</p>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Category</label>
                        <input
                            type="text"
                            list="category-list-bulk"
                            placeholder="Select or type category"
                            value={targetCategory}
                            onChange={e => setTargetCategory(e.target.value)}
                            className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                            autoFocus
                        />
                        <datalist id="category-list-bulk">
                            {categories.map(cat => <option key={cat} value={cat} />)}
                        </datalist>
                    </div>
                </div>
                <div className="bg-slate-50 p-4 flex justify-end gap-4 border-t">
                    <button type="button" onClick={onCancel} className="bg-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300">Cancel</button>
                    <button type="button" onClick={handleSave} className="bg-indigo-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:bg-indigo-700">Apply</button>
                </div>
            </div>
        </div>
    );
};


const ItemListPage: React.FC<ItemListPageProps> = ({ items, setItems, formatCurrency, onDone }) => {
  const [formState, setFormState] = useState(emptyFormState);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  
  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('itemCategories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed as string[];
        }
      }
    } catch (e) {
      console.error('Failed to load categories from localStorage', e);
    }
    return [];
  });

  useEffect(() => {
    // One-time migration for users who have categories on items but not the new managed list
    if (localStorage.getItem('itemCategories') === null) {
        // FIX: Add a guard to ensure `items` is an array before calling `.map`.
        if (Array.isArray(items)) {
            const initialCategories = Array.from(new Set(items.map(i => i.category).filter(Boolean))) as string[];
            if (initialCategories.length > 0) {
                setCategories(initialCategories.sort());
            }
        }
    }
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem('itemCategories', JSON.stringify(categories));
    } catch (e) {
      console.error('Failed to save categories to localStorage', e);
    }
  }, [categories]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const filteredItems = useMemo(() => {
    // FIX: Ensure `items` is an array before filtering to prevent runtime errors.
    if (!Array.isArray(items)) return [];
    return items.filter(item => {
        const matchesSearch = searchQuery ? item.description.toLowerCase().includes(searchQuery.toLowerCase()) : true;
        const matchesCategory = categoryFilter !== 'All' ? ((item.category || 'Uncategorized') === categoryFilter) : true;
        return matchesSearch && matchesCategory;
    });
  }, [items, searchQuery, categoryFilter]);

  const groupedItems = useMemo(() => {
    return filteredItems.reduce<Record<string, Item[]>>((acc, item) => {
      const category = item.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {});
  }, [filteredItems]);


  const handleSaveItem = () => {
    const price = parseFloat(formState.price);
    if (!formState.description || isNaN(price)) return;
    
    const trimmedDescription = formState.description.trim();
    const newCategory = formState.category.trim();

    if (newCategory && !categories.includes(newCategory)) {
        setCategories(prev => [...prev, newCategory].sort());
    }

    if (isEditing && formState.id) {
      const updatedItem: Item = {
        id: formState.id,
        description: trimmedDescription,
        price: price,
        category: newCategory,
      };
      setItems(prev => prev.map(i => (i.id === updatedItem.id ? updatedItem : i)));
    } else {
      setItems(prev => [{ id: Date.now(), description: trimmedDescription, price, category: newCategory }, ...prev]);
    }
    setFormState(emptyFormState);
    setIsEditing(false);
  };
  
  const handleEditItem = (item: Item) => {
    setFormState({...item, price: String(item.price), category: item.category || ''});
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
      setSelectedIds(new Set(filteredItems.map(i => i.id)));
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
  
  const handleBulkAssignCategory = (newCategory: string) => {
      setItems(prevItems => prevItems.map(item =>
          selectedIds.has(item.id) ? { ...item, category: newCategory } : item
      ));

      if (newCategory && !categories.includes(newCategory)) {
          setCategories(prev => [...prev, newCategory].sort());
      }

      setSelectedIds(new Set());
      setIsBulkEditModalOpen(false);
  };

  const isAllSelected = filteredItems.length > 0 && selectedIds.size === filteredItems.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < filteredItems.length;
  
  const categoryFilterOptions = useMemo(() => ['All', ...categories, 'Uncategorized'], [categories]);

  return (
    <main className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto bg-white p-4 sm:p-8 rounded-lg shadow-md">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6 border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-800">Manage Items</h2>
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600">{selectedIds.size} selected</span>
                <button onClick={() => setIsBulkEditModalOpen(true)} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-colors">
                    Assign Category
                </button>
                <button onClick={handleDeleteSelected} className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-red-700 flex items-center gap-2 transition-all duration-200">
                    <TrashIcon />
                    Delete
                </button>
            </div>
          )}
        </div>
        
        <CategoryManager
            categories={categories}
            setCategories={setCategories}
            items={items}
            setItems={setItems}
        />

        <div className="bg-slate-50 p-6 rounded-lg mb-8 border border-slate-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">{isEditing ? 'Edit Item' : 'Add New Item'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <textarea name="description" placeholder="Item Description" value={formState.description} onChange={handleInputChange} rows={3} className="md:col-span-2 w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"/>
                <input type="number" name="price" placeholder="Price" value={formState.price} onChange={handleInputChange} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"/>
                <div>
                  <input
                    type="text"
                    name="category"
                    list="category-list"
                    placeholder="Category (optional)"
                    value={formState.category}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <datalist id="category-list">
                    {categories.map(cat => <option key={cat} value={cat} />)}
                  </datalist>
                </div>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <input
                    type="text"
                    placeholder="Search items by description..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="md:col-span-2 w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    aria-label="Search items"
                />
                <select 
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                    {categoryFilterOptions.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
            </div>
            {/* FIX: Added an Array.isArray check for `items` before accessing its `length` property to prevent potential runtime errors if `items` is not an array. */}
            {(!Array.isArray(items) || items.length === 0) ? (
                <p className="text-slate-500 text-center py-4 bg-slate-50 rounded-lg">No items saved yet.</p>
            ) : (
                <>
                    <div className="flex items-center p-2 rounded-t-lg bg-slate-50 border-b">
                        <input 
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            onChange={handleSelectAll}
                            checked={isAllSelected}
                            ref={el => { if (el) { el.indeterminate = isIndeterminate; } }}
                        />
                        <label className="ml-3 text-sm font-medium text-gray-600">Select All</label>
                    </div>
                    <div className="space-y-4">
                        {Object.keys(groupedItems).length > 0 ? (
                          Object.entries(groupedItems).sort(([a], [b]) => a.localeCompare(b)).map(([category, itemsInCategory]) => (
                            <div key={category}>
                              <h4 className="font-bold text-sm uppercase text-slate-500 bg-slate-100 p-2 rounded-t-md mt-4">{category}</h4>
                              {/* FIX: Add an Array.isArray check before mapping over itemsInCategory to prevent runtime errors if the value is not an array. */}
                              {Array.isArray(itemsInCategory) && itemsInCategory.map(item => (
                                <div key={item.id} className={`p-4 border-x border-b flex flex-wrap justify-between items-center gap-x-4 gap-y-2 ${selectedIds.has(item.id) ? 'bg-indigo-50 border-indigo-200' : 'bg-white'}`}>
                                    <div className="flex items-start">
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
                                    <div className="flex gap-2 flex-shrink-0 ml-auto sm:ml-0">
                                        <button onClick={() => handleEditItem(item)} className="font-semibold text-indigo-600 py-1 px-3 rounded-lg hover:bg-indigo-100">Edit</button>
                                        <button onClick={() => handleDeleteItem(item.id)} className="font-semibold text-red-600 py-1 px-3 rounded-lg hover:bg-red-100">Delete</button>
                                    </div>
                                </div>
                              ))}
                            </div>
                          ))
                        ) : (
                            <p className="text-slate-500 text-center py-4 bg-slate-50 rounded-lg">No items match your search or filter.</p>
                        )}
                    </div>
                </>
            )}
        </div>
      </div>
       {isBulkEditModalOpen && (
            <BulkEditModal
                itemCount={selectedIds.size}
                categories={categories}
                onSave={handleBulkAssignCategory}
                onCancel={() => setIsBulkEditModalOpen(false)}
            />
        )}
    </main>
  );
};

export default ItemListPage;
