import React, { useState } from 'react';
import {
  X,
  GraduationCap,
  Search,
  BookOpen,
  Copy,
  Check,
  ExternalLink,
  Download,
  Loader2,
  Code2,
  Quote,
  Calendar,
  Building2,
  Users,
  Award,
  TrendingUp,
  Hash,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { ScholarArticle, ScholarAuthorProfile, UserProfile } from '../types';

interface ScholarModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onInsertIntoJournal?: (title: string, content: string) => void;
}

const PRESET_TOPICS = [
  'deep learning blockchain',
  'transformer neural architectures attention mechanisms',
  'quantum error correction topological qubits',
  'cognitive emotional regulation expressive journaling neuroscience',
  'reinforcement learning human feedback align large language models',
];

const PRESET_AUTHORS = [
  'Andrew Ng',
  'Geoffrey Hinton',
  'Yann LeCun',
  'Yoshua Bengio',
  'Fei-Fei Li',
  'Demis Hassabis',
];

export const ScholarModal: React.FC<ScholarModalProps> = ({
  isOpen,
  onClose,
  user,
  onInsertIntoJournal,
}) => {
  const [selectedTab, setSelectedTab] = useState<'search' | 'author' | 'code'>('author');

  // Paper Search State
  const [keyword, setKeyword] = useState('deep learning blockchain');
  const [limit, setLimit] = useState(5);
  const [articles, setArticles] = useState<ScholarArticle[]>([]);
  const [isSearchingArticles, setIsSearchingArticles] = useState(false);
  const [hasSearchedArticles, setHasSearchedArticles] = useState(false);

  // Author Profile State
  const [authorName, setAuthorName] = useState('Andrew Ng');
  const [authorProfile, setAuthorProfile] = useState<ScholarAuthorProfile | null>(null);
  const [isSearchingAuthor, setIsSearchingAuthor] = useState(false);
  const [hasSearchedAuthor, setHasSearchedAuthor] = useState(false);

  // Code Tab State
  const [selectedScript, setSelectedScript] = useState<'author' | 'papers'>('author');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedCsv, setCopiedCsv] = useState(false);

  // Handle Paper Search
  const handleSearchArticles = async () => {
    if (!keyword.trim()) return;

    setIsSearchingArticles(true);
    setHasSearchedArticles(true);
    try {
      const res = await fetch('/api/scholar/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user.role,
        },
        body: JSON.stringify({
          keyword: keyword.trim(),
          limit,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to query scientific index.');
      }

      const data = await res.json();
      setArticles(data.articles || []);
    } catch (err: any) {
      console.error('Error in scholar search:', err);
      alert('Error searching scholar index: ' + err.message);
    } finally {
      setIsSearchingArticles(false);
    }
  };

  // Handle Author Profile Search (cek_indeks_peneliti)
  const handleSearchAuthor = async () => {
    if (!authorName.trim()) return;

    setIsSearchingAuthor(true);
    setHasSearchedAuthor(true);
    try {
      const res = await fetch('/api/scholar/author', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user.role,
        },
        body: JSON.stringify({
          name: authorName.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to inspect researcher profile.');
      }

      const data = await res.json();
      setAuthorProfile(data.profile || null);
    } catch (err: any) {
      console.error('Error in author search:', err);
      alert('Error fetching researcher profile: ' + err.message);
    } finally {
      setIsSearchingAuthor(false);
    }
  };

  // Convert current articles to CSV string
  const generateCsvContent = () => {
    if (!articles.length) return '';
    const headers = ['Judul', 'Penulis', 'Tahun', 'Jurnal/Publisher', 'Jumlah Sitasi', 'Link'];
    const rows = articles.map((a) => [
      `"${a.title.replace(/"/g, '""')}"`,
      `"${a.authors.join(', ').replace(/"/g, '""')}"`,
      `"${a.pubYear}"`,
      `"${a.venue.replace(/"/g, '""')}"`,
      a.citations,
      `"${a.url}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  };

  const handleDownloadCsv = () => {
    const csvData = generateCsvContent();
    if (!csvData) return;

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `hasil_indeks_scholar_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyCsv = () => {
    const csvData = generateCsvContent();
    navigator.clipboard.writeText(csvData);
    setCopiedCsv(true);
    setTimeout(() => setCopiedCsv(false), 2000);
  };

  const pythonAuthorCode = `from scholarly import scholarly

def cek_indeks_peneliti(nama_peneliti):
    print(f"Mencari profil: {nama_peneliti}...")
    
    # Cari penulis berdasarkan nama
    search_query = scholarly.search_author(nama_peneliti)
    
    try:
        # Ambil hasil pertama yang paling cocok
        author = next(search_query)
        
        # Isi data profil secara lengkap (termasuk isi sitasi dan indeks)
        full_author_profile = scholarly.fill(author)
        
        print("\\n=== DATA PROFIL GOOGLE SCHOLAR ===")
        print(f"Nama       : {full_author_profile['name']}")
        print(f"Afiliasi   : {full_author_profile.get('affiliation', 'Tidak ada')}")
        print(f"Total Sitasi: {full_author_profile.get('citedby', 0)}")
        print(f"h-index    : {full_author_profile.get('hindex', 0)}")
        print(f"i10-index  : {full_author_profile.get('i10index', 0)}")
        
        print("\\n=== 3 PUBLIKASI TERATAS ===")
        for i, pub in enumerate(full_author_profile['publications'][:3]):
            judul = pub['bib'].get('title', 'No Title')
            print(f"{i+1}. {judul}")
            
    except StopIteration:
        print("Profil peneliti tidak ditemukan.")

# Jalankan fungsi untuk cek profil akademisi
if __name__ == "__main__":
    cek_indeks_peneliti("${authorName.replace(/"/g, '\\"')}")`;

  const pythonPapersCode = `from scholarly import scholarly
import pandas as pd

def cari_karya_ilmiah(keyword, jumlah_hasil=${limit}):
    print(f"Mencari artikel dengan kata kunci: '{keyword}'...\\n")
    
    # 1. Melakukan pencarian di Google Scholar
    search_query = scholarly.search_pubs(keyword)
    data_artikel = []
    
    # 2. Ekstraksi metadata bibliografis
    for i in range(jumlah_hasil):
        try:
            artikel = next(search_query)
            
            info = {
                "Judul": artikel['bib'].get('title', 'Tidak ada judul'),
                "Penulis": ", ".join(artikel['bib'].get('author', [])),
                "Tahun": artikel['bib'].get('pub_year', 'Tidak diketahui'),
                "Jurnal/Publisher": artikel['bib'].get('venue', 'Tidak diketahui'),
                "Jumlah Sitasi": artikel.get('num_citations', 0),
                "Link": artikel.get('pub_url', 'Tidak ada link')
            }
            data_artikel.append(info)
            
            print(f"[{i+1}] {info['Judul']}")
            print(f"    Penulis: {info['Penulis']} ({info['Tahun']})")
            print(f"    Disitasi oleh: {info['Jumlah Sitasi']} artikel\\n")
            
        except StopIteration:
            print("Sudah menampilkan semua hasil yang ditemukan.")
            break
            
    # 3. Menyimpan ke CSV DataFrame
    df = pd.DataFrame(data_artikel)
    output_filename = "hasil_indeks_scholar.csv"
    df.to_csv(output_filename, index=False)
    print(f"✅ Data berhasil disimpan ke '{output_filename}' ({len(data_artikel)} baris).")

if __name__ == "__main__":
    # Menjalankan pencarian untuk topik
    cari_karya_ilmiah("${keyword.replace(/"/g, '\\"')}", jumlah_hasil=${limit})`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[88vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-200">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-800">Google Scholar Academic Indexer</h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                  scholarly + pandas
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Inspect researcher citation metrics (h-index, i10-index), query publications, and export dataset to CSV
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tabs */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs">
              <button
                id="tab-scholar-author"
                onClick={() => setSelectedTab('author')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedTab === 'author'
                    ? 'bg-white text-blue-700 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Researcher Profile</span>
              </button>
              <button
                id="tab-scholar-search"
                onClick={() => setSelectedTab('search')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedTab === 'search'
                    ? 'bg-white text-blue-700 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Paper Index Search</span>
              </button>
              <button
                id="tab-scholar-code"
                onClick={() => setSelectedTab('code')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedTab === 'code'
                    ? 'bg-white text-blue-700 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Python Scripts</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* TAB 1: Researcher Profile Inspector (cek_indeks_peneliti) */}
          {selectedTab === 'author' && (
            <>
              {/* Left Column: Author Input */}
              <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-slate-200 p-4 sm:p-5 flex flex-col gap-4 bg-slate-50/50 overflow-y-auto">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    Researcher / Academic Name
                  </label>
                  <div className="relative">
                    <input
                      id="input-researcher-name"
                      type="text"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchAuthor()}
                      placeholder="e.g. Andrew Ng, Geoffrey Hinton..."
                      className="w-full text-xs sm:text-sm pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                {/* Preset Suggestions */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1.5">
                    Suggested Academic Profiles
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PRESET_AUTHORS.map((author, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setAuthorName(author);
                        }}
                        className={`text-left text-[11px] p-2 rounded-lg border transition-all truncate cursor-pointer ${
                          authorName === author
                            ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                            : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-slate-700'
                        }`}
                      >
                        {author}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Function Code Snippet Preview */}
                <div className="p-3 bg-slate-900 rounded-xl text-[11px] text-slate-300 font-mono space-y-1">
                  <div className="text-emerald-400 font-semibold"># cek_indeks_peneliti.py</div>
                  <div className="text-slate-400">author = next(search_author(name))</div>
                  <div className="text-slate-400">profile = scholarly.fill(author)</div>
                  <div className="text-blue-300">print(hindex, i10index, citedby)</div>
                </div>

                {/* Submit button */}
                <button
                  id="btn-search-author"
                  onClick={handleSearchAuthor}
                  disabled={isSearchingAuthor || !authorName.trim()}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium text-xs sm:text-sm shadow-md shadow-blue-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all cursor-pointer mt-auto"
                >
                  {isSearchingAuthor ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Inspecting Academic Metrics...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Cek Indeks Peneliti</span>
                    </>
                  )}
                </button>
              </div>

              {/* Right Column: Author Metrics & Top Publications */}
              <div className="flex-1 p-4 sm:p-6 flex flex-col overflow-y-auto bg-white">
                {authorProfile ? (
                  <div className="space-y-5 flex-1 flex flex-col">
                    {/* Author Header Card */}
                    <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50/50 to-white border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-blue-200 flex-shrink-0">
                          {authorProfile.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-slate-900">{authorProfile.name}</h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Verified Scholar
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>{authorProfile.affiliation}</span>
                          </p>
                          {authorProfile.interests && authorProfile.interests.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {authorProfile.interests.map((int, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 text-[10px] font-medium"
                                >
                                  {int}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {authorProfile.profileUrl && (
                        <a
                          href={authorProfile.profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors"
                        >
                          <span>Google Scholar Profile</span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                        </a>
                      )}
                    </div>

                    {/* Metric Badges Grid (Total Sitasi, h-index, i10-index) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm shadow-blue-200">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            Total Sitasi
                          </div>
                          <div className="text-lg font-extrabold text-blue-950">
                            {authorProfile.citedby.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm shadow-indigo-200">
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            h-index
                          </div>
                          <div className="text-lg font-extrabold text-indigo-950">
                            {authorProfile.hindex}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/40 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm shadow-purple-200">
                          <Hash className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            i10-index
                          </div>
                          <div className="text-lg font-extrabold text-purple-950">
                            {authorProfile.i10index}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Top 3 Publications Section */}
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                          <span>3 Publikasi Teratas</span>
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          Berdasarkan volume sitasi tertinggi
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {authorProfile.publications.slice(0, 3).map((pub, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 bg-white shadow-2xs hover:shadow-xs transition-all flex items-start justify-between gap-3"
                          >
                            <div className="flex items-start gap-2.5">
                              <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center flex-shrink-0 border border-blue-100 mt-0.5">
                                {idx + 1}
                              </span>
                              <div>
                                <h5 className="text-xs sm:text-sm font-bold text-slate-800 leading-snug">
                                  {pub.title}
                                </h5>
                                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                                  {pub.venue && (
                                    <span className="flex items-center gap-1 text-slate-600">
                                      <Building2 className="w-3 h-3 text-slate-400" />
                                      {pub.venue}
                                    </span>
                                  )}
                                  {pub.year && (
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3 text-slate-400" />
                                      {pub.year}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              {pub.citations !== undefined && (
                                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold flex items-center gap-1">
                                  <Quote className="w-3 h-3 text-amber-600" />
                                  {pub.citations.toLocaleString()} Sitasi
                                </span>
                              )}
                              {pub.url && (
                                <a
                                  href={pub.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 text-[10px] font-medium flex items-center gap-1 hover:underline"
                                >
                                  <span>Lihat Paper</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Journal Import Integration */}
                    {onInsertIntoJournal && (
                      <div className="pt-2 border-t border-slate-100 flex justify-end">
                        <button
                          onClick={() => {
                            const topPubsText = authorProfile.publications
                              .slice(0, 3)
                              .map((p, i) => `${i + 1}. **${p.title}** (${p.year || 'N/A'}) - *${p.citations || 0} sitasi*`)
                              .join('\n');
                            onInsertIntoJournal(
                              `Scholar Profile: ${authorProfile.name}`,
                              `# Google Scholar Profile: ${authorProfile.name}\n\n**Afiliasi**: ${authorProfile.affiliation}\n**Total Sitasi**: ${authorProfile.citedby.toLocaleString()}\n**h-index**: ${authorProfile.hindex}\n**i10-index**: ${authorProfile.i10index}\n\n### 3 Publikasi Teratas:\n${topPubsText}\n\n*Catatan & Sintesis Riset:*`
                            );
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                          <span>Simpan Ringkasan Profil ke Jurnal</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : hasSearchedAuthor && !isSearchingAuthor ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
                    <UserCheck className="w-10 h-10 text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-slate-600">Profil peneliti tidak ditemukan.</p>
                    <p className="text-xs text-slate-400">Pastikan nama akademisi ditulis dengan benar.</p>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-3">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-700 mb-1">Cek Indeks Akademik Peneliti</h3>
                    <p className="text-xs text-slate-500 max-w-sm mb-4">
                      Ekstraksi metrik sitasi akademisi dari Google Scholar: Afiliasi, Total Sitasi, h-index, i10-index, dan 3 publikasi teratas.
                    </p>
                    <button
                      onClick={handleSearchAuthor}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium shadow-sm transition-colors cursor-pointer"
                    >
                      Cek Profil "{authorName}"
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB 2: Paper Index Search */}
          {selectedTab === 'search' && (
            <>
              {/* Left Column: Search & Filters */}
              <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-slate-200 p-4 sm:p-5 flex flex-col gap-4 bg-slate-50/50 overflow-y-auto">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Research Keyword / Topic
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchArticles()}
                      placeholder="e.g., deep learning blockchain..."
                      className="w-full text-xs sm:text-sm pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                {/* Limit selector */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1.5">
                    Number of Results (Limit)
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[3, 5, 10, 15].map((num) => (
                      <button
                        key={num}
                        onClick={() => setLimit(num)}
                        className={`py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                          limit === num
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        {num} items
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preset Suggestions */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1.5">
                    Suggested Academic Queries
                  </label>
                  <div className="space-y-1.5">
                    {PRESET_TOPICS.map((topic, idx) => (
                      <button
                        key={idx}
                        onClick={() => setKeyword(topic)}
                        className="w-full text-left text-[11px] p-2 rounded-lg bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-slate-700 transition-all line-clamp-1 cursor-pointer"
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit button */}
                <button
                  onClick={handleSearchArticles}
                  disabled={isSearchingArticles || !keyword.trim()}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium text-xs sm:text-sm shadow-md shadow-blue-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all cursor-pointer mt-auto"
                >
                  {isSearchingArticles ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Indexing Publications...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Search Google Scholar</span>
                    </>
                  )}
                </button>
              </div>

              {/* Right Column: Indexed Articles & CSV Table */}
              <div className="flex-1 p-4 sm:p-6 flex flex-col overflow-y-auto bg-white">
                {articles.length > 0 ? (
                  <div className="flex-1 flex flex-col space-y-4">
                    {/* Action Bar / CSV Export */}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-xl border bg-slate-50 border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span className="text-xs font-bold text-slate-800">
                          Found {articles.length} Peer-Reviewed Articles for "{keyword}"
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCopyCsv}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Copy CSV to clipboard"
                        >
                          {copiedCsv ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedCsv ? 'CSV Copied' : 'Copy CSV'}</span>
                        </button>

                        <button
                          onClick={handleDownloadCsv}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                          title="Download hasil_indeks_scholar.csv"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download CSV</span>
                        </button>
                      </div>
                    </div>

                    {/* Article Cards */}
                    <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                      {articles.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 bg-white shadow-xs hover:shadow-sm transition-all flex flex-col gap-2"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5">
                              <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center flex-shrink-0 border border-blue-100">
                                {idx + 1}
                              </span>
                              <div>
                                <h4 className="text-sm font-bold text-slate-900 leading-snug">
                                  {item.title}
                                </h4>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                                  <div className="flex items-center gap-1">
                                    <Users className="w-3 h-3 text-slate-400" />
                                    <span>{item.authors.join(', ')}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-slate-400" />
                                    <span>{item.pubYear}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Building2 className="w-3 h-3 text-slate-400" />
                                    <span>{item.venue}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold flex items-center gap-1">
                                <Quote className="w-3 h-3 text-amber-600" />
                                {item.citations} Citations
                              </span>
                              {item.url && item.url !== 'Tidak ada link' && (
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 text-[11px] font-medium flex items-center gap-1 hover:underline"
                                >
                                  <span>View Paper</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>

                          {item.snippet && (
                            <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                              {item.snippet}
                            </p>
                          )}

                          {onInsertIntoJournal && (
                            <div className="flex justify-end pt-1">
                              <button
                                onClick={() => {
                                  onInsertIntoJournal(
                                    `Literature: ${item.title.slice(0, 45)}...`,
                                    `# ${item.title}\n\n**Authors**: ${item.authors.join(', ')} (${item.pubYear})\n**Venue**: ${item.venue}\n**Citations**: ${item.citations}\n**DOI/URL**: ${item.url}\n\n### Abstract & Reflection\n${item.snippet || ''}\n\n*Key takeaways and integration with current project:*`
                                  );
                                  onClose();
                                }}
                                className="text-[11px] text-blue-700 hover:text-blue-900 font-medium flex items-center gap-1 hover:underline cursor-pointer"
                              >
                                <BookOpen className="w-3 h-3" />
                                <span>Reflect on this paper in journal</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : hasSearchedArticles && !isSearchingArticles ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
                    <BookOpen className="w-10 h-10 text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-slate-600">No matching scientific publications found.</p>
                    <p className="text-xs text-slate-400">Try adjusting your keyword query.</p>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-3">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-700 mb-1">Search Google Scholar Literature</h3>
                    <p className="text-xs text-slate-500 max-w-sm mb-4">
                      Query peer-reviewed publications, extract bibliographic metadata (authors, citations, year, venue), and export as pandas CSV.
                    </p>
                    <button
                      onClick={handleSearchArticles}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium shadow-sm transition-colors cursor-pointer"
                    >
                      Search "{keyword}"
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB 3: Python Script Code View */}
          {selectedTab === 'code' && (
            <div className="flex-1 p-6 overflow-y-auto bg-slate-950 text-slate-100 font-mono text-xs flex flex-col">
              {/* Script selector bar */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                  </div>
                  <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-800 font-sans text-xs">
                    <button
                      onClick={() => setSelectedScript('author')}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        selectedScript === 'author'
                          ? 'bg-blue-600 text-white font-medium'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      cek_indeks_peneliti.py
                    </button>
                    <button
                      onClick={() => setSelectedScript('papers')}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        selectedScript === 'papers'
                          ? 'bg-blue-600 text-white font-medium'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      cari_karya_ilmiah.py
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const code = selectedScript === 'author' ? pythonAuthorCode : pythonPapersCode;
                    navigator.clipboard.writeText(code);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied to clipboard' : 'Copy Python Code'}</span>
                </button>
              </div>

              <pre className="flex-1 text-slate-300 leading-relaxed overflow-x-auto selection:bg-blue-900 selection:text-blue-200">
                {selectedScript === 'author' ? pythonAuthorCode : pythonPapersCode}
              </pre>

              <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-800 font-sans text-xs text-slate-400 space-y-2">
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  Execution Instructions & Dependencies:
                </div>
                <p className="text-slate-300 font-mono bg-slate-950 p-2 rounded border border-slate-800">
                  pip install scholarly pandas
                </p>
                <p className="text-slate-400">
                  Run in terminal: <code className="text-blue-400 font-mono">python {selectedScript === 'author' ? 'cek_indeks_peneliti.py' : 'cari_karya_ilmiah.py'}</code>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
