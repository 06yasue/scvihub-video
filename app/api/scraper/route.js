export async function POST(request) {
  try {
    const { urls } = await request.json();
    
    if (!urls || !Array.isArray(urls)) {
      return Response.json({ success: false, pesan: "Format URL tidak valid" }, { status: 400 });
    }

    const scrapePromises = urls.map(async (url) => {
      try {
        const urlTarget = url.trim();
        if (!urlTarget) return null;

        // Header penyamaran tingkat lanjut agar dikira browser manusia
        const response = await fetch(urlTarget, {
          headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        const html = await response.text();
        let videoLink = null;
        let platformDitemukan = "Web Umum";

        // ==========================================
        // 1. STRATEGI: FACEBOOK / FB.WATCH
        // ==========================================
        if (urlTarget.includes('facebook.com') || urlTarget.includes('fb.watch')) {
          platformDitemukan = "Facebook";
          const regexFbHd = /"playable_url_quality_hd":"([^"]+)"/i;
          const regexFbSd = /"playable_url":"([^"]+)"/i;
          let match = html.match(regexFbHd) || html.match(regexFbSd);
          if (match && match[1]) {
            videoLink = match[1].replace(/\\\//g, '/').replace(/\\u0025/g, '%');
          }
        } 

        // ==========================================
        // 2. STRATEGI: TIKTOK
        // ==========================================
        else if (urlTarget.includes('tiktok.com')) {
          platformDitemukan = "TikTok";
          // TikTok sering menaruh direct playAddr di dalam JSON state
          const regexTiktok = /"playAddr":"([^"]+)"/i;
          let match = html.match(regexTiktok);
          if (match && match[1]) {
            videoLink = match[1].replace(/\\\//g, '/');
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
            videoLink = match[1].replace(/\\\//g, '/');
          }
        }

        // ==========================================
        // 4. STRATEGI: TWITTER / X
        // ==========================================
        else if (urlTarget.includes('twitter.com') || urlTarget.includes('x.com')) {
          platformDitemukan = "Twitter/X";
          const regexTwitter = /"url":"([^"]+\.mp4[^"]*)"/i;
          let match = html.match(regexTwitter);
          if (match && match[1]) {
            videoLink = match[1].replace(/\\\//g, '/');
          }
        }

        // ==========================================
        // 5. STRATEGI UMUM (Fallback untuk web video / blog biasa)
        // ==========================================
        if (!videoLink) {
          // Cari tag Open Graph video
          const regexOgVideo = /<meta\s+property="og:video"\s+content="([^"]+)"/i;
          const matchOg = html.match(regexOgVideo);
          
          if (matchOg && matchOg[1]) {
            videoLink = matchOg[1].replace(/&amp;/g, '&');
          } else {
            // Cari link berakhiran .mp4 atau .m3u8 secara bebas di halaman
            const regexGeneralMp4 = /(https?:\/\/[^\s"'<>]+\.(?:mp4|m3u8)[^\s"'<>]*)/i;
            const matchGeneral = html.match(regexGeneralMp4);
            if (matchGeneral && matchGeneral[1]) {
              videoLink = matchGeneral[1];
            }
          }
        }

        // Hasil akhir per URL
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
            pesan: 'Link video terkunci sistem keamanan platform.' 
          };
        }

      } catch (err) {
        return { url_asli: url, status: 'error', pesan: err.message };
      }
    });

    const hasil = await Promise.all(scrapePromises);
    return Response.json({ success: true, data: hasil });

  } catch (error) {
    return Response.json({ success: false, pesan: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
