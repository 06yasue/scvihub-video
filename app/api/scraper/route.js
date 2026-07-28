export async function POST(request) {
  try {
    const { urls } = await request.json();
    
    // Proses semua link sekaligus (Multi-video)
    const scrapePromises = urls.map(async (url) => {
      try {
        // Fetch web target (menyamar sebagai browser HP/PC)
        const response = await fetch(url.trim(), {
          headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' 
          }
        });
        
        const html = await response.text();

        // Cari pola teks link berakhiran .mp4 di dalam kode HTML
        const regexVideo = /(https?:\/\/[^\s"'<>]+\.mp4)/i;
        const match = html.match(regexVideo);

        if (match && match[1]) {
          return { url_asli: url, status: 'sukses', video_url: match[1] };
        } else {
          return { url_asli: url, status: 'gagal', pesan: 'URL mp4 disembunyikan / butuh trik khusus' };
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
