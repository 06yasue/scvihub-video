"use client";

import { useState } from 'react';

export default function Home() {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const handleScrape = async () => {
    if (!inputText.trim()) return alert('Masukkan link dulu!');
    
    const urls = inputText.split('\n').filter(link => link.trim() !== '');
    
    setLoading(true);
    setResults([]);

    try {
      const res = await fetch('/api/scraper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls })
      });
      
      const responseData = await res.json();
      if (responseData.success) {
        setResults(responseData.data);
      } else {
        alert(responseData.pesan || 'Terjadi kesalahan');
      }
    } catch (error) {
      alert('Gagal menghubungi server');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif', padding: '20px' }}>
      <h1 style={{ textAlign: 'center' }}>Scraper Multi-Video</h1>
      <p style={{ textAlign: 'center', fontSize: '14px', color: '#666' }}>Masukkan URL video (1 link per baris)</p>
      
      <textarea 
        rows="6" 
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="https://facebook.com/...&#10;https://tiktok.com/..."
        style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '15px' }}
      />
      
      <button 
        onClick={handleScrape} 
        disabled={loading}
        style={{ width: '100%', padding: '12px', backgroundColor: loading ? '#ccc' : '#000', color: '#fff', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
      >
        {loading ? 'Sedang Mencari Video (Tunggu bentar)...' : 'Mulai Scrape!'}
      </button>

      {/* Area Hasil */}
      <div style={{ marginTop: '30px' }}>
        {results.map((item, index) => (
          <div key={index} style={{ padding: '15px', border: '1px solid #ddd', marginBottom: '15px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#fafafa' }}>
            
            {item.status !== 'sukses' ? (
              <div>
                <p style={{ margin: '0 0 5px 0', fontSize: '12px', wordBreak: 'break-all', color: '#666' }}>Target: {item.url_asli}</p>
                <p style={{ color: 'red', margin: 0, fontSize: '14px', fontWeight: 'bold' }}>{item.pesan}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                {item.thumbnail && (
                  <img 
                    src={item.thumbnail} 
                    alt="Thumbnail" 
                    style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', backgroundColor: '#eee' }} 
                  />
                )}
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 5px 0', fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: 'bold' }}>{item.platform}</p>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', lineHeight: '1.4' }}>
                    {item.title || 'Video Tanpa Judul'}
                  </h3>
                  <a 
                    href={`/api/download?url=${encodeURIComponent(item.video_url)}`} 
                    download
                    style={{ display: 'inline-block', padding: '8px 15px', backgroundColor: '#28a745', color: '#fff', textDecoration: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold' }}
                  >
                    ⬇ Download Video
                  </a>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
