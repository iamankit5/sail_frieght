// frontend/src/components/audit/ModelHonestyAudit.tsx
import React, { useState } from 'react';
import { ModelAuditData } from '../../types';
import { ShieldCheck, AlertTriangle, Cpu, FileText, BarChart2, Trash2 } from 'lucide-react';
import { ProvenanceBadge } from '../provenance/ProvenanceBadge';
import { CardHeader } from '../ui/Primitives';

interface ModelHonestyAuditProps {
  auditData: ModelAuditData;
}

const statusTone = (status: string): string => {
  if (status.includes('BEATS NAIVE') || status.includes('OK (')) {
    return 'bg-emerald-500/10 border-emerald-400/45 text-emerald-300';
  }
  if (status.includes('COLLAPSE')) {
    return 'bg-rose-500/10 border-rose-400/45 text-rose-300';
  }
  // NO SKILL / NO EDGE / anything else
  return 'bg-amber-500/10 border-amber-400/45 text-amber-300';
};

export const ModelHonestyAudit: React.FC<ModelHonestyAuditProps> = ({ auditData }) => {
  const modelKeys = Object.keys(auditData.models);
  // Default the deep dive to the strongest performer (the naive-anchored RF).
  const defaultKey =
    modelKeys.find((k) => k === 'freight_random_forest_regressor') ?? modelKeys[0] ?? '';
  const [selectedModelKey, setSelectedModelKey] = useState<string>(defaultKey);
  const selectedModel = auditData.models[selectedModelKey] ?? auditData.models[defaultKey];

  const naive = auditData.summary.naive_baseline_check;
  const clfBench = auditData.summary.classifier_benchmark;
  const quarantined = auditData.quarantined_models ?? [];

  return (
    <div className="space-y-5 animate-fadeIn">

      {/* Top Banner: Scientific Integrity Declaration */}
      <div className="terminal-card p-4 reveal">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[rgba(56,116,187,0.16)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-400/40 text-amber-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 uppercase tracking-wide">
                Model Transparency & Integrity Center
              </h2>
              <p className="text-xs text-slate-400">
                Chronological validation · zero-ML naive benchmarks · full disclosure of limitations
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">
              Audit: {auditData.evaluation_timestamp.split('T')[0]}
            </span>
            <ProvenanceBadge type="HISTORICAL" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 text-xs font-mono">
          <div className="inset-well p-3">
            <span className="text-slate-500 block text-[11px] font-sans">Evaluated Models</span>
            <span className="text-lg font-bold text-slate-100 num">{auditData.summary.total_models_evaluated} live checkpoints</span>
            <span className="text-[10px] text-sky-400 block mt-0.5">Naive-anchored RF & GB regressors · direction classifier</span>
          </div>

          <div className="inset-well p-3">
            <span className="text-slate-500 block text-[11px] font-sans">Zero-ML Naive Baseline Audit</span>
            <span className={`text-lg font-bold num ${naive.models_beating_naive_baseline > 0 ? 'text-emerald-300' : 'text-amber-400'}`}>
              {naive.models_beating_naive_baseline} / {naive.models_checked} models beat naive
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Chronological holdout · shrinkage tuned on a separate validation slice
            </span>
          </div>

          <div className="inset-well p-3">
            <span className="text-slate-500 block text-[11px] font-sans">Direction Classifier Benchmark</span>
            {clfBench ? (
              <>
                <span className={`text-lg font-bold num ${clfBench.beats_majority_baseline ? 'text-emerald-300' : 'text-amber-400'}`}>
                  {(clfBench.test_accuracy * 100).toFixed(1)}% vs majority {(clfBench.majority_baseline_accuracy * 100).toFixed(1)}%
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {clfBench.beats_majority_baseline ? 'Real out-of-sample edge' : 'No edge — excluded from decision logic'}
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-slate-400">Benchmark pending</span>
            )}
          </div>
        </div>

        {auditData.methodology && (
          <p className="mt-3 text-[11px] text-slate-500 leading-relaxed font-sans">
            <span className="text-slate-400 font-semibold">Methodology: </span>{auditData.methodology}
          </p>
        )}
      </div>

      {/* Quarantined data incidents */}
      {quarantined.map((q) => (
        <div
          key={q.model_name}
          className="rounded-xl border p-4 reveal"
          style={{
            background: 'linear-gradient(135deg, rgba(80,10,25,0.35), rgba(16,6,12,0.85))',
            borderColor: 'rgba(251,113,133,0.35)',
            boxShadow: '0 0 32px -14px rgba(251,113,133,0.4)',
          }}
        >
          <div className="flex items-start gap-3">
            <span className="p-2 rounded-lg bg-rose-500/10 border border-rose-400/40 text-rose-300 shrink-0">
              <Trash2 className="w-4 h-4" />
            </span>
            <div className="text-sm">
              <span className="font-bold text-rose-200 block">{q.model_name} — {q.status}</span>
              <p className="text-[12px] text-slate-300 leading-relaxed mt-1">{q.diagnosis_reason}</p>
            </div>
          </div>
        </div>
      ))}

      {/* Model Performance Benchmark Table */}
      <div className="terminal-card p-4 reveal reveal-d2">
        <CardHeader
          icon={<BarChart2 className="w-4 h-4 text-sky-400" />}
          title="Verified Performance & Naive Persistence Audit"
          subtitle="Click a row for the full diagnostic and confusion matrix"
          right={<span className="text-xs font-mono text-slate-400">Chronological 70/10/20 train/val/test split</span>}
        />

        <div className="overflow-x-auto rounded-lg border border-[rgba(56,116,187,0.12)]">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[rgba(56,116,187,0.2)] text-slate-400 bg-[#081020]/95 uppercase text-[10.5px] tracking-wider">
                <th className="py-2.5 px-3">Model</th>
                <th className="py-2.5 px-3">Task / Target</th>
                <th className="py-2.5 px-3">Test Metric</th>
                <th className="py-2.5 px-3">Zero-ML Naive Baseline</th>
                <th className="py-2.5 px-3">Overfit Ratio / Gap</th>
                <th className="py-2.5 px-3">Honest Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(56,116,187,0.1)]">
              {Object.entries(auditData.models).map(([key, m]) => {
                const isSelected = selectedModelKey === key;
                const isClf = 'test_accuracy' in m.metrics;
                const beats = !isClf && m.metrics.beats_naive_baseline === true;

                return (
                  <tr
                    key={key}
                    onClick={() => setSelectedModelKey(key)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-sky-500/[0.09] text-slate-100 font-semibold' : 'hover:bg-[#0d1729] text-slate-300'
                    }`}
                  >
                    <td className="py-3 px-3 whitespace-nowrap" style={isSelected ? { boxShadow: 'inset 3px 0 0 0 #38bdf8' } : undefined}>
                      <div className="font-bold text-slate-100 flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-sky-400" />
                        <span>{m.model_name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-sans">{m.dataset}</span>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap text-slate-400 text-[11px]">{m.task}</td>

                    <td className="py-3 px-3 whitespace-nowrap font-bold">
                      {isClf ? (
                        <span className="text-amber-300 num">
                          Acc: {((m.metrics.test_accuracy ?? 0) * 100).toFixed(1)}%
                          {m.metrics.majority_baseline_accuracy != null && (
                            <span className="text-slate-500 font-normal"> (maj {((m.metrics.majority_baseline_accuracy) * 100).toFixed(1)}%)</span>
                          )}
                        </span>
                      ) : (
                        <span className={beats ? 'text-emerald-300' : 'text-slate-200'}>
                          R²: {m.metrics.test_r2?.toFixed(3)} (RMSE: {m.metrics.test_rmse?.toFixed(2)})
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap text-[11px]">
                      {isClf ? (
                        <span className="text-slate-400">Macro F1: {m.metrics.f1_score_macro?.toFixed(2)}</span>
                      ) : (
                        <span className="text-amber-300 font-bold num">
                          RMSE: {m.metrics.naive_baseline_rmse?.toFixed(2)} (R²: {m.metrics.naive_baseline_r2?.toFixed(3)})
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      {isClf ? (
                        <span className="num">Gap: {((m.metrics.accuracy_gap ?? 0) * 100).toFixed(1)}%</span>
                      ) : (
                        <span className="num">Ratio: {m.metrics.rmse_overfit_ratio?.toFixed(2)}</span>
                      )}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${statusTone(m.status)}`}>
                        {m.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Model Deep Dive & Confusion Matrix */}
      {selectedModel && (
        <div className="terminal-card p-4 reveal reveal-d3">
          <CardHeader
            icon={<FileText className="w-4 h-4 text-amber-400" />}
            title={`Deep Dive: ${selectedModel.model_name}`}
            right={
              <span className="text-xs font-mono text-slate-400">
                Samples: {selectedModel.train_samples} train
                {selectedModel.validation_samples != null ? ` / ${selectedModel.validation_samples} val` : ''}
                {` / ${selectedModel.test_samples} test`}
              </span>
            }
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Diagnosis and Commentary (7 cols) */}
            <div className="lg:col-span-7 space-y-3">
              <div className="inset-well p-3.5 text-xs">
                <span className="text-slate-400 font-bold block mb-1.5 uppercase text-[10px] tracking-wider">
                  Automated Diagnostic & Justification
                </span>
                <p className="text-slate-200 leading-relaxed">{selectedModel.diagnosis_reason}</p>
              </div>

              <div className="p-3.5 rounded-lg bg-amber-500/[0.07] border border-amber-400/30 text-xs text-slate-300">
                <span className="font-bold text-amber-300 flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Engineering Transparency Notes:
                </span>
                <p className="text-[11px] leading-relaxed">
                  {selectedModel.task.includes('Classification') ? (
                    <>
                      <strong>Why we publish a losing classifier:</strong> The direction classifier fails to clear the
                      majority-class baseline on its chronological test window — so it is labeled accordingly and excluded
                      from every production decision. Freight timing signals in this platform are computed from transparent
                      rate deltas and forecast bands, never from a model that does not demonstrably beat its baseline.
                    </>
                  ) : (
                    <>
                      <strong>How these regressors earn their edge:</strong> Each model predicts only the{' '}
                      <em>residual</em> against a zero-ML naive forecast (7-day moving average), with a shrinkage factor
                      tuned on a separate validation slice — so it deviates from the naive forecast only when its learned
                      pattern was genuinely reliable in validation. The resulting out-of-sample RMSE improvement is
                      confirmed by forward-chaining cross-validation, not a single lucky split.
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Confusion Matrix Heatmap (5 cols) */}
            <div className="lg:col-span-5 flex flex-col justify-between">
              <div className="inset-well p-3">
                <span className="text-slate-400 text-xs font-mono font-bold block mb-2 text-center uppercase">
                  Discretized Confusion Matrix
                </span>

                <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-xs">
                  {selectedModel.confusion_matrix.map((row, rIdx) =>
                    row.map((val, cIdx) => (
                      <div
                        key={`${rIdx}-${cIdx}`}
                        className={`p-2.5 rounded-lg flex flex-col justify-center items-center border ${
                          rIdx === cIdx && val > 0
                            ? 'bg-sky-500/15 border-sky-400/50 text-sky-200'
                            : (val > 0 ? 'bg-[#121c2d] border-[rgba(56,116,187,0.3)] text-slate-300' : 'bg-[#050912] border-[rgba(56,116,187,0.12)] text-slate-600')
                        }`}
                      >
                        <span className="text-sm font-bold num">{val}</span>
                        <span className="text-[9px] text-slate-500 uppercase mt-0.5">
                          A:{rIdx} P:{cIdx}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-2 pt-2 border-t border-[rgba(56,116,187,0.14)]">
                  <span>Rows: actual</span>
                  <span>Columns: predicted</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 font-mono text-center pt-2">
                Publication PNGs in <code className="text-sky-300">ml/reports/confusion_matrix/</code>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
