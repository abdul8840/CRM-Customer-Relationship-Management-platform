import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
export const ConfirmDialog = ({ open, onClose, onConfirm, title = 'Are you sure?', description, loading, danger }) => (
  <Modal open={open} onClose={onClose} title={title} size="sm" footer={
    <>
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>Confirm</Button>
    </>
  }>
    <p className="text-sm text-muted-fg">{description}</p>
  </Modal>
);