import React, { useState } from 'react';
import { useConsoleStore } from '../../store/useConsoleStore';
import { Trash2, Plus, Power, Save } from 'lucide-react';

const ConsoleManager = () => {
    const { consoles, addConsole, deleteConsole, toggleConsole, updateConsole } = useConsoleStore();
    const [newConsoleName, setNewConsoleName] = useState('');
    const [newConsoleIcon, setNewConsoleIcon] = useState('');

    const handleAdd = (e) => {
        e.preventDefault();
        if (!newConsoleName.trim()) return;
        addConsole(newConsoleName.trim(), newConsoleIcon.trim());
        setNewConsoleName('');
        setNewConsoleIcon('');
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-gray-800">Gestión de Plataformas</h3>
                <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">Total: {consoles.length}</span>
            </div>

            <div className="p-6">
                {/* Add New Console */}
                <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8 items-end">
                    <div className="md:col-span-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Nombre</label>
                        <input
                            type="text"
                            value={newConsoleName}
                            onChange={(e) => setNewConsoleName(e.target.value)}
                            placeholder="Ej: Xbox Series X"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red outline-none text-gray-900 bg-white text-sm"
                        />
                    </div>
                    <div className="md:col-span-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Logo URL (Opcional)</label>
                        <input
                            type="text"
                            value={newConsoleIcon}
                            onChange={(e) => setNewConsoleIcon(e.target.value)}
                            placeholder="https://..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red outline-none text-gray-900 bg-white text-sm"
                        />
                    </div>
                    <div>
                        <button
                            type="submit"
                            disabled={!newConsoleName.trim()}
                            className="w-full px-4 py-2 bg-brand-red text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm h-[38px]"
                        >
                            <Plus size={18} /> Agregar
                        </button>
                    </div>
                </form>

                {/* Consoles List */}
                <div className="space-y-3">
                    {consoles.map((console) => (
                        <div
                            key={console.id}
                            className={`flex flex - col md: flex - row items - center justify - between p - 4 rounded - lg border gap - 4 transition - all ${console.active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-60'} `}
                        >
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <span className={`w - 3 h - 3 rounded - full flex - shrink - 0 ${console.active ? 'bg-green-500' : 'bg-gray-400'} `}></span>

                                {/* Icon Preview */}
                                <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {console.iconUrl ? (
                                        <img src={console.iconUrl} alt={console.name} className="w-8 h-8 object-contain" onError={(e) => e.target.style.display = 'none'} />
                                    ) : (
                                        <span className="text-xs text-gray-400 font-bold">ICON</span>
                                    )}
                                </div>

                                <div className="flex flex-col">
                                    <span className="font-medium text-gray-900">{console.name}</span>
                                    <span className="text-xs text-gray-400 font-mono">ID: {console.id}</span>
                                </div>
                            </div>

                            {/* Edit Icon URL Inline */}
                            <div className="flex-1 w-full md:w-auto md:mx-4">
                                <input
                                    type="text"
                                    defaultValue={console.iconUrl || ''}
                                    onBlur={(e) => {
                                        if (e.target.value !== console.iconUrl) {
                                            updateConsole(console.id, { iconUrl: e.target.value });
                                        }
                                    }}
                                    placeholder="Pegar URL del icono..."
                                    className="w-full text-xs px-2 py-1 border border-gray-200 rounded text-gray-600 focus:border-brand-red outline-none bg-gray-50 focus:bg-white transition-colors"
                                />
                            </div>

                            <div className="flex items-center gap-2 self-end md:self-auto">
                                <button
                                    onClick={() => toggleConsole(console.id)}
                                    title={console.active ? "Desactivar" : "Activar"}
                                    className={`p - 2 rounded - lg transition - colors ${console.active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-200'} `}
                                >
                                    <Power size={18} />
                                </button>

                                <button
                                    onClick={() => {
                                        if (window.confirm(`¿Eliminar ${console.name}? Esto podría afectar productos existentes.`)) {
                                            deleteConsole(console.id);
                                        }
                                    }}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Eliminar"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {consoles.length === 0 && (
                        <p className="text-center text-gray-500 py-4 italic">No hay consolas registradas.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConsoleManager;
