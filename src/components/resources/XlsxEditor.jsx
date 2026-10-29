import { useState, useEffect } from 'react';
import { FiX, FiSave, FiPlus, FiTrash2 } from 'react-icons/fi';

const XlsxEditor = ({ file, onSave, onClose, getContent }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      try {
        const data = await getContent(file.id);
        // Assume API returns array of rows, each row is an array of cell values
        const initialRows = data?.rows || [
          [{ value: '' }, { value: '' }, { value: '' }, { value: '' }],
          [{ value: '' }, { value: '' }, { value: '' }, { value: '' }],
          [{ value: '' }, { value: '' }, { value: '' }, { value: '' }],
        ];
        setRows(initialRows);
      } catch (error) {
        console.error('Failed to load content:', error);
        // Initialize with empty grid
        setRows([
          [{ value: '' }, { value: '' }, { value: '' }, { value: '' }],
          [{ value: '' }, { value: '' }, { value: '' }, { value: '' }],
          [{ value: '' }, { value: '' }, { value: '' }, { value: '' }],
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [file.id, getContent]);

  const handleCellChange = (rowIndex, colIndex, value) => {
    setRows(prev => {
      const newRows = [...prev];
      newRows[rowIndex] = [...newRows[rowIndex]];
      newRows[rowIndex][colIndex] = { value };
      return newRows;
    });
  };

  const addRow = () => {
    const colCount = rows[0]?.length || 4;
    const newRow = Array(colCount).fill(null).map(() => ({ value: '' }));
    setRows(prev => [...prev, newRow]);
  };

  const addColumn = () => {
    setRows(prev => prev.map(row => [...row, { value: '' }]));
  };

  const deleteRow = (rowIndex) => {
    if (rows.length <= 1) return;
    setRows(prev => prev.filter((_, i) => i !== rowIndex));
  };

  const deleteColumn = (colIndex) => {
    if (rows[0]?.length <= 1) return;
    setRows(prev => prev.map(row => row.filter((_, i) => i !== colIndex)));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(file.id, { rows });
      onClose();
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  const getColumnLabel = (index) => {
    let label = '';
    let num = index;
    while (num >= 0) {
      label = String.fromCharCode(65 + (num % 26)) + label;
      num = Math.floor(num / 26) - 1;
    }
    return label;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">{file.name}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={addRow}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              title="Add Row"
            >
              <FiPlus size={16} />
              Row
            </button>
            <button
              onClick={addColumn}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              title="Add Column"
            >
              <FiPlus size={16} />
              Column
            </button>
            <div className="w-px h-6 bg-slate-300" />
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

        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="inline-block min-w-full">
              <table className="border-collapse">
                <thead>
                  <tr>
                    <th className="w-12 h-8 bg-slate-100 border border-slate-300 text-xs font-medium text-slate-600"></th>
                    {rows[0]?.map((_, colIndex) => (
                      <th
                        key={colIndex}
                        className="min-w-30 h-8 bg-slate-100 border border-slate-300 text-xs font-medium text-slate-600 relative group"
                      >
                        {getColumnLabel(colIndex)}
                        {rows[0].length > 1 && (
                          <button
                            onClick={() => deleteColumn(colIndex)}
                            className="absolute top-1 right-1 p-0.5 rounded bg-red-100 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete Column"
                          >
                            <FiTrash2 size={10} />
                          </button>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      <td className="w-12 h-8 bg-slate-100 border border-slate-300 text-xs font-medium text-slate-600 text-center relative group">
                        {rowIndex + 1}
                        {rows.length > 1 && (
                          <button
                            onClick={() => deleteRow(rowIndex)}
                            className="absolute top-1 right-1 p-0.5 rounded bg-red-100 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete Row"
                          >
                            <FiTrash2 size={10} />
                          </button>
                        )}
                      </td>
                      {row.map((cell, colIndex) => (
                        <td key={colIndex} className="border border-slate-300 p-0">
                          <input
                            type="text"
                            value={cell.value}
                            onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                            className="w-full h-8 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:relative focus:z-10"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default XlsxEditor;
