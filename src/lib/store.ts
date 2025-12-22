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
};

export type PrintOptions = {
    size: string;
    paper: string;
    quantity: number;
    options: Record<string, boolean>; // e.g., { border: true, magnetic: false }
}

export type CartItem = {
    id: string; // Unique ID (file.name + timestamp)
    file?: File; // Not persisted
    preview: string; // Blob URL
    options: PrintOptions;
}

interface CartState {
    items: CartItem[];
    config: ProductConfig | null;
    setConfig: (config: ProductConfig) => void;
    addItem: (file: File, defaultOptions: PrintOptions) => void;
    updateItem: (id: string, options: Partial<PrintOptions>) => void;
    removeItem: (id: string) => void;
    cloneItem: (id: string) => void;
    bulkCloneItems: (ids: string[]) => void;
    clearCart: () => void;
}

export const useCartStore = create<CartState>()(
    persist(
        (set) => ({
            items: [],
            config: null,
            setConfig: (config) => set({ config }),
            addItem: (file, options) => {
                const id = `${file.name}-${Date.now()}`;
                const newItem: CartItem = {
                    id,
                    file,
                    preview: URL.createObjectURL(file),
                    options: options,
                };
                set((state) => ({ items: [...state.items, newItem] }));
            },
            updateItem: (id, newOptions) =>
                set((state) => ({
                    items: state.items.map((item) =>
                        item.id === id ? { ...item, options: { ...item.options, ...newOptions } } : item
                    ),
                })),
            cloneItem: (id) =>
                set((state) => {
                    const itemToClone = state.items.find((item) => item.id === id);
                    if (!itemToClone) return state;
                    const clonedItem = {
                        ...itemToClone,
                        id: `${itemToClone.id}-copy-${Math.random().toString(36).substring(7)}`,
                        file: itemToClone.file, // Keep file reference if available
                        preview: itemToClone.preview,
                    };
                    return { items: [...state.items, clonedItem] };
                }),
            bulkCloneItems: (ids) =>
                set((state) => {
                    const itemsToClone = state.items.filter((item) => ids.includes(item.id));
                    const clonedItems = itemsToClone.map((item) => ({
                        ...item,
                        id: `${item.id}-copy-${Math.random().toString(36).substring(7)}`,
                        file: item.file,
                        preview: item.preview,
                    }));
                    return { items: [...state.items, ...clonedItems] };
                }),
            removeItem: (id) =>
                set((state) => ({
                    items: state.items.filter((item) => item.id !== id),
                })),
            clearCart: () => set({ items: [] }),
        }),
        {
            name: 'cart-storage',
            partialize: (state) => ({
                // Don't persist File objects or Previews (they expire)
                // In a real app, upload to server immediately or use IndexedDB
                config: state.config,
                items: state.items.map(item => ({
                    ...item,
                    file: undefined, // Ensure file is not persisted
                    // preview: undefined // If previews are blob URLs, they should not be persisted either
                }))
            }),
        }
    )
);
