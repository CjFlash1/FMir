import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ProductConfig = {
    sizes: {
        id: number;
        name: string;
        basePrice: number;
        discounts: { minQuantity: number; price: number }[];
    }[];
    papers: { id: number; name: string; slug: string }[];
    options: { id: number; name: string; slug: string; price: number }[];
    gifts: { id: number; minAmount: number; giftName: string }[];
    magnetPrices?: { id: number; sizeSlug: string; price: number }[];
};

export type PrintOptions = {
    size: string;
    paper: string;
    quantity: number;
    cropping?: 'fill' | 'fit' | 'no_resize';
    options: Record<string, boolean>; // e.g., { border: true, magnetic: false }
}

export type CartItem = {
    id: string; // Unique ID (file.name + timestamp)
    file?: File; // Not persisted
    name: string; // Original filename (persisted)
    preview: string; // Blob URL
    serverFileName?: string; // Name of the file on the server after upload
    options: PrintOptions;
}

interface CheckoutFormState {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    deliveryAddress: string;
    deliveryMethod: string;
}

interface CartState {
    items: CartItem[];
    config: ProductConfig | null;
    checkoutForm: CheckoutFormState;
    setConfig: (config: ProductConfig) => void;
    setCheckoutForm: (form: Partial<CheckoutFormState>) => void;
    addItem: (file: File, defaultOptions: PrintOptions) => string;
    updateItem: (id: string, options: Partial<PrintOptions>) => void;
    removeItem: (id: string) => void;
    cloneItem: (id: string) => string;
    bulkCloneItems: (ids: string[]) => void;
    setItemPreview: (id: string, preview: string) => void;
    setItemServerFile: (id: string, serverFileName: string) => void;
    clearCart: () => void;
    draftOrderId: string | null;
}

const DEFAULT_CLONE_OPTIONS: PrintOptions = {
    quantity: 1,
    size: "10x15",
    paper: "glossy",
    options: {},
};

// --- API SYNC HELPERS ---

const deleteFileFromServer = async (serverFileName: string) => {
    if (!serverFileName) return;
    try {
        await fetch(`/api/upload?fileName=${serverFileName}`, { method: 'DELETE' });
    } catch (e) {
        console.error("Failed to delete file:", e);
    }
};

let syncTimeout: NodeJS.Timeout;
const debouncedSyncDraft = (items: CartItem[], config: ProductConfig | null, currentDraftId: string | null, setDraftId: (id: string | null) => void) => {
    clearTimeout(syncTimeout);
    syncTimeout = setTimeout(async () => {
        // If items are empty, we might want to clear the draft order or mark it as abandoned.
        // For now, if items are empty, we don't send a sync request to create a new empty order.
        // If there was a draftId, we might want to explicitly delete it or mark it as abandoned.
        if (items.length === 0 && currentDraftId) {
            // Optionally, send a request to delete/abandon the draft order
            // await fetch(`/api/orders/draft/${currentDraftId}`, { method: 'DELETE' });
            setDraftId(null); // Clear draft ID locally
            return;
        }
        if (items.length === 0) return; // Don't sync empty cart if no current draft ID

        try {
            // Calculate total on client side for draft estimation and prepare price snapshots
            const itemsForApi = items.map(i => {
                let priceSnapshot = 0;
                if (config) {
                    priceSnapshot = calculateItemPrice(i.options, config).unitPrice;
                }
                return {
                    ...i,
                    options: {
                        ...i.options,
                        priceSnapshot: priceSnapshot
                    }
                };
            });

            const total = itemsForApi.reduce((acc, item) => {
                // Use the priceSnapshot from the prepared item for total calculation
                return acc + (item.options as PrintOptions & { priceSnapshot: number }).priceSnapshot * item.options.quantity;
            }, 0);

            const res = await fetch('/api/orders/draft', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: itemsForApi,
                    total,
                    orderNumber: currentDraftId
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.orderNumber && data.orderNumber !== currentDraftId) {
                    setDraftId(data.orderNumber);
                }
            }
        } catch (e) {
            console.error("Draft sync error", e);
        }
    }, 2000); // Debounce 2s
};


