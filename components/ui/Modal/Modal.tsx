// TODO: Implement Modal component
export function Modal({ children, isOpen, onClose }: { children: React.ReactNode; isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <div>
      <div onClick={onClose} />
      <div>{children}</div>
    </div>
  );
}
