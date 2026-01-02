import React, { useState } from 'react';
import { X, Trash, Plus, Image as ImageIcon, Palette, Loader2, UploadCloud } from 'lucide-react';
import { useCollectionStore } from '../../store/useCollectionStore';
import FadeImage from '../../components/ui/FadeImage';
import { toast } from 'sonner';

const GRADIENT_PRESETS = [
    { label: 'Rojo Marca (Default)', value: 'from-brand-red to-red-900', class: 'bg-gradient-to-br from-brand-red to-red-900' },
    { label: 'Azul Profundo', value: 'from-blue-600 to-indigo-900', class: 'bg-gradient-to-br from-blue-600 to-indigo-900' },
    { label: 'Ámbar / Dorado', value: 'from-amber-500 to-amber-900', class: 'bg-gradient-to-br from-amber-500 to-amber-900' },
    { label: 'Esmeralda / Verde', value: 'from-emerald-600 to-teal-900', class: 'bg-gradient-to-br from-emerald-600 to-teal-900' },
    { label: 'Violeta / Púrpura', value: 'from-purple-600 to-indigo-950', class: 'bg-gradient-to-br from-purple-600 to-indigo-950' },
    { label: 'Oscuro / Negro', value: 'from-gray-800 to-black', class: 'bg-gradient-to-br from-gray-800 to-black' },
];

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const CollectionsModal = ({ isOpen, onClose }) => {
    const { collections, addCollection, deleteCollection } = useCollectionStore();
    const [formData, setFormData] = useState({
        title: '',
        keyword: '',
        bgType: 'gradient', // or 'image'
        color: GRADIENT_PRESETS[0].value,
        imageUrl: '',
        extraOverlay: false
    });
    const [isUploading, setIsUploading] = useState(false);

    if (!isOpen) return null;

    const uploadToCloudinary = async (file) => {
        setIsUploading(true);

        // Debugging logs for environment variables
        console.log('Cloud Name:', CLOUDINARY_CLOUD_NAME);
        console.log('Upload Preset:', CLOUDINARY_UPLOAD_PRESET);

        if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
            toast.error("Configuración de Cloudinary no encontrada. Revise la consola.");
            setIsUploading(false);
            return;
        }

        const data = new FormData();
        data.append('file', file);
        data.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        try {
            const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
            console.log('Uploading to:', url); // Debug URL

            const response = await fetch(url, {
                method: 'POST',
                body: data,
            });

            const result = await response.json();
            console.log('Cloudinary Response:', result); // Debug full response

            if (response.ok && result.secure_url) {
                setFormData(prev => ({ ...prev, imageUrl: result.secure_url }));
                toast.success("Imagen subida correctamente");
            } else {
                // More detailed error message
                const errorMsg = result.error?.message || "Error desconocido";
                toast.error(`Error al subir: ${errorMsg}`);
                console.error("Cloudinary Detailed Error:", result);
            }
        } catch (error) {
            console.error("Upload network error:", error);
            toast.error("Error de conexión al subir imagen");
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
                toast.error("Falta configuración de Cloudinary en .env");
                return;
            }
            uploadToCloudinary(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.title || !formData.keyword) return;

        addCollection(formData);
        setFormData({
            title: '',
            keyword: '',
            bgType: 'gradient',
            color: GRADIENT_PRESETS[0].value,
            imageUrl: '',
            extraOverlay: false
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row">

                {/* LEFT: LIST & PREVIEW */}
                <div className="w-full md:w-1/2 p-6 bg-gray-50 border-r border-gray-100 flex flex-col overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Palette className="text-brand-red" size={24} /> Gestor de Colecciones
                        </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                        {collections.map((col) => (
                            <div key={col.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex justify-between items-center group">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-8 rounded border border-gray-100 overflow-hidden ${col.bgType === 'image' ? '' : `bg-gradient-to-br ${col.color}`}`}>
                                        {col.bgType === 'image' && <img src={col.imageUrl} alt="" className="w-full h-full object-cover" />}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-800 text-sm">{col.title}</div>
                                        <div className="text-xs text-gray-400">Key: {col.keyword}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { if (window.confirm('¿Borrar colección?')) deleteCollection(col.id); }}
                                    className="text-gray-400 hover:text-red-500 p-2 transition-colors"
                                >
                                    <Trash size={16} />
                                </button>
                            </div>
                        ))}
                        {collections.length === 0 && (
                            <p className="text-center text-gray-400 text-sm py-10">No hay colecciones creadas.</p>
                        )}
                    </div>
                </div>

                {/* RIGHT: CREATE FORM */}
                <div className="w-full md:w-1/2 p-6 overflow-y-auto">
                    <div className="flex justify-end mb-2">
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <h3 className="text-lg font-bold text-gray-700 mb-4">Nueva Colección</h3>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1">Título</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red/20 outline-none"
                                placeholder="Ej: Universo Mario"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1">Keyword de Búsqueda</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red/20 outline-none"
                                placeholder="Ej: Mario"
                                value={formData.keyword}
                                onChange={e => setFormData({ ...formData, keyword: e.target.value })}
                                required
                            />
                            <p className="text-xs text-gray-400 mt-1">Se usará para filtrar: /catalog/all?search=[Keyword]</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Tipo de Fondo</label>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded-lg outline-none"
                                    value={formData.bgType}
                                    onChange={e => setFormData({ ...formData, bgType: e.target.value })}
                                >
                                    <option value="gradient">Gradiente (Preset)</option>
                                    <option value="image">Imagen (Cloudinary)</option>
                                </select>
                            </div>

                            {formData.bgType === 'gradient' ? (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 mb-1">Color Preset</label>
                                    <select
                                        className="w-full p-2 border border-gray-300 rounded-lg outline-none"
                                        value={formData.color}
                                        onChange={e => setFormData({ ...formData, color: e.target.value })}
                                    >
                                        {GRADIENT_PRESETS.map(preset => (
                                            <option key={preset.value} value={preset.value}>{preset.label}</option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 mb-1">Subir Imagen</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            id="file-upload"
                                        />
                                        <label
                                            htmlFor="file-upload"
                                            className={`flex-1 p-2 border border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                                        >
                                            {isUploading ? <Loader2 className="animate-spin text-brand-red" size={20} /> : <UploadCloud size={20} className="text-gray-500" />}
                                            <span className="ml-2 text-xs text-gray-500">{isUploading ? 'Subiendo...' : 'Elegir'}</span>
                                        </label>
                                    </div>
                                    {formData.imageUrl && (
                                        <input
                                            type="text"
                                            value={formData.imageUrl}
                                            readOnly
                                            className="w-full mt-1 p-1 text-xs text-gray-400 border border-gray-200 rounded bg-gray-50"
                                        />
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <input
                                type="checkbox"
                                id="extraOverlay"
                                checked={formData.extraOverlay}
                                onChange={e => setFormData({ ...formData, extraOverlay: e.target.checked })}
                                className="w-4 h-4 text-brand-red rounded focus:ring-brand-red"
                            />
                            <label htmlFor="extraOverlay" className="text-sm text-gray-600 cursor-pointer">
                                Oscurecer fondo (Texto más legible)
                            </label>
                        </div>

                        {/* LIVE PREVIEW */}
                        <div className="mt-6">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Previsualización</label>
                            <div className={`relative h-32 rounded-xl overflow-hidden shadow-lg border border-gray-200 transition-all ${formData.bgType === 'gradient' ? `bg-gradient-to-br ${formData.color}` : 'bg-gray-900'}`}>
                                {formData.bgType === 'image' && formData.imageUrl && (
                                    <img src={formData.imageUrl} className="absolute inset-0 w-full h-full object-cover" alt="Preview" />
                                )}

                                <div className={`absolute inset-0 bg-black/50 ${formData.extraOverlay ? 'bg-black/70' : ''}`} />

                                <div className="absolute inset-0 p-4 flex flex-col justify-end">
                                    <h3 className="font-bold text-white text-xl leading-none">{formData.title || 'Título de Colección'}</h3>
                                    <p className="text-white/80 text-xs mt-1">Ver colección →</p>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isUploading}
                            className={`w-full py-3 bg-brand-dark text-white font-bold rounded-xl shadow-lg hover:bg-black transition-transform active:scale-95 flex items-center justify-center gap-2 mt-4 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isUploading ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                            {isUploading ? 'Espere...' : 'Crear Colección'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CollectionsModal;
