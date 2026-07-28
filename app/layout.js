export const metadata = {
  title: 'Multi Video Downloader',
  description: 'Scraper buatan sendiri tanpa API pihak ketiga',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: 0, backgroundColor: '#f9f9f9', color: '#333' }}>
        <main style={{ maxWidth: '600px', margin: '40px auto', padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
