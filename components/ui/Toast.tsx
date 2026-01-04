import { Toaster, toast } from 'sonner';

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-center"
      expand={true}
      richColors
      closeButton
      toastOptions={{
        duration: 5000,
        style: {
          background: 'white',
          color: '#1f2937',
          border: '1px solid #e5e7eb',
        },
      }}
    />
  );
}

export function showOrderDropToast(tableLabel: string, onUndo: () => void) {
  toast.success(`Commande envoyée - Table ${tableLabel}`, {
    description: 'La commande a été envoyée à la cuisine',
    action: {
      label: 'Annuler',
      onClick: onUndo,
    },
    duration: 5000,
  });
}