// Helper: Generate Base64 Thumbnail (Max 300px)
const createThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.src = url;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const max = 300;
            let w = img.width;
            let h = img.height;
            if (w > h) { if (w > max) { h *= max / w; w = max; } }
            else { if (h > max) { w *= max / h; h = max; } }

            canvas.width = w;
            canvas.height = h;
            ctx?.drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/jpeg', 0.6)); // Low quality for storage efficiency
            URL.revokeObjectURL(url);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve("");
        };
    });
};

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            config: null,
            checkoutForm: {
                firstName: "",
                lastName: "",
                phone: "",
                email: "",
                deliveryAddress: "",
                deliveryMethod: "pickup",
            },
            draftOrderId: null,
            setConfig: (config) => set({ config }),
            setCheckoutForm: (form) =>
                set((state) => ({
                    checkoutForm: { ...state.checkoutForm, ...form },
                })),
            addItem: (file, options) => {
                const id = `${file.name}-${Date.now()}`;
                // 1. Set immediate preview with Blob URL for responsiveness
                const blobUrl = URL.createObjectURL(file);

                const newItem: CartItem = {
                    id,
                    file,
                    name: file.name,
                    preview: blobUrl,
                    options: options,
                    serverFileName: undefined, // serverFileName is undefined initially
                };

                set((state) => {
                    const newItems = [...state.items, newItem];
                    debouncedSyncDraft(newItems, state.config, state.draftOrderId, (id) => set({ draftOrderId: id }));
                    return { items: newItems };
                });

                // 2. Async: Create permanent Base64 thumbnail for persistence
                createThumbnail(file).then((base64) => {
                    if (base64) get().setItemPreview(id, base64);
                });

                return id; // Return ID so component can use it for async upload association
            },
            updateItem: (id, newOptions) =>
                set((state) => {
                    const newItems = state.items.map((item) =>
                        item.id === id ? { ...item, options: { ...item.options, ...newOptions } } : item
                    );
                    debouncedSyncDraft(newItems, state.config, state.draftOrderId, (id) => set({ draftOrderId: id }));
                    return { items: newItems };
                }),
            setItemPreview: (id, preview) =>
                set((state) => ({
                    items: state.items.map(item => item.id === id ? { ...item, preview } : item)
                })),
            setItemServerFile: (id, serverFileName) =>
                set((state) => {
                    const newItems = state.items.map(item => item.id === id ? { ...item, serverFileName } : item);
                    // Sync again because now we have serverFileName!
                    debouncedSyncDraft(newItems, state.config, state.draftOrderId, (id) => set({ draftOrderId: id }));
                    return { items: newItems };
                }),
            cloneItem: (id) => {
                let newId = "";
                set((state) => {
                    const itemToClone = state.items.find((item) => item.id === id);
                    if (!itemToClone) return state;
                    newId = `${itemToClone.id}-copy-${Math.random().toString(36).substring(7)}`;
                    const clonedItem = {
                        ...itemToClone,
                        id: newId,
                        file: itemToClone.file, // If original file is missing, this is undefined
                        serverFileName: itemToClone.serverFileName, // Inherit server file!
                        preview: itemToClone.preview,
                        options: { ...DEFAULT_CLONE_OPTIONS } // Reset options
                    };
                    const newItems = [...state.items, clonedItem];
                    debouncedSyncDraft(newItems, state.config, state.draftOrderId, (id) => set({ draftOrderId: id }));
                    return { items: newItems };
                });
                return newId;
            },
            bulkCloneItems: (ids) =>
                set((state) => {
                    const itemsToClone = state.items.filter((item) => ids.includes(item.id));
                    const clonedItems = itemsToClone.map((item) => ({
                        ...item,
                        id: `${item.id}-copy-${Math.random().toString(36).substring(7)}`,
                        file: item.file,
                        serverFileName: item.serverFileName, // Inherit server file
                        preview: item.preview,
                        options: { ...DEFAULT_CLONE_OPTIONS } // Reset options
                    }));
                    const newItems = [...state.items, ...clonedItems];
                    debouncedSyncDraft(newItems, state.config, state.draftOrderId, (id) => set({ draftOrderId: id }));
                    return { items: newItems };
                }),
            removeItem: (id) =>
                set((state) => {
                    // Check if item has server file
                    const item = state.items.find(i => i.id === id);
                    if (item && item.serverFileName) {
                        deleteFileFromServer(item.serverFileName);
                    }
                    const newItems = state.items.filter((item) => item.id !== id);
                    debouncedSyncDraft(newItems, state.config, state.draftOrderId, (id) => set({ draftOrderId: id }));
                    return { items: newItems };
                }),
            clearCart: () => set({ items: [], draftOrderId: null }), // Also clear draft ID to start fresh on new session
        }),
        {
            name: 'cart-storage',
            partialize: (state) => ({
                // Don't persist File objects (they expire)
                // Persist previews (now Base64) to fix disappearing issues
                config: state.config,
                checkoutForm: state.checkoutForm,
                draftOrderId: state.draftOrderId,
                items: state.items.map(item => ({
                    ...item,
                    file: undefined,
                }))
            }),
        }
    )
);

export const calculateItemPrice = (options: PrintOptions, config: ProductConfig) => {
    const sizeObj = config.sizes.find(s => s.name === options.size);
    if (!sizeObj) return { unitPrice: 0, total: 0, savings: 0 };

    let baseUnitPrice = sizeObj.basePrice;
    let finalUnitPrice = sizeObj.basePrice;

    // Check if it is a magnet and we have a custom price for it
    const isMagnet = options.options['magnetic'] === true;
    const magnetPriceObj = isMagnet && config.magnetPrices
        ? config.magnetPrices.find(mp => mp.sizeSlug === options.size)
        : null;

    if (magnetPriceObj) {
        baseUnitPrice = magnetPriceObj.price;
        finalUnitPrice = magnetPriceObj.price;
    } else {
        // Apply volume discount
        if (sizeObj.discounts && sizeObj.discounts.length > 0) {
            const applicableDiscount = [...sizeObj.discounts]
                .sort((a, b) => b.minQuantity - a.minQuantity)
                .find(d => options.quantity >= d.minQuantity);

            if (applicableDiscount) {
                finalUnitPrice = applicableDiscount.price;
            }
        }
    }

    // Add option prices
    let optionsPrice = 0;
    Object.entries(options.options || {}).forEach(([slug, isActive]) => {
        if (isActive) {
            // If we used a custom magnet price, we don't add the fixed option price
            if (slug === 'magnetic' && magnetPriceObj) return;

            const opt = config.options.find(o => o.slug === slug);
            if (opt) optionsPrice += opt.price;
        }
    });

    baseUnitPrice += optionsPrice;
    finalUnitPrice += optionsPrice;

    const total = finalUnitPrice * options.quantity;
    const totalWithoutDiscount = baseUnitPrice * options.quantity;
    const savings = totalWithoutDiscount - total;

    return { unitPrice: finalUnitPrice, total, savings };
};
