"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, FileImage, Settings, ArrowRight, Copy, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n";

import { ImageOptionsModal } from "@/components/image-options";
import { useCartStore, type PrintOptions } from "@/lib/store";

const DEFAULT_OPTIONS: PrintOptions = {
    quantity: 1,
    size: "10x15",
    paper: "glossy", // lowercase slug matching DB seed
    options: {},
};

export default function UploadPage() {
    const { t } = useTranslation();
    const router = useRouter();
    const { items: files, addItem, removeItem, updateItem: updateItemOptions, setConfig, cloneItem, bulkCloneItems } = useCartStore(); // Fix: updateItem named updateItemOptions via destructuring alias
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkEditing, setIsBulkEditing] = useState(false);
    const [isDragActive, setIsDragActive] = useState(false);
    const [editingFileId, setEditingFileId] = useState<string | null>(null);

    // Fetch config on mount
    useState(() => {
        fetch('/api/products')
            .then(res => res.json())
            .then(data => setConfig(data))
            .catch(console.error);
    });

    const onDrop = useCallback((acceptedFiles: File[]) => {
        acceptedFiles.forEach((file) => {
            addItem(file, { ...DEFAULT_OPTIONS });
        });
    }, [addItem]);

    const { getRootProps, getInputProps, isDragAccept: _isDragAccept } = useDropzone({
        onDrop,
        accept: {
            "image/*": [".jpeg", ".jpg", ".png"],
        },
        onDragEnter: () => setIsDragActive(true),
        onDragLeave: () => setIsDragActive(false),
        onDropAccepted: () => setIsDragActive(false),
    });

    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const selectAll = () => {
        if (selectedIds.length === files.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(files.map(f => f.id));
        }
    };

    const editingFile = files.find((f) => f.id === editingFileId);

    const handleSaveOptions = (opts: PrintOptions) => {
        if (isBulkEditing) {
            selectedIds.forEach(id => updateItemOptions(id, opts));
            setIsBulkEditing(false);
            setSelectedIds([]);
        } else if (editingFileId) {
            updateItemOptions(editingFileId, opts);
            setEditingFileId(null);
        }
    };

    const handleProceed = () => {
        router.push("/checkout");
    };

    return (
        <div className="min-h-screen bg-[#f3f1e9] py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-black text-[#009846] uppercase italic tracking-tighter shadow-sm inline-block px-8 py-2 bg-white rounded-2xl border border-[#c5b98e]/20">
                        {t('nav.upload')}
                    </h1>
                    <p className="mt-4 text-[#4c4c4c]/70 font-bold uppercase tracking-widest text-sm">
                        {t('Upload your photos to get started')}
                    </p>
                </div>

                <div
                    {...getRootProps()}
                    className={cn(
                        "border-4 border-dashed rounded-3xl p-16 text-center transition-all cursor-pointer bg-white group shadow-xl hover:shadow-2xl",
                        isDragActive ? "border-[#009846] bg-[#eefdf4] scale-[1.02]" : "border-[#c5b98e]/40 hover:border-[#009846]"
                    )}
                >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center gap-6">
                        <div className="p-6 bg-[#f3f1e9] rounded-2xl group-hover:scale-110 transition-transform">
                            <Upload className="w-12 h-12 text-[#009846]" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-[#4c4c4c] uppercase tracking-tighter">
                                {t('Drag & drop photos here, or click to select')}
                            </p>
                            <p className="text-sm text-[#4c4c4c]/60 mt-2 font-bold uppercase">
                                {t('Supports JPG, PNG • Best quality guaranteed')}
                            </p>
                        </div>
                        <Button size="lg" className="mt-4 bg-[#009846] hover:bg-[#0d8c43] text-white px-8 h-14 rounded-xl font-black uppercase tracking-tight shadow-lg shadow-green-900/20">
                            {t('Select Files')}
                        </Button>
                    </div>
                </div>

                {files.length > 0 && (
                    <div className="mt-16 bg-white p-8 rounded-3xl shadow-xl border border-[#c5b98e]/20">
                        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
                            <h2 className="text-3xl font-black text-[#4c4c4c] flex items-center gap-3 uppercase tracking-tighter">
                                <div className="w-10 h-10 bg-[#e31e24] text-white rounded-lg flex items-center justify-center">
                                    <FileImage className="w-6 h-6" />
                                </div>
                                {t('Selected Photos')} ({files.length})
                            </h2>
                            <div className="flex flex-wrap items-center gap-3">
                                <Button variant="outline" size="sm" onClick={selectAll} className="font-bold border-[#c5b98e]/50 hover:bg-[#f3f1e9]">
                                    {selectedIds.length === files.length ? t('Deselect All') : t('Select All')}
                                </Button>
                                {selectedIds.length > 0 && (
                                    <>
                                        <Button size="sm" onClick={() => setIsBulkEditing(true)} className="bg-[#009846] hover:bg-[#0d8c43] font-black uppercase px-6">
                                            {t('Edit Selected')} ({selectedIds.length})
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => bulkCloneItems(selectedIds)} className="gap-1 font-bold border-[#c5b98e]/50 hover:bg-[#f3f1e9]">
                                            <Copy className="w-3.5 h-3.5" /> {t('Duplicate Selected')}
                                        </Button>
                                    </>
                                )}
                                <Button variant="ghost" size="sm" onClick={() => bulkCloneItems(files.map(f => f.id))} className="text-[#4c4c4c]/50 hover:text-[#4c4c4c] font-bold">
                                    {t('Duplicate All')}
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                            {files.map((file) => (
                                <div
                                    key={file.id}
                                    onClick={() => toggleSelection(file.id)}
                                    className={cn(
                                        "group relative aspect-square bg-[#f3f1e9] rounded-2xl overflow-hidden border-2 transition-all cursor-pointer shadow-md",
                                        selectedIds.includes(file.id) ? "border-[#e31e24] ring-4 ring-[#e31e24]/10 transform scale-95" : "border-transparent hover:border-[#c5b98e]/50"
                                    )}
                                >
                                    <img
                                        src={file.preview}
                                        alt={file.file?.name || "Photo"}
                                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                    />

                                    {/* Selection Checkbox */}
                                    <div className={cn(
                                        "absolute top-3 left-3 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                                        selectedIds.includes(file.id) ? "bg-[#e31e24] border-[#e31e24] scale-110 shadow-lg" : "bg-white/90 border-[#c5b98e]/40"
                                    )}>
                                        {selectedIds.includes(file.id) && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                                    </div>

                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeItem(file.id);
                                            }}
                                            className="p-2.5 bg-[#e31e24] text-white rounded-xl hover:scale-110 transition-transform shadow-lg"
                                            title={t('Remove')}
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingFileId(file.id);
                                            }}
                                            className="p-2.5 bg-[#009846] text-white rounded-xl hover:scale-110 transition-transform shadow-lg"
                                            title={t('Settings')}
                                        >
                                            <Settings className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Badge for non-default options */}
                                    {(file.options.quantity > 1 || file.options.size !== "10x15" || file.options.options?.border || file.options.options?.magnetic) && (
                                        <div className="absolute top-2 right-2 bg-black/80 text-white text-[10px] px-2 py-1 rounded-lg font-black shadow-lg backdrop-blur-sm uppercase">
                                            {file.options.size} x{file.options.quantity}
                                            {file.options.options?.magnetic && " • M"}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="mt-16 flex flex-col md:flex-row items-center justify-between border-t border-[#c5b98e]/20 pt-10 gap-6">
                            <div className="text-[#4c4c4c]">
                                <p className="text-sm font-bold uppercase tracking-widest text-[#4c4c4c]/60 mb-1">{t('Total for checkout')}</p>
                                <p className="text-3xl font-black">{files.length} {t('photos')}</p>
                            </div>
                            <Button size="lg" className="bg-[#e31e24] hover:bg-[#c31a1f] text-white px-12 h-16 rounded-2xl gap-3 font-black uppercase tracking-tighter shadow-xl shadow-red-900/20 text-lg transition-transform hover:scale-105 active:scale-95" onClick={handleProceed}>
                                {t('checkout.placeOrder')} <ArrowRight size={24} />
                            </Button>
                        </div>
                    </div>
                )}

                {(editingFile || isBulkEditing) && (
                    <ImageOptionsModal
                        isOpen={!!editingFile || isBulkEditing}
                        onClose={() => {
                            setEditingFileId(null);
                            setIsBulkEditing(false);
                        }}
                        currentOptions={isBulkEditing ? DEFAULT_OPTIONS : editingFile?.options}
                        onSave={handleSaveOptions}
                    />
                )}
            </div>
        </div>
    );
}
