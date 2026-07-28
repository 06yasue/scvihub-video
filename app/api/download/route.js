export async function GET(request) {
  // Ambil URL video yang dikirim dari tombol download frontend
  const { searchParams } = new URL(request.url);
  const videoUrl = searchParams.get('url');

  if (!videoUrl) {
    return new Response('URL video tidak ditemukan', { status: 400 });
  }

  try {
    // Vercel ngambil videonya dari server FB/Tiktok
    const videoResponse = await fetch(videoUrl);

    if (!videoResponse.ok) {
      throw new Error('Gagal mengambil file sumber');
    }

    // Bikin header khusus supaya browser memaksa ngebuka pop-up "Save File / Download"
    const headers = new Headers(videoResponse.headers);
    headers.set('Content-Disposition', 'attachment; filename="Video-Download-Hasil-Scrape.mp4"');

    // Balikin filenya ke user
    return new Response(videoResponse.body, {
      status: 200,
      headers: headers,
    });
  } catch (error) {
    return new Response('Terjadi kesalahan saat proses download', { status: 500 });
  }
}
