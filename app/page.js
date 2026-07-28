"use client"; // Wajib untuk frontend interaktif

import { useState } from 'react';

export default function Home() {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const handleScrape = async () => {
    if (!inputText.trim()) return alert('Masukkan link dulu!');
    
    // Pisahkan teks berdasarkan baris baru (Enter) jadi array
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
      }
    } catch (error) {
      alert('Gagal menghubungi server');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 style={{ textAlign: 'center' }}>Scraper Multi-Video</h1>
      <p style={{ textAlign: 'center', fontSize: '14px', color: '#666' }}>Masukkan URL video (1 link per baris)</p>
      
      <textarea 
        rows="6" 
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="https://contoh.com/video1&#10;https://contoh.com/video2"
        style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '5px', border: '1px solid #ccc', marginBottom: '15px' }}
      />
      
      <button 
        onClick={handleScrape} 
        disabled={loading}
        style={{ width: '100%', padding: '12px', backgroundColor: loading ? '#ccc' : '#000', color: '#fff', border: 'none', borderRadius: '5px', cursor: loading ? 'not-allowed' : 'pointer' }}
      >
        {loading ? 'Sedang Mencari Video...' : 'Mulai Scrape!'}
      </button>

      {/* Tampilkan Hasil */}
      <div style={{ marginTop: '30px' }}>
        {results.map((item, index) => (
          <div key={index} style={{ padding: '15px', border: '1px solid #eee', marginBottom: '10px', borderRadius: '5px' }}>
            <p style={{ margin: '0 0 5px 0', fontSize: '12px', wordBreak: 'break-all' }}>Target: {item.url_asli}</p>
            
            {item.status === 'sukses' ? (
              <a href={item.video_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '8px 15px', backgroundColor: '#28a745', color: '#fff', textDecoration: 'none', borderRadius: '4px', fontSize: '14px' }}>
                Buka / Download Video
              </a>
            ) : (
              <p style={{ color: 'red', margin: 0, fontSize: '14px' }}>{item.pesan}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
