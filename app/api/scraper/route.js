export async function POST(request) {
  try {
    const body = await request.json();
    const urls = body.urls;
    
    if (!urls || !Array.isArray(urls)) {
      return Response.json({ success: false, pesan: "Format URL tidak valid. Harus berupa array [\"url1\", \"url2\"]." }, { status: 400 });
    }

    const scrapePromises = urls.map(async (url) => {
      try {
        const urlTarget = url.trim();
        if (!urlTarget) return null;

        // TRIK 1: Gunakan Mobile User-Agent. 
        // FB dan IG sering memberikan HTML versi ringan (tanpa enkripsi JS berat) ke perangkat mobile lawas.
        const headers = { 
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
          'Sec-Fetch-Mode': 'navigate',
          'Upgrade-Insecure-Requests': '1',
          'Cache-Control': 'no-cache'
        };
        
        // TRIK 2: Wajib aktifkan follow redirect untuk link seperti fb.watch / vt.tiktok.com
        const response = await fetch(urlTarget, { 
            headers, 
            redirect: 'follow',
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error(`Akses ditolak server (HTTP ${response.status})`);
        }
        
        const html = await response.text();
        let videoLink = null;
        let platformDitemukan = "Web Umum";

        // ==========================================
        // 1. STRATEGI: FACEBOOK / FB.WATCH
        // ==========================================
        if (urlTarget.includes('facebook.com') || urlTarget.includes('fb.watch') || urlTarget.includes('fb.gg')) {
          platformDitemukan = "Facebook";
          // Tambahkan regex untuk browser_native_hd_url yang sering muncul di versi mobile
          const regexFbHd = /"browser_native_hd_url":"([^"]+)"/i;
          const regexFbSd = /"browser_native_sd_url":"([^"]+)"/i;
          const regexPlayableHd = /"playable_url_quality_hd":"([^"]+)"/i;
          const regexPlayableSd = /"playable_url":"([^"]+)"/i;
          
          let match = html.match(regexFbHd) || html.match(regexPlayableHd) || html.match(regexFbSd) || html.match(regexPlayableSd);
          if (match && match[1]) {
            // Bersihkan unicode dan escape slashes
            videoLink = match[1].replace(/\\\//g, '/').replace(/\\u0025/g, '%').replace(/\\u0026/g, '&');
          }
        } 

        // ==========================================
        // 2. STRATEGI: TIKTOK
        // ==========================================
        else if (urlTarget.includes('tiktok.com')) {
          platformDitemukan = "TikTok";
          const regexTiktok = /"playAddr":"([^"]+)"/i;
          const regexTiktok2 = /"downloadAddr":"([^"]+)"/i;
          let match = html.match(regexTiktok) || html.match(regexTiktok2);
          if (match && match[1]) {
            videoLink = match[1].replace(/\\\//g, '/').replace(/\\u0026/g, '&');
          }
        }

        // ==========================================
        // 3. STRATEGI: INSTAGRAM / REELS
        // ==========================================
        else if (urlTarget.includes('instagram.com')) {
          platformDitemukan = "Instagram";
          const regexIg = /"video_url":"([^"]+)"/i;
          let match = html.match(regexIg);
          if (match && match[1]) {
            videoLink = match[1].replace(/\\\//g, '/').replace(/\\u0026/g, '&');
          }
        }

        // ==========================================
        // 4. STRATEGI: TWITTER / X
        // ==========================================
        else if (urlTarget.includes('twitter.com') || urlTarget.includes('x.com')) {
          platformDitemukan = "Twitter/X";
          // Coba tangkap link langsung video twimg
          const regexTwitter = /https:\/\/video\.twimg\.com\/(?:ext_tw_video|amplify_video)\/[^"]+\.mp4/i;
          let match = html.match(regexTwitter);
          if (match && match[0]) {
            videoLink = match[0].replace(/\\\//g, '/');
          }
        }

        // ==========================================
        // 5. STRATEGI UMUM & FALLBACK META TAG
        // ==========================================
        if (!videoLink) {
          // Cari og:video atau og:video:secure_url
          const regexOgVideo = /<meta\s+(?:property|name)="og:video(?::secure_url)?"\s+content="([^"]+)"/i;
          const matchOg = html.match(regexOgVideo);
          
          if (matchOg && matchOg[1]) {
            videoLink = matchOg[1].replace(/&amp;/g, '&');
          } else {
            const regexGeneralMp4 = /(https?:\/\/[^\s"'<>]+\.(?:mp4|m3u8)[^\s"'<>]*)/i;
            const matchGeneral = html.match(regexGeneralMp4);
            if (matchGeneral && matchGeneral[1]) {
              videoLink = matchGeneral[1];
            }
          }
        }

        // ==========================================
        // HASIL AKHIR PER URL
        // ==========================================
        if (videoLink) {
          return { 
            url_asli: urlTarget, 
            platform: platformDitemukan,
            status: 'sukses', 
            video_url: videoLink 
          };
        } else {
          return { 
            url_asli: urlTarget, 
            platform: platformDitemukan,
            status: 'gagal', 
            pesan: 'Link video disembunyikan oleh sistem keamanan platform. Butuh API khusus.' 
          };
        }

      } catch (err) {
        return { url_asli: url, status: 'error', pesan: err.message };
      }
    });

    // Jalankan semua URL secara paralel dan buang hasil yang null (jika ada url kosong)
    const hasilRaw = await Promise.all(scrapePromises);
    const hasilAkhir = hasilRaw.filter(item => item !== null);

    return Response.json({ success: true, data: hasilAkhir });

  } catch (error) {
    return Response.json({ success: false, pesan: "Terjadi kesalahan pada server", error: error.message }, { status: 500 });
  }
}
