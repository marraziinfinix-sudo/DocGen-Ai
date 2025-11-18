import React, { useState, useMemo } from 'react';
import { Client } from '../types';
import { TrashIcon, PencilIcon } from './Icons';

interface ClientListPageProps {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  onDone: () => void;
}

const emptyFormState: Omit<Client, 'id'> & { id: number | null } = {
  id: null,
  name: '',
  address: '',
  email: '',
  phone: '',
};

const ClientListPage: React.FC<ClientListPageProps> = ({ clients, setClients, onDone }) => {
  const [formState, setFormState] = useState(emptyFormState);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const filteredClients = useMemo(() => {
    if (!Array.isArray(clients)) return [];
    if (!searchQuery) {
        return clients;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    return clients.filter(client =>
        client.name.toLowerCase().includes(lowercasedQuery) ||
        (client.email && client.email.toLowerCase().includes(lowercasedQuery)) ||
        (client.phone && client.phone.toLowerCase().includes(lowercasedQuery))
    );
  }, [clients, searchQuery]);

  const handleSaveClient = () => {
    if (!formState.name) return;
    if (isEditing && formState.id) {
      setClients(prevClients => prevClients.map(c => c.id === formState.id ? { ...formState, id: c.id } : c));
    } else {
      setClients(prevClients => [{ ...formState, id: Date.now() }, ...prevClients]);
    }
    setFormState(emptyFormState);
    setIsEditing(false);
  };
  
  const handleEditClient = (client: Client) => {
    setFormState(client);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClient = (id: number) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
        setClients(prev => prev.filter(c => c.id !== id));
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
      setSelectedIds(new Set(filteredClients.map(c => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedIds.size} selected client(s)? This action cannot be undone.`)) {
      setClients(prev => prev.filter(c => !selectedIds.has(c.id)));
      setSelectedIds(new Set());
    }
  };

  const isAllSelected = filteredClients.length > 0 && selectedIds.size === filteredClients.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < filteredClients.length;

  return (
    <main className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto bg-white p-4 sm:p-8 rounded-lg shadow-md">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6 border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-800">Manage Clients</h2>
          {selectedIds.size > 0 && (
            <button onClick={handleDeleteSelected} className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-red-700 flex items-center gap-2 transition-all duration-200">
                <TrashIcon />
                Delete ({selectedIds.size})
            </button>
          )}
        </div>

        <div className="bg-slate-50 p-6 rounded-lg mb-8 border border-slate-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">{isEditing ? 'Edit Client' : 'Add New Client'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Name *</label>
                    <input type="text" name="name" placeholder="Client Name" value={formState.name} onChange={handleInputChange} required className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                    <input type="email" name="email" placeholder="client@example.com" value={formState.email} onChange={handleInputChange} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>
                 <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Address</label>
                    <input type="text" name="address" placeholder="Client Address" value={formState.address} onChange={handleInputChange} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
                    <input type="tel" name="phone" placeholder="Client Phone" value={formState.phone} onChange={handleInputChange} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>
            </div>
            <div className="mt-4 flex gap-4">
                <button onClick={handleSaveClient} className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700">
                    {isEditing ? 'Update Client' : 'Save Client'}
                </button>
                {isEditing && (
                    <button onClick={handleCancelEdit} className="bg-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300">
                        Cancel
                    </button>
                )}
            </div>
        </div>

        <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Saved Clients</h3>
            <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-4"
                aria-label="Search clients"
            />
             {(!Array.isArray(clients) || clients.length === 0) ? (
                <p className="text-slate-500 text-center py-4 bg-slate-50 rounded-lg">No clients saved yet.</p>
            ) : (
                <>
                    <div className="hidden sm:grid grid-cols-[auto_2fr_2fr_2fr_1fr] gap-4 p-4 bg-slate-50 rounded-t-lg items-center">
                        <input 
                            type="checkbox" 
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            onChange={handleSelectAll}
                            checked={isAllSelected}
                            ref={el => { if (el) { el.indeterminate = isIndeterminate; } }}
                        />
                        <span className="font-semibold text-slate-600 uppercase text-sm">Name</span>
                        <span className="font-semibold text-slate-600 uppercase text-sm">Email</span>
                        <span className="font-semibold text-slate-600 uppercase text-sm">Phone</span>
                        <span className="font-semibold text-slate-600 uppercase text-sm text-right">Actions</span>
                    </div>
                     <div className="sm:hidden flex items-center p-2 rounded-t-lg bg-slate-50 border-b">
                        <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            onChange={handleSelectAll}
                            checked={isAllSelected}
                            ref={el => { if (el) { el.indeterminate = isIndeterminate; } }}
                            aria-label="Select all clients"
                        />
                        <label className="ml-3 text-sm font-medium text-gray-600">Select All</label>
                    </div>
                    {filteredClients.length > 0 ? (
                        filteredClients.map(client => (
                        <div key={client.id} className={`p-4 border-x border-b sm:border-0 sm:border-b sm:grid sm:grid-cols-[auto_2fr_2fr_2fr_1fr] sm:gap-4 sm:items-center ${selectedIds.has(client.id) ? 'bg-indigo-50 border-indigo-200' : 'bg-white'}`}>
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 hidden sm:block"
                                checked={selectedIds.has(client.id)}
                                onChange={() => handleSelect(client.id)}
                            />
                            {/* Mobile card layout */}
                            <div className="flex items-start sm:hidden">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-1"
                                    checked={selectedIds.has(client.id)}
                                    onChange={() => handleSelect(client.id)}
                                />
                                <div className="ml-4 flex-1">
                                    <p className="font-bold text-slate-800">{client.name}</p>
                                    <p className="text-sm text-slate-500">{client.email}</p>
                                    <p className="text-sm text-slate-500">{client.phone}</p>
                                </div>
                                <div className="mt-2 flex gap-2">
                                    <button onClick={() => handleEditClient(client)} className="p-2 rounded-full text-indigo-600 hover:bg-indigo-100" title="Edit Client">
                                        <PencilIcon />
                                    </button>
                                    <button onClick={() => handleDeleteClient(client.id)} className="p-2 rounded-full text-red-600 hover:bg-red-100" title="Delete Client">
                                        <TrashIcon />
                                    </button>
                                </div>
                            </div>
                            
                            {/* Desktop row layout */}
                            <p className="hidden sm:block font-bold text-slate-800 truncate">{client.name}</p>
                            <p className="hidden sm:block text-slate-500 truncate">{client.email}</p>
                            <p className="hidden sm:block text-slate-500 truncate">{client.phone}</p>
                            <div className="hidden sm:flex gap-2 justify-end">
                                <button onClick={() => handleEditClient(client)} className="font-semibold text-indigo-600 py-1 px-3 rounded-lg hover:bg-indigo-100">Edit</button>
                                <button onClick={() => handleDeleteClient(client.id)} className="font-semibold text-red-600 py-1 px-3 rounded-lg hover:bg-red-100">Delete</button>
                            </div>
                        </div>
                        ))
                    ) : (
                        <p className="text-slate-500 text-center py-4 bg-slate-50 rounded-b-lg">No clients match your search.</p>
                    )}
                </>
            )}
        </div>
        <div className="mt-8 text-right">
            <button onClick={onDone} className="bg-slate-500 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:bg-slate-600 transition-colors duration-200">
                Done
            </button>
        </div>
      </div>
    </main>
  );
};

export default ClientListPage;