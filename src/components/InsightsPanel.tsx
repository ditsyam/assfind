import React from 'react';
import { Sparkles, CheckSquare, Lightbulb, HelpCircle, Tag, Download, RefreshCw, BarChart2 } from 'lucide-react';
import { JournalEntry } from '../types';

interface InsightsPanelProps {
  entry: JournalEntry | null;
  onGenerateSummary: () => Promise<void>;
  isSummarizing: boolean;
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({
  entry,
  onGenerateSummary,
  isSummarizing,
}) => {
  if (!entry) {
    return null;
  }

  const handleExport = () => {
    const md = `# ${entry.title || 'Journal Reflection'}
*Date: ${new Date(entry.updatedAt).toLocaleString()}*
*Mood: ${entry.mood || 'Reflective'}*

## Executive Summary
${entry.summary || 'No summary generated.'}

## Key Takeaways
${(entry.keyTakeaways || []).map((t) => `- ${t}`).join('\n')}

## Action Items
${(entry.actionItems || []).map((a) => `- [ ] ${a}`).join('\n')}

## Follow-up Reflection
${entry.followUpPrompt || 'None'}

---
## Dialogue
${entry.messages
  .map((m) => `### ${m.role === 'user' ? 'User' : 'ReflectAI (Gemini)'}\n${m.content}`)
  .join('\n\n')}
`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(entry.title || 'reflection').toLowerCase().replace(/\s+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full lg:w-96 bg-white border-l border-slate-200 flex flex-col h-full overflow-hidden shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-900">AI Synthesis & Insights</h2>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            id="export-markdown-btn"
            onClick={handleExport}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Export to Markdown"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Summarize Action Card */}
        <div className="p-3.5 bg-gradient-to-br from-indigo-50/70 to-violet-50/70 border border-indigo-100 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-indigo-950">Gemini Synthesis</span>
            <span className="text-[10px] font-medium text-indigo-600 bg-white px-2 py-0.5 rounded-full border border-indigo-100">
              Structured
            </span>
          </div>
          <p className="text-xs text-indigo-800/80 mb-3 leading-relaxed">
            Distill your journal dialogue into clear summaries, takeaways, and next steps.
          </p>
          <button
            id="generate-summary-btn"
            onClick={onGenerateSummary}
            disabled={isSummarizing || entry.messages.length === 0}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSummarizing ? 'animate-spin' : ''}`} />
            <span>{isSummarizing ? 'Analyzing & Synthesizing...' : entry.summary ? 'Regenerate Insights' : 'Synthesize Insights'}</span>
          </button>
        </div>

        {/* Executive Summary */}
        {entry.summary ? (
          <div className="space-y-4">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Executive Summary</h3>
              <p className="text-xs text-slate-700 leading-relaxed">{entry.summary}</p>
            </div>

            {/* Sentiment & Mood Score */}
            {typeof entry.sentimentScore === 'number' && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <BarChart2 className="w-3.5 h-3.5 text-indigo-600" />
                    Emotional Resonance
                  </span>
                  <span className="text-xs font-bold text-indigo-600">{entry.sentimentScore}/10</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(10, entry.sentimentScore * 10))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>Challenged</span>
                  <span className="font-semibold text-slate-600">{entry.mood || 'Reflective'}</span>
                  <span>Energized</span>
                </div>
              </div>
            )}

            {/* Tags */}
            {entry.tags && entry.tags.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  Key Themes & Tags
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {entry.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-md text-[11px] font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Key Takeaways */}
            {entry.keyTakeaways && entry.keyTakeaways.length > 0 && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  Key Takeaways
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside">
                  {entry.keyTakeaways.map((takeaway, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {takeaway}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Items */}
            {entry.actionItems && entry.actionItems.length > 0 && (
              <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                  Actionable Next Steps
                </h3>
                <ul className="space-y-2 text-xs text-emerald-950">
                  {entry.actionItems.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        id={`action-item-${idx}`}
                        className="mt-0.5 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <label htmlFor={`action-item-${idx}`} className="leading-snug cursor-pointer">
                        {action}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Follow-up Prompt */}
            {entry.followUpPrompt && (
              <div className="p-3.5 bg-violet-50/60 border border-violet-200 rounded-xl">
                <h3 className="text-xs font-bold text-violet-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-violet-600" />
                  Tomorrow&apos;s Follow-up
                </h3>
                <p className="text-xs text-violet-950 italic leading-relaxed">
                  &ldquo;{entry.followUpPrompt}&rdquo;
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 px-4 border border-dashed border-slate-200 rounded-xl">
            <p className="text-xs text-slate-500">
              No summary generated yet. Start writing reflections and click &ldquo;Synthesize Insights&rdquo; above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
