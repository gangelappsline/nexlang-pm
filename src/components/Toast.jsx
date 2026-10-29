import { useEffect } from 'react';
import { FiCheckCircle, FiXCircle, FiX } from 'react-icons/fi';

const Toast = ({ message, type='success', position='top-right', duration = 3000, onClose }) => {
  console.log('Rendering Toast:', { message, type, position, duration });
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  };

  const positions = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
  };

  const icons = {
    success: <FiCheckCircle className="text-green-600" size={20} />,
    error: <FiXCircle className="text-red-600" size={20} />,
  };

  return (
    <div className={`fixed ${positions[position] || positions['top-right']} z-50 animate-slideIn rounded-lg border px-4 py-3 shadow-lg flex items-center gap-3 min-w-75 max-w-md ${styles[type]}`}>
      {icons[type]}
      <span className="flex-1 text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className="hover:opacity-70 transition-opacity"
        aria-label="Close"
      >
        <FiX size={18} />
      </button>
    </div>
  );
};

export default Toast;
