import React, { useState } from 'react';
import { Client, Details } from '../types';

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveClient = () => {
    if (!formState.name) return;

    if (isEditing && formState.id) {
      setClients(prev => prev.map(c => c.id === formState.id ? { ...formState, id: c.id } : c));
    } else {
      setClients(prev => [...prev, { ...formState, id: Date.now() }]);
    }
    setFormState(emptyFormState);
    setIsEditing(false);
  };
  
  const handleEditClient = (client: Client) => {
    setFormState(client);
    setIsEditing(true);
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

  return (
    <main className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">Manage Clients</h2>

        <div className="bg-slate-50 p-6 rounded-lg mb-8 border border-slate-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">{isEditing ? 'Edit Client' : 'Add New Client'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" name="name" placeholder="Client Name" value={formState.name} onChange={handleInputChange} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"/>
                <input type="text" name="address" placeholder="Address" value={formState.address} onChange={handleInputChange} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"/>
                <input type="email" name="email" placeholder="Email" value={formState.email} onChange={handleInputChange} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"/>
                <input type="tel" name="phone" placeholder="Phone" value={formState.phone} onChange={handleInputChange} className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"/>
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
            <div className="space-y-3">
                {clients.length > 0 ? clients.map(client => (
                    <div key={client.id} className="bg-white p-4 rounded-lg shadow-sm border flex justify-between items-center">
                        <div>
                            <p className="font-bold text-slate-800">{client.name}</p>
                            <p className="text-sm text-slate-500">{client.email} &bull; {client.phone}</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => handleEditClient(client)} className="font-semibold text-indigo-600 py-1 px-3 rounded-lg hover:bg-indigo-50">Edit</button>
                            <button onClick={() => handleDeleteClient(client.id)} className="font-semibold text-red-600 py-1 px-3 rounded-lg hover:bg-red-50">Delete</button>
                        </div>
                    </div>
                )) : (
                    <p className="text-slate-500 text-center py-4 bg-slate-50 rounded-lg">No clients saved yet.</p>
                )}
            </div>
        </div>
      </div>
    </main>
  );
};

export default ClientListPage;
