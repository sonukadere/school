import { Trash2, AlertTriangle } from 'lucide-react'
import Button from './Button'
import Modal from './Modal'

function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Delete',
  loading = false,
}) {
  return (
    <Modal open={open} onClose={onClose} size="sm" hideClose>
      <div className="flex flex-col items-center pt-2 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-100">
          <AlertTriangle size={26} className="text-rose-600" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-500">{message}</p>
        <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <Button variant="outline" onClick={onClose} className="sm:w-auto w-full">
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            loading={loading}
            leftIcon={Trash2}
            className="sm:w-auto w-full"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ConfirmDialog
