"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, FileImage, Settings, ArrowRight, Copy, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ImageOptionsModal } from "@/components/image-options";
import { useCartStore, type PrintOptions } from "@/lib/store";

const DEFAULT_OPTIONS: PrintOptions = {
    quantity: 1,
    size: "10x15",
    paper: "glossy", // lowercase slug matching DB seed
    options: {},
};

export default function UploadPage() {
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
        <div className="min-h-screen bg-slate-50 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-slate-900">Order Prints</h1>
                    <p className="mt-2 text-slate-600">Upload your photos to get started</p>
                </div>

                <div
                    {...getRootProps()}
                    className={cn(
                        "border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer bg-white",
                        isDragActive ? "border-primary-500 bg-primary-50" : "border-slate-300 hover:border-primary-400"
                    )}
                >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center gap-4">
                        <div className="p-4 bg-slate-100 rounded-full">
                            <Upload className="w-8 h-8 text-slate-600" />
                        </div>
                        <div>
                            <p className="text-lg font-medium text-slate-900">
                                Drag & drop photos here, or click to select
                            </p>
                            <p className="text-sm text-slate-500 mt-1">
                                Supports JPG, PNG usually ready in 1 hour
                            </p>
                        </div>
                        <Button variant="outline" className="mt-2">
                            Select Files
                        </Button>
                    </div>
                </div>

                {files.length > 0 && (
                    <div className="mt-12">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <FileImage className="w-5 h-5 text-primary-600" />
                                Selected Photos ({files.length})
                            </h2>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={selectAll}>
                                    {selectedIds.length === files.length ? "Deselect All" : "Select All"}
                                </Button>
                                {selectedIds.length > 0 && (
                                    <>
                                        <Button size="sm" onClick={() => setIsBulkEditing(true)}>
                                            Edit Selected ({selectedIds.length})
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => bulkCloneItems(selectedIds)} className="gap-1">
                                            <Copy className="w-3.5 h-3.5" /> Duplicate Selected
                                        </Button>
                                    </>
                                )}
                                <Button variant="ghost" size="sm" onClick={() => bulkCloneItems(files.map(f => f.id))} className="text-slate-500 hover:text-slate-700">
                                    Duplicate All
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {files.map((file) => (
                                <div
                                    key={file.id}
                                    onClick={() => toggleSelection(file.id)}
                                    className={cn(
                                        "group relative aspect-square bg-slate-200 rounded-lg overflow-hidden border-2 transition-all cursor-pointer",
                                        selectedIds.includes(file.id) ? "border-primary-600 ring-2 ring-primary-600/20" : "border-slate-200"
                                    )}
                                >
                                    <img
                                        src={file.preview}
                                        alt={file.file?.name || "Photo"}
                                        className="w-full h-full object-cover"
                                    />

                                    {/* Selection Checkbox */}
                                    <div className={cn(
                                        "absolute top-2 left-2 w-5 h-5 rounded border flex items-center justify-center transition-colors",
                                        selectedIds.includes(file.id) ? "bg-primary-600 border-primary-600" : "bg-white/80 border-slate-300"
                                    )}>
                                        {selectedIds.includes(file.id) && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>

                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeItem(file.id);
                                            }}
                                            className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                cloneItem(file.id);
                                            }}
                                            className="p-1.5 bg-white text-slate-900 rounded-full hover:bg-slate-100"
                                            title="Duplicate"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const nid = cloneItem(file.id);
                                                if (nid) setEditingFileId(nid);
                                            }}
                                            className="p-1.5 bg-white text-slate-900 rounded-full hover:bg-slate-100"
                                            title="Add Another Size"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingFileId(file.id);
                                            }}
                                            className="p-1.5 bg-white text-slate-900 rounded-full hover:bg-slate-100"
                                            title="Settings"
                                        >
                                            <Settings className="w-4 h-4" />
                                        </button>
                                    </div>
                                    {/* Badge for non-default options */}
                                    {(file.options.quantity > 1 || file.options.size !== "10x15") && (
                                        <div className="absolute top-1 right-1 bg-primary-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium shadow-sm">
                                            {file.options.size} x{file.options.quantity}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 flex justify-end">
                            <Button size="lg" className="px-8 gap-2" onClick={handleProceed}>
                                Proceed to Checkout <ArrowRight size={18} />
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
