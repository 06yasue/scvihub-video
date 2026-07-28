export async function POST(request) {
  try {
    const { urls } = await request.json();
    
    const scrapePromises = urls.map(async (url) => {
      try {
        const urlTarget = url.trim();
        
        // Menyamar sebagai browser PC asli
        const response = await fetch(urlTarget, {
          headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
          }
        });
        
        const html = await response.text();
        let videoLink = null;

        // ==========================================
        // 1. TRIK KHUSUS FACEBOOK
        // ==========================================
        if (urlTarget.includes('facebook.com') || urlTarget.includes('fb.watch')) {
          // Facebook menyembunyikan video HD di key "playable_url_quality_hd" 
          // dan video SD di "playable_url"
          const regexFbHd = /"playable_url_quality_hd":"([^"]+)"/i;
          const regexFbSd = /"playable_url":"([^"]+)"/i;
          
          let fbMatch = html.match(regexFbHd) || html.match(regexFbSd);
          
          if (fbMatch && fbMatch[1]) {
            // Bersihkan karakter unicode facebook (mengubah \/ kembali menjadi /)
            videoLink = fbMatch[1].replace(/\\\//g, '/').replace(/\\u0025/g, '%');
          }
        } 
        // ==========================================
        // 2. TRIK UMUM (Website Biasa)
        // ==========================================
        else {
          const regexVideoBiasa = /(https?:\/\/[^\s"'<>]+\.mp4)/i;
          const matchBiasa = html.match(regexVideoBiasa);
          if (matchBiasa) videoLink = matchBiasa[1];
        }

        // ==========================================
        // KEMBALIKAN HASIL
        // ==========================================
        if (videoLink) {
          return { url_asli: urlTarget, status: 'sukses', video_url: videoLink };
        } else {
          return { url_asli: urlTarget, status: 'gagal', pesan: 'Sistem web terlalu kuat, video gagal dibongkar' };
        }

      } catch (err) {
        return { url_asli: url, status: 'error', pesan: err.message };
      }
    });

    const hasil = await Promise.all(scrapePromises);
    return Response.json({ success: true, data: hasil });

  } catch (error) {
    return Response.json({ success: false, pesan: "Server Error" }, { status: 500 });
  }
}
