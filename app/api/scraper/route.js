import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

// Set batas waktu ke 60 detik biar Vercel nggak buru-buru matiin prosesnya
export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { urls } = await request.json();
    
    if (!urls || !Array.isArray(urls)) {
      return Response.json({ success: false, pesan: "Format URL tidak valid. Harus array." }, { status: 400 });
    }

    // Setup browser khusus lingkungan Vercel Serverless
    const executablePath = await chromium.executablePath();
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const scrapePromises = urls.map(async (url) => {
      const urlTarget = url.trim();
      if (!urlTarget) return null;

      const page = await browser.newPage();
      // Nyamar jadi HP
      await page.setUserAgent('Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36');

      let videoLink = null;
      let platformDitemukan = urlTarget.includes('facebook.com') || urlTarget.includes('fb.watch') ? 'Facebook' 
                            : urlTarget.includes('tiktok.com') ? 'TikTok'
                            : urlTarget.includes('instagram.com') ? 'Instagram' : 'Web Umum';

      try {
        // Taktik andalan: Cegat langsung file video dari jaringan (network)
        page.on('response', async (response) => {
          const resUrl = response.url();
          const type = response.headers()['content-type'] || '';
          
          if (resUrl.includes('.mp4') || type.includes('video/mp4')) {
            videoLink = resUrl;
          }
        });

        // Tunggu sampai halaman web beres loading
        await page.goto(urlTarget, { waitUntil: 'networkidle2', timeout: 20000 });

        // Kalau jaringan lambat dan gagal dicegat, cari manual di tag HTML
        if (!videoLink) {
          videoLink = await page.evaluate(() => {
            const videoElement = document.querySelector('video');
            if (videoElement && videoElement.src && !videoElement.src.startsWith('blob:')) {
              return videoElement.src;
            }
            return null;
          });
        }

        await page.close();

        if (videoLink) {
          return { url_asli: urlTarget, platform: platformDitemukan, status: 'sukses', video_url: videoLink };
        } else {
          return { url_asli: urlTarget, platform: platformDitemukan, status: 'gagal', pesan: 'Sistem anti-bot masih memblokir atau video butuh login.' };
        }

      } catch (err) {
        await page.close();
        return { url_asli: urlTarget, status: 'error', pesan: err.message };
      }
    });

    const hasilRaw = await Promise.all(scrapePromises);
    await browser.close(); 
    
    const hasilAkhir = hasilRaw.filter(item => item !== null);
    return Response.json({ success: true, data: hasilAkhir });

  } catch (error) {
    return Response.json({ success: false, pesan: "Terjadi kesalahan server", error: error.message }, { status: 500 });
  }
}
