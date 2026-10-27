import { useState, useCallback } from 'react';

export function useConfirmationDialog<T extends { id: string }>(onConfirm: (id: string) => Promise<unknown> | void) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<T | null>(null);

    const openDialog = useCallback((item: T) => {
        setItemToDelete(item);
        setIsDialogOpen(true);
    }, []);

    const closeDialog = useCallback(() => {
        setIsDialogOpen(false);
        setItemToDelete(null);
    }, []);

    const confirmDelete = useCallback(async () => {
        if (itemToDelete) {
            await onConfirm(itemToDelete.id);
            closeDialog();
        }
    }, [itemToDelete, onConfirm, closeDialog]);

    return {
        isDialogOpen,
        itemToDelete,
        openDialog,
        closeDialog,
        confirmDelete
    };
}