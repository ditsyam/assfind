from scholarly import scholarly
import pandas as pd

def cari_karya_ilmiah(keyword, jumlah_hasil=5):
    print(f"Mencari artikel dengan kata kunci: '{keyword}'...\n")
    
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
            print(f"    Disitasi oleh: {info['Jumlah Sitasi']} artikel\n")
            
        except StopIteration:
            print("Sudah menampilkan semua hasil yang ditemukan.")
            break
            
    # 3. Menyimpan ke CSV DataFrame
    df = pd.DataFrame(data_artikel)
    output_filename = "hasil_indeks_scholar.csv"
    df.to_csv(output_filename, index=False)
    print(f"✅ Data berhasil disimpan ke '{output_filename}' ({len(data_artikel)} baris).")

if __name__ == "__main__":
    # Menjalankan pencarian untuk topik "deep learning blockchain"
    cari_karya_ilmiah("deep learning blockchain", jumlah_hasil=5)
