"use client";

import { useCallback, useState, useMemo, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, FileImage, Settings, ArrowRight, Copy, Plus, Trash2, Sparkles, Cloud, AlertCircle, Loader2, ChevronLeft, ChevronRight, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import { useSettings } from "@/lib/settings-context";

import { ImageOptionsModal } from "@/components/image-options";

import { useCartStore, type PrintOptions, type CartItem, calculateItemPrice } from "@/lib/store";
import { useUploadProgress, uploadWithProgress } from "@/lib/hooks/use-upload-progress";

const DEFAULT_OPTIONS: PrintOptions = {
    quantity: 1,
    size: "10x15",
    paper: "glossy", // lowercase slug matching DB seed
    options: {},
};

export default function UploadPage() {
    const { t } = useTranslation();
    const router = useRouter();
    const { items: files, addItem, removeItem, updateItem: updateItemOptions, setConfig, cloneItem, bulkCloneItems, config, setItemServerFile } = useCartStore();
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkEditing, setIsBulkEditing] = useState(false);
    const [isDragActive, setIsDragActive] = useState(false);
    const [editingFileId, setEditingFileId] = useState<string | null>(null);
    const [lightboxFile, setLightboxFile] = useState<CartItem | null>(null);
    const [photosToShow, setPhotosToShow] = useState(100); // Pagination
    const PHOTOS_PER_PAGE = 100;



    // Calculations
    const totalStats = useMemo(() => {
        if (!config) return { total: 0, savings: 0 };
        return files.reduce((acc, file) => {
            const price = calculateItemPrice(file.options, config);
            return {
                total: acc.total + price.total,
                savings: acc.savings + price.savings
            };
        }, { total: 0, savings: 0 });
    }, [files, config]);

    const totalPhotosCount = files.reduce((acc, f) => acc + f.options.quantity, 0);

    // Fetch config on mount
    useEffect(() => {
        fetch('/api/products')
            .then(res => res.json())
            .then(data => setConfig(data))
            .catch(console.error);
    }, [setConfig]);

    // Upload Progress Tracking
    const { uploads, addUpload, setProgress, setStatus } = useUploadProgress();

    const onDrop = useCallback((acceptedFiles: File[]) => {
        acceptedFiles.forEach(async (file) => {
            const id = addItem(file, { ...DEFAULT_OPTIONS });
            addUpload(id);

            // Immediate Upload with progress tracking
            try {
                await uploadWithProgress(
                    id,
                    file,
                    (progress) => setProgress(id, progress),
                    (serverFileName) => {
                        setItemServerFile(id, serverFileName);
                        setStatus(id, 'done');
                    },
                    (error) => {
                        console.error("Upload failed", error);
                        setStatus(id, 'error', error);
                    }
                );
            } catch (e) {
                console.error("Auto-upload failed", e);
                setStatus(id, 'error', 'Upload failed');
            }
        });
    }, [addItem, setItemServerFile, addUpload, setProgress, setStatus]);

    const { getRootProps, getInputProps, isDragAccept: _isDragAccept, open } = useDropzone({
        onDrop,
        accept: {
            "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp", ".avif", ".bmp", ".tiff", ".tif", ".heic", ".heif", ".svg", ".ico"],
            "application/zip": [".zip"],
            "application/x-zip-compressed": [".zip"],
            "application/x-rar-compressed": [".rar"],
            "application/vnd.rar": [".rar"],
            "application/x-7z-compressed": [".7z"],
        },
        noClick: files.length > 0, // Disable click on the *container* when files exist, relying on the 'Add' button to avoid confusion, or keep it? User said "no ability to add". I'll keep it clickable?
        // Actually, if files > 0, the dropzone is usually hidden or minimized in many apps. 
        // Here it is rendered ABOVE the files.
        // Let's keep existing behavior but add the button.
        // Wait, if I add `noClick: true` when files > 0, then the big area won't open dialog. 
        // I will NOT disable click for now, just add the button.
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

    const deleteSelected = () => {
        if (confirm(t('bulk.delete') + '?')) {
            selectedIds.forEach(id => removeItem(id));
            setSelectedIds([]);
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
        <div className="min-h-screen bg-[#f3f1e9] pt-12 pb-48">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-black text-[#009846] uppercase italic tracking-tighter shadow-sm inline-block px-8 py-2 bg-white rounded-2xl border border-[#c5b98e]/20">
                        {t('nav.upload')}
                    </h1>
                    <p className="mt-4 text-[#4c4c4c]/70 font-bold uppercase tracking-widest text-sm">
                        {t('Upload your photos to get started')}
                    </p>

                </div>

                {/* Dropzone - Hidden when files exist to clean up UI, replaced by toolbar button? 
                    Or just kept? The user said "not ability to add". Maybe the dropzone was disappearing?
                    In the previous code, it was NOT hidden (lines 98-122 were outside `files.length > 0` check).
                    So it was visible.
                    I will ADD the button in the toolbar anyway.
                */}
                <div
                    {...getRootProps()}
                    className={cn(
                        "border-4 border-dashed rounded-3xl p-16 text-center transition-all cursor-pointer bg-white group shadow-xl hover:shadow-2xl",
                        files.length > 0 ? "hidden" : "block", // Hide big dropzone when files exist, show "Add" button instead? Or keep small? User said "no ability".
                        // Use case: User uploads 10 photos. Wants 5 more.
                        // Ideally: display a compact "Add more" area or button.
                        // I will HIDE the big one and rely on the toolbar button to be cleaner.
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
                        </div>
                        <Button size="lg" className="mt-4 bg-[#009846] hover:bg-[#0d8c43] text-white px-8 h-14 rounded-xl font-black uppercase tracking-tight shadow-lg shadow-green-900/20">
                            {t('Select Files')}
                        </Button>
                    </div>
                </div>

                {files.length > 0 && (
                    <div className="mt-8 bg-white p-8 rounded-3xl shadow-xl border border-[#c5b98e]/20">
                        {/* Persistent Warning Banner */}
                        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-xl mb-8 flex items-center justify-center gap-3 shadow-sm">
                            <span className="text-xl">ℹ️</span>
                            <span className="font-bold uppercase tracking-wide text-sm">{t('upload.all_default_notice')}</span>
                        </div>

                        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
                            <h2 className="text-3xl font-black text-[#4c4c4c] flex items-center gap-3 uppercase tracking-tighter">
                                <div className="w-10 h-10 bg-[#e31e24] text-white rounded-lg flex items-center justify-center">
                                    <FileImage className="w-6 h-6" />
                                </div>
                                {t('Selected Photos')} ({files.length})
                            </h2>
                            <div className="flex flex-wrap items-center gap-3">
                                {/* Add Button */}
                                <Button onClick={open} className="bg-[#4c4c4c] hover:bg-[#000] text-white font-bold gap-2">
                                    <Plus className="w-4 h-4" /> {t('bulk.add')}
                                </Button>

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
                                        {/* Delete Selected Button */}
                                        <Button variant="destructive" size="sm" onClick={deleteSelected} className="gap-1 font-bold">
                                            <X className="w-3.5 h-3.5" /> {t('bulk.delete')}
                                        </Button>
                                    </>
                                )}
                                <Button variant="ghost" size="sm" onClick={() => bulkCloneItems(files.map(f => f.id))} className="text-[#4c4c4c]/50 hover:text-[#4c4c4c] font-bold">
                                    {t('Duplicate All')}
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                            {files.slice(0, photosToShow).map((file) => {
                                const isArchive = file.isArchive || /\.(zip|rar|7z)$/i.test(file.name || "");
                                return (
                                    <div
                                        key={file.id}
                                        onClick={() => !isArchive && setLightboxFile(file)}
                                        className={cn(
                                            "group relative aspect-square bg-[#f3f1e9] rounded-2xl overflow-hidden border-2 transition-all cursor-pointer shadow-md",
                                            selectedIds.includes(file.id) ? "border-[#e31e24] ring-4 ring-[#e31e24]/10 transform scale-95" : "border-transparent hover:border-[#c5b98e]/50",
                                            isArchive ? "cursor-default" : "cursor-pointer"
                                        )}
                                    >
                                        {isArchive ? (
                                            <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gray-100 text-gray-400">
                                                <Archive className="w-16 h-16 mb-2 text-gray-300" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">Archive</span>
                                            </div>
                                        ) : (
                                            <img
                                                src={file.preview}
                                                alt={file.name || file.file?.name || "Photo"}
                                                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                                onError={(e) => {
                                                    e.currentTarget.style.opacity = '0';
                                                }}
                                            />
                                        )}

                                        {/* Constant Filename Display */}


                                        {/* --- NEW OVERLAY SYSTEM --- */}

                                        {/* Top-Right: Print Settings Badges (Stacked) - HIDE FOR ARCHIVES */}
                                        {!isArchive && (
                                            <div className="absolute top-2 right-2 flex flex-col items-end gap-1 pointer-events-none z-10">
                                                <span className="bg-black/60 backdrop-blur text-white text-[10px] px-1.5 py-0.5 rounded font-medium shadow-sm">
                                                    {file.options.size}
                                                </span>
                                                <span className="bg-black/60 backdrop-blur text-white/90 text-[10px] px-1.5 py-0.5 rounded shadow-sm">
                                                    {t(file.options.paper)}
                                                </span>
                                                {file.options.quantity > 1 && (
                                                    <span className="bg-yellow-400 text-black text-[10px] px-1.5 py-0.5 rounded font-bold shadow-sm">
                                                        x{file.options.quantity}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Top-Left: Status & Extra Options (Vertical Stack below Checkbox) */}
                                        {/* Checkbox is at top-3 left-3 (checked via view_file line 280), so we start around top-11 */}
                                        <div className="absolute top-11 left-3 flex flex-col items-start gap-1 pointer-events-none z-10 w-full pr-12">

                                            {/* Upload Status with Progress */}
                                            {(() => {
                                                const uploadInfo = uploads[file.id];
                                                const isUploading = uploadInfo && (uploadInfo.status === 'pending' || uploadInfo.status === 'uploading');
                                                const hasError = uploadInfo?.status === 'error';

                                                if (!file.serverFileName && file.file) {
                                                    return (
                                                        <div className="flex items-center gap-1.5">
                                                            {isUploading && (
                                                                <div className="flex items-center gap-1.5 bg-blue-500/90 backdrop-blur text-white text-[10px] px-2 py-0.5 rounded shadow-sm">
                                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                                    <span className="font-medium">{uploadInfo?.progress || 0}%</span>
                                                                </div>
                                                            )}
                                                            {hasError && (
                                                                <div className="flex items-center gap-1.5 bg-red-500/90 backdrop-blur text-white text-[10px] px-2 py-0.5 rounded shadow-sm cursor-pointer hover:bg-red-600" title="Click to retry">
                                                                    <AlertCircle className="w-3 h-3" />
                                                                    <span className="font-medium">Error</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                }

                                                if (!file.serverFileName && !file.file) {
                                                    return (
                                                        <div className="bg-red-500/80 backdrop-blur text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1" title={t("Lost File")}>
                                                            <AlertCircle className="w-3 h-3" />
                                                        </div>
                                                    );
                                                }

                                                return null;
                                            })()}

                                            {/* Synced Icon (Optional, keeping it subtle if needed, or removing as requested before. User said remove it, so skipping) */}

                                            {/* Cropping Badge */}
                                            {!isArchive && file.options.cropping === 'fit' && (
                                                <span className="bg-indigo-500/90 backdrop-blur text-white text-[10px] px-1.5 py-0.5 rounded font-bold shadow-sm border border-white/20">
                                                    FIT-IN
                                                </span>
                                            )}
                                            {!isArchive && file.options.cropping === 'no_resize' && (
                                                <span className="bg-purple-500/90 backdrop-blur text-white text-[10px] px-1.5 py-0.5 rounded font-bold shadow-sm border border-white/20">
                                                    NO-RESIZE
                                                </span>
                                            )}

                                            {/* Extra Badges (Magnet, Border) */}
                                            <div className="flex flex-wrap gap-1">
                                                {!isArchive && file.options.options?.magnetic && (
                                                    <span className="bg-red-500/80 text-white text-[10px] px-1.5 py-0.5 rounded uppercase">Mag</span>
                                                )}
                                                {!isArchive && file.options.options?.border && (
                                                    <span className="bg-green-500/80 text-white text-[10px] px-1.5 py-0.5 rounded uppercase">Brdr</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Selection Checkbox */}
                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleSelection(file.id);
                                            }}
                                            className={cn(
                                                "absolute top-3 left-3 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all z-10 hover:scale-110 active:scale-95 cursor-pointer",
                                                selectedIds.includes(file.id) ? "bg-[#e31e24] border-[#e31e24] scale-110 shadow-lg" : "bg-white/90 border-[#c5b98e]/40"
                                            )}>
                                            {selectedIds.includes(file.id) && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                                        </div>

                                        {/* Hover Actions */}
                                        {/* Action Buttons & Filename - Always visible for better mobile UX */}
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2 pt-12 flex flex-col items-center justify-end gap-2 z-20">

                                            {/* Buttons Row */}
                                            <div className="flex items-center gap-3">
                                                {/* Settings - Hide for archives */}
                                                {!isArchive && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingFileId(file.id);
                                                        }}
                                                        className="w-9 h-9 flex items-center justify-center bg-white/90 hover:bg-white text-[#009846] rounded-full shadow-xl backdrop-blur-sm transition-transform active:scale-95 border border-white/50"
                                                        title={t('Settings')}
                                                    >
                                                        <Settings className="w-5 h-5" />
                                                    </button>
                                                )}

                                                {/* Delete */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeItem(file.id);
                                                    }}
                                                    className="w-9 h-9 flex items-center justify-center bg-white/90 hover:bg-white text-[#e31e24] rounded-full shadow-xl backdrop-blur-sm transition-transform active:scale-95 border border-white/50"
                                                    title={t('Remove')}
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>

                                            {/* Filename */}
                                            <p className="text-white/80 text-[10px] truncate max-w-full font-medium px-2 pb-1 opacity-80" onClick={(e) => e.stopPropagation()}>
                                                {file.name || file.file?.name}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Show More Button for pagination */}
                        {files.length > photosToShow && (
                            <div className="mt-6 text-center">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    onClick={() => setPhotosToShow(prev => prev + PHOTOS_PER_PAGE)}
                                    className="gap-2 font-bold uppercase tracking-tight"
                                >
                                    {t('Показати ще')} {Math.min(PHOTOS_PER_PAGE, files.length - photosToShow)} {t('фото')}
                                </Button>
                            </div>
                        )}

                        {/* Progress indicator for large uploads */}
                        {files.length > 100 && (
                            <div className="mt-4 text-center text-sm text-[#4c4c4c]/50 font-bold uppercase tracking-wide">
                                {t('Показано')} {Math.min(photosToShow, files.length)} {t('з')} {files.length} {t('фото')}
                            </div>
                        )}

                    </div>
                )}

                {/* Floating Bottom Bar */}
                {files.length > 0 && (
                    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#c5b98e]/30 px-4 py-4 shadow-[0_-5px_20px_rgba(0,0,0,0.1)] z-40">
                        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-6 sm:gap-12">
                                <div className="text-sm font-bold text-[#4c4c4c] uppercase tracking-wide flex flex-col sm:flex-row sm:items-center sm:gap-2">
                                    {t('Quantity')}: <span className="text-xl text-[#009846]">{totalPhotosCount}</span>
                                </div>
                                <div className="flex flex-col items-start justify-center">
                                    <div className="text-sm font-bold text-[#4c4c4c] uppercase tracking-wide flex items-center gap-2 leading-none">
                                        {t('checkout.total')}: <span className="text-2xl font-black text-[#e31e24]">{totalStats.total.toFixed(2)} {t('general.currency')}</span>
                                    </div>
                                    {totalStats.savings > 0 && (
                                        <div className="text-[10px] font-black text-[#009846] bg-[#009846]/10 px-2 py-0.5 rounded uppercase tracking-wider mt-1">
                                            {t('Saved')}: {totalStats.savings.toFixed(2)} {t('general.currency')}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <Button onClick={handleProceed} size="lg" className="w-full sm:w-auto bg-[#009846] hover:bg-[#0d8c43] text-white font-black uppercase tracking-tight shadow-lg shadow-green-900/20 px-8 h-12 sm:h-14 text-lg">
                                {t('checkout.placeOrder')} <ArrowRight className="w-5 h-5 ml-2" />
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

                {/* Lightbox Modal */}
                {lightboxFile && (
                    <div
                        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200"
                        onClick={() => setLightboxFile(null)}
                    >
                        {/* Close Button */}
                        <button className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors p-2 z-50">
                            <X className="w-8 h-8" />
                        </button>

                        {/* Navigation - Left */}
                        <button
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all z-50 hidden md:block"
                            onClick={(e) => {
                                e.stopPropagation();
                                const currentIndex = files.findIndex(f => f.id === lightboxFile.id);
                                const prevIndex = currentIndex > 0 ? currentIndex - 1 : files.length - 1;
                                setLightboxFile(files[prevIndex]);
                            }}
                        >
                            <ChevronLeft className="w-10 h-10" />
                        </button>

                        {/* Navigation - Right */}
                        <button
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all z-50 hidden md:block"
                            onClick={(e) => {
                                e.stopPropagation();
                                const currentIndex = files.findIndex(f => f.id === lightboxFile.id);
                                const nextIndex = currentIndex < files.length - 1 ? currentIndex + 1 : 0;
                                setLightboxFile(files[nextIndex]);
                            }}
                        >
                            <ChevronRight className="w-10 h-10" />
                        </button>

                        <div className="relative w-full h-full flex flex-col items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>

                            {/* Main Image - Logic involves trying high-res sources */}
                            <img
                                src={
                                    lightboxFile.file
                                        ? URL.createObjectURL(lightboxFile.file)
                                        : (lightboxFile.serverFileName ? `/uploads/${lightboxFile.serverFileName}` : lightboxFile.preview)
                                }
                                alt={lightboxFile.name}
                                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl select-none"
                            // Add basic touch swipe support here if needed via listeners, 
                            // currently just relying on click nav for web, mobile users might tap edges if we added invisible overlay buttons.
                            />

                            {/* Mobile Navigation Zone Overlay (Invisible) */}
                            <div className="absolute inset-x-0 bottom-24 top-1/2 flex justify-between md:hidden pointer-events-none">
                                <div
                                    className="w-1/3 h-full pointer-events-auto active:bg-white/5"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const currentIndex = files.findIndex(f => f.id === lightboxFile.id);
                                        const prevIndex = currentIndex > 0 ? currentIndex - 1 : files.length - 1;
                                        setLightboxFile(files[prevIndex]);
                                    }}
                                />
                                <div
                                    className="w-1/3 h-full pointer-events-auto active:bg-white/5"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const currentIndex = files.findIndex(f => f.id === lightboxFile.id);
                                        const nextIndex = currentIndex < files.length - 1 ? currentIndex + 1 : 0;
                                        setLightboxFile(files[nextIndex]);
                                    }}
                                />
                            </div>


                            <div className="absolute bottom-0 left-0 right-0 text-center px-4 pointer-events-none">
                                <div className="w-full bg-black/80 backdrop-blur-md rounded-t-xl px-6 py-4 border-t border-white/10">
                                    {/* File name and index */}
                                    <p className="text-white/95 font-medium text-lg leading-tight truncate max-w-full mb-2">
                                        {lightboxFile.name}
                                        <span className="opacity-50 text-sm ml-2 font-normal">
                                            ({files.findIndex(f => f.id === lightboxFile.id) + 1} / {files.length})
                                        </span>
                                    </p>
                                    {/* Parameters row */}
                                    <div className="text-white/80 text-sm flex flex-wrap items-center justify-center gap-2">
                                        <span className="bg-white/15 px-2.5 py-1 rounded-lg font-medium">{lightboxFile.options.size}</span>
                                        <span className="bg-white/15 px-2.5 py-1 rounded-lg">{t(lightboxFile.options.paper)}</span>
                                        {lightboxFile.options.quantity > 1 && (
                                            <span className="bg-yellow-500/80 text-black px-2.5 py-1 rounded-lg font-bold">x{lightboxFile.options.quantity}</span>
                                        )}
                                        {lightboxFile.options.cropping === 'fit' && (
                                            <span className="bg-indigo-500 text-white px-2.5 py-1 rounded-lg font-bold text-xs">FIT-IN</span>
                                        )}
                                        {lightboxFile.options.cropping === 'no_resize' && (
                                            <span className="bg-purple-500 text-white px-2.5 py-1 rounded-lg font-bold text-xs">NO-RESIZE</span>
                                        )}
                                        {lightboxFile.options.options?.magnetic && (
                                            <span className="bg-red-500 text-white px-2.5 py-1 rounded-lg font-bold text-xs uppercase">Mag</span>
                                        )}
                                        {lightboxFile.options.options?.border && (
                                            <span className="bg-green-500 text-white px-2.5 py-1 rounded-lg font-bold text-xs uppercase">Border</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}


            </div>
        </div>
    );
}
