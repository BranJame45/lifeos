'use client';
import { X } from 'lucide-react';

interface PlanConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
}

export default function PlanConfirmModal({ isOpen, onClose, onConfirm, title, children }: PlanConfirmModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="p-4 max-h-96 overflow-y-auto">{children}</div>
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">Confirm</button>
        </div>
      </div>
    </div>
  );
}
