
import React, { useRef, useEffect } from 'react';
import { AssessmentItem } from '../types';

interface AssessmentTableProps {
  items: AssessmentItem[];
  onUpdate: (id: string, field: keyof AssessmentItem, value: string) => void;
}

// 自動伸長テキストエリアコンポーネント
const AutoExpandingTextarea: React.FC<{
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const node = textareaRef.current;
    if (node) {
      node.style.height = 'auto';
      // scrollHeightに合わせて高さを設定（最低60pxは維持）
      node.style.height = `${Math.max(60, node.scrollHeight)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      className="auto-expand-text w-full border border-gray-100 rounded-xl p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[60px] resize-none bg-gray-50/30 overflow-hidden transition-[height] duration-100"
      rows={2}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  );
};

const AssessmentTable: React.FC<AssessmentTableProps> = ({ items, onUpdate }) => {
  const categories = Array.from(new Set(items.map(i => i.category)));

  return (
    <div className="overflow-x-auto bg-white shadow-xl rounded-2xl border border-gray-100">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50/50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-24">項目名</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-40">判定</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">具体的状況</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">強み</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {categories.map(cat => (
            <React.Fragment key={cat}>
              <tr className="bg-indigo-50/30 pdf-avoid-break">
                <td colSpan={4} className="px-4 py-2 font-bold text-indigo-700 text-sm">
                  {cat}
                </td>
              </tr>
              {items.filter(i => i.category === cat).map(item => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors pdf-avoid-break">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 align-top">
                    {item.itemName}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <select
                      className="w-full border border-gray-200 rounded-xl py-2 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm shadow-sm"
                      value={item.judgment}
                      onChange={(e) => onUpdate(item.id, 'judgment', e.target.value)}
                    >
                      <option value="">選択してください</option>
                      {item.judgmentOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <AutoExpandingTextarea
                      value={item.situation}
                      onChange={(e) => onUpdate(item.id, 'situation', e.target.value)}
                      placeholder="具体的な状況..."
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <AutoExpandingTextarea
                      value={item.strengths}
                      onChange={(e) => onUpdate(item.id, 'strengths', e.target.value)}
                      placeholder="本人の強み..."
                    />
                  </td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AssessmentTable;
