import { useState, useCallback } from 'react';

export function useConfirmationDialog(onConfirm) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const openDialog = useCallback((item) => {
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