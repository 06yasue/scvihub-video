import puppeteer from 'puppeteer';

export async function POST(request) {
  try {
    const { urls } = await request.json();
    
    if (!urls || !Array.isArray(urls)) {
      return Response.json({ success: false, pesan: "Format URL tidak valid. Harus array." }, { status: 400 });
    }

    // Buka browser di background. Cukup 1 browser untuk semua URL biar server lu nggak jebol.
    const browser = await puppeteer.launch({
      headless: true, // Jangan tampilkan UI browser
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
    });

    const scrapePromises = urls.map(async (url) => {
      const urlTarget = url.trim();
      if (!urlTarget) return null;

      // Buka tab baru untuk setiap URL
      const page = await browser.newPage();
      
      // Nyamar jadi HP Android murni biar dapet tampilan mobile yang lebih ringan
      await page.setUserAgent('Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36');

      let videoLink = null;
      let platformDitemukan = urlTarget.includes('facebook.com') || urlTarget.includes('fb.watch') ? 'Facebook' 
                            : urlTarget.includes('tiktok.com') ? 'TikTok'
                            : urlTarget.includes('instagram.com') ? 'Instagram' : 'Web Umum';

      try {
        // STRATEGI UTAMA: Cegat langsung file video dari network browser
        // Ini jauh lebih akurat daripada nyari lewat Regex di HTML
        page.on('response', async (response) => {
          const resUrl = response.url();
          const type = response.headers()['content-type'] || '';
          
          // Kalau sistem jaringan mendeteksi aliran file video (mp4) dari server FB/Tiktok
          if (resUrl.includes('.mp4') || type.includes('video/mp4')) {
            videoLink = resUrl;
          }
        });

        // Kunjungi link target, tunggu sampai jaringan selesai loading (networkidle2)
        await page.goto(urlTarget, { waitUntil: 'networkidle2', timeout: 20000 });

        // Kalau jaringan lambat dan belum dapet juga, kita coba paksa ambil dari elemen HTML 
        if (!videoLink) {
          videoLink = await page.evaluate(() => {
            const videoElement = document.querySelector('video');
            if (videoElement && videoElement.src && !videoElement.src.startsWith('blob:')) {
              return videoElement.src;
            }
            return null;
          });
        }

        await page.close(); // Tutup tab

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
            pesan: 'Video terkunci/membutuhkan login atau gagal dicegat.' 
          };
        }

      } catch (err) {
        await page.close();
        return { url_asli: urlTarget, status: 'error', pesan: err.message };
      }
    });

    const hasilRaw = await Promise.all(scrapePromises);
    await browser.close(); // Matikan browser sepenuhnya
    
    const hasilAkhir = hasilRaw.filter(item => item !== null);

    return Response.json({ success: true, data: hasilAkhir });

  } catch (error) {
    return Response.json({ success: false, pesan: "Terjadi kesalahan server", error: error.message }, { status: 500 });
  }
}
