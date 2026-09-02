import React, { useState, useEffect } from 'react';
import {
  FileText,
  Presentation,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  FileSpreadsheet,
  FolderOpen,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { JournalEntry, UserProfile, WorkspaceExportResult, WorkspaceFileItem } from '../types';
import {
  exportJournalToGoogleDoc,
  exportJournalToGoogleSlides,
  listGoogleDocs,
  listGoogleSlides,
} from '../lib/workspace';
import { getCachedAccessToken, signInWithGoogle } from '../lib/firebase';

interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeEntry: JournalEntry | null;
  user: UserProfile;
}

export const WorkspaceModal: React.FC<WorkspaceModalProps> = ({
  isOpen,
  onClose,
  activeEntry,
  user,
}) => {
  const [activeTab, setActiveTab] = useState<'docs' | 'slides' | 'browse'>('docs');
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<WorkspaceExportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentDocs, setRecentDocs] = useState<WorkspaceFileItem[]>([]);
  const [recentSlides, setRecentSlides] = useState<WorkspaceFileItem[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [confirmDocExport, setConfirmDocExport] = useState(false);
  const [confirmSlideExport, setConfirmSlideExport] = useState(false);

  // Load recent docs/slides when browse tab is selected
  useEffect(() => {
    if (!isOpen) {
      setExportResult(null);
      setError(null);
      setConfirmDocExport(false);
      setConfirmSlideExport(false);
      return;
    }

    const token = getCachedAccessToken();
    if (token && activeTab === 'browse') {
      loadWorkspaceFiles(token);
    }
  }, [isOpen, activeTab]);

  const loadWorkspaceFiles = async (token: string) => {
    setIsLoadingFiles(true);
    setError(null);
    try {
      const [docs, slides] = await Promise.all([
        listGoogleDocs(token).catch(() => []),
        listGoogleSlides(token).catch(() => []),
      ]);
      setRecentDocs(docs);
      setRecentSlides(slides);
    } catch (err: any) {
      setError(err?.message || 'Failed to list workspace files.');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleExportDoc = async () => {
    if (!activeEntry) return;
    let token = getCachedAccessToken();

    if (!token) {
      try {
        await signInWithGoogle();
        token = getCachedAccessToken();
      } catch (err: any) {
        setError('Authentication required to export to Google Docs.');
        return;
      }
    }

    if (!token) {
      setError('Please sign in with Google to authorize Google Docs creation.');
      return;
    }

    setIsExporting(true);
    setError(null);
    setExportResult(null);

    try {
      const result = await exportJournalToGoogleDoc(activeEntry, token);
      setExportResult(result);
      setConfirmDocExport(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to export document to Google Docs.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSlides = async () => {
    if (!activeEntry) return;
    let token = getCachedAccessToken();

    if (!token) {
      try {
        await signInWithGoogle();
        token = getCachedAccessToken();
      } catch (err: any) {
        setError('Authentication required to export to Google Slides.');
        return;
      }
    }

    if (!token) {
      setError('Please sign in with Google to authorize Google Slides creation.');
      return;
    }

    setIsExporting(true);
    setError(null);
    setExportResult(null);

    try {
      const result = await exportJournalToGoogleSlides(activeEntry, token);
      setExportResult(result);
      setConfirmSlideExport(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to export presentation to Google Slides.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="workspace-integration-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Google Workspace Integration</h2>
              <p className="text-xs text-slate-500">
                Export and synchronize reflections directly into Google Docs and Google Slides
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-white px-5 pt-2 gap-4">
          <button
            id="tab-google-docs"
            onClick={() => {
              setActiveTab('docs');
              setExportResult(null);
              setError(null);
            }}
            className={`flex items-center gap-2 pb-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'docs'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4 text-blue-500" />
            <span>Google Docs</span>
          </button>
          <button
            id="tab-google-slides"
            onClick={() => {
              setActiveTab('slides');
              setExportResult(null);
              setError(null);
            }}
            className={`flex items-center gap-2 pb-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'slides'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Presentation className="w-4 h-4 text-amber-500" />
            <span>Google Slides</span>
          </button>
          <button
            id="tab-workspace-browse"
            onClick={() => {
              setActiveTab('browse');
              setExportResult(null);
              setError(null);
            }}
            className={`flex items-center gap-2 pb-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'browse'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FolderOpen className="w-4 h-4 text-indigo-500" />
            <span>Browse Drive Files</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold">Workspace Notice:</span> {error}
              </div>
            </div>
          )}

          {/* Docs Tab Content */}
          {activeTab === 'docs' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                <h3 className="text-xs font-bold text-blue-900 mb-1 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Export Reflection to Google Docs
                </h3>
                <p className="text-xs text-blue-800/80 leading-relaxed">
                  Generates an executive document containing your journal dialogue, AI synthesis,
                  emotional resonance metrics, key takeaways, and action items.
                </p>
              </div>

              {activeEntry && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Selected Reflection
                  </div>
                  <div className="text-sm font-bold text-slate-800">{activeEntry.title}</div>
                  <div className="text-xs text-slate-500">
                    {new Date(activeEntry.createdAt).toLocaleDateString()} • {activeEntry.mood} •{' '}
                    {activeEntry.messages.length} message(s)
                  </div>
                </div>
              )}

              {exportResult && exportResult.type === 'doc' ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Google Doc created successfully!</span>
                  </div>
                  <p className="text-xs text-emerald-700">{exportResult.fileName}</p>
                  <a
                    href={exportResult.webViewLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                  >
                    <span>Open in Google Docs</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : confirmDocExport ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                  <div className="text-xs font-bold text-amber-900">
                    Confirm Google Doc Creation
                  </div>
                  <p className="text-xs text-amber-800">
                    This will create a new Google Doc in your Google Drive titled &ldquo;
                    {activeEntry?.title || 'Reflection'}&rdquo;. Do you wish to continue?
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      id="confirm-doc-export-btn"
                      onClick={handleExportDoc}
                      disabled={isExporting}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      <span>{isExporting ? 'Creating Google Doc...' : 'Yes, Create Document'}</span>
                    </button>
                    <button
                      onClick={() => setConfirmDocExport(false)}
                      disabled={isExporting}
                      className="px-3 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  id="btn-export-to-google-docs"
                  onClick={() => setConfirmDocExport(true)}
                  disabled={!activeEntry || isExporting}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <FileText className="w-4 h-4" />
                  <span>Export to Google Docs</span>
                </button>
              )}
            </div>
          )}

          {/* Slides Tab Content */}
          {activeTab === 'slides' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl">
                <h3 className="text-xs font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                  <Presentation className="w-4 h-4 text-amber-600" />
                  Export Reflection Deck to Google Slides
                </h3>
                <p className="text-xs text-amber-800/80 leading-relaxed">
                  Creates a structured 4-slide presentation deck with Executive Summary,
                  Emotional Resonance, Key Insights, and Actionable Goals.
                </p>
              </div>

              {activeEntry && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Deck Preview Scope
                  </div>
                  <div className="text-sm font-bold text-slate-800">{activeEntry.title}</div>
                  <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] text-slate-600">
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <span className="font-semibold block text-slate-800">Slide 1:</span> Title &amp; Date
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <span className="font-semibold block text-slate-800">Slide 2:</span> Executive Summary
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <span className="font-semibold block text-slate-800">Slide 3:</span> Insights &amp; Actions
                    </div>
                  </div>
                </div>
              )}

              {exportResult && exportResult.type === 'slides' ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Google Slides Presentation created successfully!</span>
                  </div>
                  <p className="text-xs text-emerald-700">{exportResult.fileName}</p>
                  <a
                    href={exportResult.webViewLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                  >
                    <span>Open in Google Slides</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : confirmSlideExport ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                  <div className="text-xs font-bold text-amber-900">
                    Confirm Google Slides Creation
                  </div>
                  <p className="text-xs text-amber-800">
                    This will create a new Google Slides presentation deck in your Google Drive titled
                    &ldquo;{activeEntry?.title || 'Reflection'}&rdquo;. Do you wish to continue?
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      id="confirm-slides-export-btn"
                      onClick={handleExportSlides}
                      disabled={isExporting}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      <span>{isExporting ? 'Creating Slides...' : 'Yes, Create Presentation'}</span>
                    </button>
                    <button
                      onClick={() => setConfirmSlideExport(false)}
                      disabled={isExporting}
                      className="px-3 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  id="btn-export-to-google-slides"
                  onClick={() => setConfirmSlideExport(true)}
                  disabled={!activeEntry || isExporting}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Presentation className="w-4 h-4" />
                  <span>Export to Google Slides</span>
                </button>
              )}
            </div>
          )}

          {/* Browse Drive Tab */}
          {activeTab === 'browse' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800">Recent Workspace Files</h3>
                <button
                  onClick={() => {
                    const token = getCachedAccessToken();
                    if (token) loadWorkspaceFiles(token);
                  }}
                  disabled={isLoadingFiles}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {isLoadingFiles ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="text-xs">Loading Google Drive files...</span>
                </div>
              ) : recentDocs.length === 0 && recentSlides.length === 0 ? (
                <div className="text-center py-8 px-4 border border-dashed border-slate-200 rounded-xl text-slate-500 text-xs">
                  No recent Google Docs or Slides found in your Drive or authorization needed.
                </div>
              ) : (
                <div className="space-y-3">
                  {recentDocs.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">
                        Google Docs ({recentDocs.length})
                      </div>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {recentDocs.map((doc) => (
                          <a
                            key={doc.id}
                            href={doc.webViewLink || `https://docs.google.com/document/d/${doc.id}/edit`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-200 rounded-xl transition-colors text-xs text-slate-800 group"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                              <span className="font-medium truncate">{doc.name}</span>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {recentSlides.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                        Google Slides ({recentSlides.length})
                      </div>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {recentSlides.map((slide) => (
                          <a
                            key={slide.id}
                            href={slide.webViewLink || `https://docs.google.com/presentation/d/${slide.id}/edit`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-amber-50/60 border border-slate-200 hover:border-amber-200 rounded-xl transition-colors text-xs text-slate-800 group"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Presentation className="w-4 h-4 text-amber-500 shrink-0" />
                              <span className="font-medium truncate">{slide.name}</span>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <span>Connected to Google Workspace OAuth Scopes</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
