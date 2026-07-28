import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      <h1 style={{ fontSize: '48px', color: '#ff4444', margin: '0 0 10px 0' }}>404</h1>
      <h2>Waduh, Salah Kamar!</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>Halaman yang kamu cari tidak ditemukan.</p>
      <Link href="/">
        <button style={{ padding: '10px 20px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Kembali ke Beranda
        </button>
      </Link>
    </div>
  )
}
