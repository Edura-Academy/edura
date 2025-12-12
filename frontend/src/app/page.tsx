export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <main className="flex min-h-screen flex-col items-center justify-center px-6">
        {/* Logo / Title */}
        <div className="text-center">
          <h1 className="text-6xl font-bold text-white mb-4 tracking-tight">
            Edura
            <span className="text-purple-400"> Programı</span>
          </h1>
          <p className="text-xl text-gray-300 mb-12">
            Kurs Takip ve Yönetim Sistemi
          </p>
        </div>

        {/* Sahipleri */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-12 border border-white/20">
          <h2 className="text-2xl font-semibold text-white text-center mb-6">
            Sahipleri
          </h2>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <div className="flex items-center gap-3 bg-white/5 rounded-xl px-6 py-4">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                A
              </div>
              <span className="text-white text-lg font-medium">Abdurrahman</span>
            </div>
            <div className="flex items-center gap-3 bg-white/5 rounded-xl px-6 py-4">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                H
              </div>
              <span className="text-white text-lg font-medium">Hasan</span>
            </div>
            <div className="flex items-center gap-3 bg-white/5 rounded-xl px-6 py-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                F
              </div>
              <span className="text-white text-lg font-medium">Ferhat</span>
            </div>
          </div>
        </div>

        {/* Özellikler */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl">
          <div className="bg-white/5 rounded-xl p-6 text-center border border-white/10 hover:border-purple-500/50 transition-colors">
            <div className="text-4xl mb-3">📚</div>
            <h3 className="text-white font-semibold mb-2">Kurs Yönetimi</h3>
            <p className="text-gray-400 text-sm">Kursları kolayca oluştur ve yönet</p>
          </div>
          <div className="bg-white/5 rounded-xl p-6 text-center border border-white/10 hover:border-purple-500/50 transition-colors">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-white font-semibold mb-2">İlerleme Takibi</h3>
            <p className="text-gray-400 text-sm">Öğrenci ilerlemelerini takip et</p>
          </div>
          <div className="bg-white/5 rounded-xl p-6 text-center border border-white/10 hover:border-purple-500/50 transition-colors">
            <div className="text-4xl mb-3">🎓</div>
            <h3 className="text-white font-semibold mb-2">Sertifikalar</h3>
            <p className="text-gray-400 text-sm">Başarılı öğrencilere sertifika ver</p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-gray-500 text-sm">
          © 2025 Edura Academy. Tüm hakları saklıdır.
        </footer>
      </main>
    </div>
  );
}
<button>
  <button className="bg-purple-500 text-white px-4 py-2 rounded-md">
    Merhaba
  </button>
</button>