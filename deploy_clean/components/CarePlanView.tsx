
import React, { useState } from 'react';
import { CarePlan } from '../types';

interface CarePlanViewProps {
  plan: CarePlan;
}

// コピーボタンコンポーネント
const CopyButton: React.FC<{ text: string, small?: boolean }> = ({ text, small = false }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`no-print rounded-lg hover:bg-indigo-50 transition-all text-indigo-500 flex items-center justify-center shrink-0 ${small ? 'p-1' : 'p-2 border border-indigo-100 bg-indigo-50/30'}`}
      title="クリップボードにコピー"
    >
      {copied ? (
        <svg className={`${small ? 'w-4 h-4' : 'w-5 h-5'} text-emerald-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className={`${small ? 'w-4 h-4' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3" />
        </svg>
      )}
    </button>
  );
};

const CarePlanView: React.FC<CarePlanViewProps> = ({ plan }) => {

  return (
    <div className="space-y-10 bg-white p-4 md:p-10 rounded-3xl border border-gray-100 shadow-sm print:shadow-none print:border-none print:p-0">
      <div className="border-b border-gray-200 pb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">居宅サービス計画書（案）</h2>
        <p className="text-gray-500 text-sm">アセスメント結果に基づくAI生成プラン</p>
      </div>

      <div className="space-y-6">
        <h3 className="text-lg font-bold text-gray-800 bg-gray-50 p-3 rounded-lg border-l-4 border-indigo-600">
          第1表：基本方針・分析
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="space-y-3 pdf-avoid-break">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-bold text-indigo-600">意向を踏まえた課題分析の結果</h4>
              <CopyButton text={plan.analysisResult} />
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 text-gray-700 text-sm leading-relaxed min-h-[140px] whitespace-pre-wrap">
              {plan.analysisResult}
            </div>
          </section>

          <section className="space-y-3 pdf-avoid-break">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-bold text-indigo-600">総合的な援助の方針</h4>
              <CopyButton text={plan.comprehensivePolicy} />
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 text-gray-700 text-sm leading-relaxed min-h-[140px] whitespace-pre-wrap">
              {plan.comprehensivePolicy}
            </div>
          </section>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-lg font-bold text-gray-800 bg-gray-50 p-3 rounded-lg border-l-4 border-emerald-600">
          第2表：解決すべき課題と目標
        </h3>

        {plan.planItems.map((item, idx) => (
          <div key={idx} className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm pdf-avoid-break">
            <div className="bg-emerald-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h4 className="font-bold text-emerald-800 flex items-center gap-2">
                <span className="bg-emerald-600 text-white w-6 h-6 rounded-full inline-flex items-center justify-center text-xs">
                  {idx + 1}
                </span>
                解決すべき課題：{item.need}
              </h4>
              <CopyButton text={item.need} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 border-b border-gray-100">
              <div className="p-4 border-r border-gray-100 flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">長期目標</p>
                  <CopyButton text={item.longTermGoal} />
                </div>
                <p className="text-gray-800 text-sm font-medium">{item.longTermGoal}</p>
              </div>
              <div className="p-4 flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">短期目標</p>
                  <CopyButton text={item.shortTermGoal} />
                </div>
                <p className="text-gray-800 text-sm font-medium">{item.shortTermGoal}</p>
              </div>
            </div>

            <div className="p-0 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">サービス内容（具体的プラン）</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider w-40">サービス種別</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {item.services.map((svc, sIdx) => (
                    <tr key={sIdx} className="pdf-avoid-break hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-5 text-sm text-gray-700 align-top relative">
                        <div className="flex justify-between items-start gap-4">
                          <ul className="space-y-2 flex-grow">
                            {svc.contentItems.map((content, cIdx) => (
                              <li key={cIdx} className="flex items-start gap-2">
                                <span className="text-indigo-400 mt-1 shrink-0">•</span>
                                <span className="leading-relaxed">{content}</span>
                              </li>
                            ))}
                          </ul>
                          {/* サービス内容全体をコピーするアイコンボタン */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity no-print">
                            <CopyButton text={svc.contentItems.join('\n')} />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm font-bold text-indigo-600 align-top border-l border-gray-50">
                        {svc.serviceType}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      <section className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100 pdf-avoid-break">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-bold text-amber-700 uppercase tracking-wider">活かせる強み・地域資源</h3>
          <CopyButton text={plan.utilizingStrengths} />
        </div>
        <p className="text-amber-900 text-sm leading-relaxed">{plan.utilizingStrengths}</p>
      </section>
    </div>
  );
};

export default CarePlanView;
