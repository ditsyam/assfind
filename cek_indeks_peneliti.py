from scholarly import scholarly

def cek_indeks_peneliti(nama_peneliti):
    print(f"Mencari profil: {nama_peneliti}...")
    
    # Cari penulis berdasarkan nama
    search_query = scholarly.search_author(nama_peneliti)
    
    try:
        # Ambil hasil pertama yang paling cocok
        author = next(search_query)
        
        # Isi data profil secara lengkap (termasuk isi sitasi dan indeks)
        full_author_profile = scholarly.fill(author)
        
        print("\n=== DATA PROFIL GOOGLE SCHOLAR ===")
        print(f"Nama       : {full_author_profile['name']}")
        print(f"Afiliasi   : {full_author_profile.get('affiliation', 'Tidak ada')}")
        print(f"Total Sitasi: {full_author_profile.get('citedby', 0)}")
        print(f"h-index    : {full_author_profile.get('hindex', 0)}")
        print(f"i10-index  : {full_author_profile.get('i10index', 0)}")
        
        print("\n=== 3 PUBLIKASI TERATAS ===")
        for i, pub in enumerate(full_author_profile['publications'][:3]):
            judul = pub['bib'].get('title', 'No Title')
            print(f"{i+1}. {judul}")
            
    except StopIteration:
        print("Profil peneliti tidak ditemukan.")

if __name__ == "__main__":
    # Jalankan fungsi untuk cek profil akademisi
    cek_indeks_peneliti("Andrew Ng")
