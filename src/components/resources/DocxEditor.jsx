import { useState, useEffect, useRef } from 'react';
import { FiX, FiSave, FiBold, FiItalic, FiUnderline } from 'react-icons/fi';

const DocxEditor = ({ file, onSave, onClose, getContent }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const editorRef = useRef(null);

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      try {
        const data = await getContent(file.id);
        // Assume API returns HTML content for .docx files
        setContent(data?.content || '');
      } catch (error) {
        console.error('Failed to load content:', error);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [file.id, getContent]);

  useEffect(() => {
    if (editorRef.current && !loading) {
      editorRef.current.innerHTML = content;
    }
  }, [loading, content]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const htmlContent = editorRef.current.innerHTML;
      await onSave(file.id, htmlContent);
      onClose();
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">{file.name}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <FiSave size={16} />
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {!loading && (
          <div className="flex items-center gap-1 px-6 py-3 border-b border-slate-200">
            <button
              onClick={() => execCommand('bold')}
              className="p-2 rounded hover:bg-slate-100 text-slate-600"
              title="Bold"
            >
              <FiBold size={16} />
            </button>
            <button
              onClick={() => execCommand('italic')}
              className="p-2 rounded hover:bg-slate-100 text-slate-600"
              title="Italic"
            >
              <FiItalic size={16} />
            </button>
            <button
              onClick={() => execCommand('underline')}
              className="p-2 rounded hover:bg-slate-100 text-slate-600"
              title="Underline"
            >
              <FiUnderline size={16} />
            </button>
            <div className="w-px h-6 bg-slate-300 mx-2" />
            <select
              onChange={(e) => execCommand('formatBlock', e.target.value)}
              className="px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="p">Paragraph</option>
              <option value="h1">Heading 1</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
            </select>
          </div>
        )}

        <div className="flex-1 p-6 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div
              ref={editorRef}
              contentEditable
              className="w-full min-h-full p-6 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              style={{ minHeight: '500px' }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DocxEditor;
