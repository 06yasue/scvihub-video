import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { urls } = await request.json();
    if (!urls || !Array.isArray(urls)) return Response.json({ success: false, pesan: "Format array invalid." }, { status: 400 });

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
      await page.setUserAgent('Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36');

      let videoLink = null;
      let platformDitemukan = urlTarget.includes('facebook.com') || urlTarget.includes('fb.watch') ? 'Facebook' 
                            : urlTarget.includes('tiktok.com') ? 'TikTok'
                            : urlTarget.includes('instagram.com') ? 'Instagram' : 'Web Umum';

      try {
        page.on('response', async (response) => {
          const resUrl = response.url();
          const type = response.headers()['content-type'] || '';
          if (resUrl.includes('.mp4') || type.includes('video/mp4')) {
            videoLink = resUrl;
          }
        });

        await page.goto(urlTarget, { waitUntil: 'networkidle2', timeout: 20000 });

        // INI YANG BARU: Ambil Data Judul dan Thumbnail
        const metaData = await page.evaluate(() => {
          const ogTitle = document.querySelector('meta[property="og:title"]')?.content;
          const titleTag = document.querySelector('title')?.innerText;
          const ogImage = document.querySelector('meta[property="og:image"]')?.content;
          
          const vElem = document.querySelector('video');
          const fallbackVid = (vElem && vElem.src && !vElem.src.startsWith('blob:')) ? vElem.src : null;

          return {
            title: ogTitle || titleTag || 'Video dari ' + window.location.hostname,
            thumbnail: ogImage || '',
            fallbackVideo: fallbackVid
          };
        });

        if (!videoLink) videoLink = metaData.fallbackVideo;
        await page.close();

        if (videoLink) {
          return { url_asli: urlTarget, platform: platformDitemukan, status: 'sukses', video_url: videoLink, title: metaData.title, thumbnail: metaData.thumbnail };
        } else {
          return { url_asli: urlTarget, platform: platformDitemukan, status: 'gagal', pesan: 'Sistem memblokir pencarian.' };
        }
      } catch (err) {
        await page.close();
        return { url_asli: urlTarget, status: 'error', pesan: err.message };
      }
    });

    const hasilRaw = await Promise.all(scrapePromises);
    await browser.close(); 
    
    return Response.json({ success: true, data: hasilRaw.filter(item => item !== null) });
  } catch (error) {
    return Response.json({ success: false, pesan: "Error Server" }, { status: 500 });
  }
}
