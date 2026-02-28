import Generator from "@/components/generator";
import { Music2 } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white selection:bg-yellow-500 selection:text-black">
      {/* Background patterns */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-green-600 blur-[120px] rounded-full" />
        <div className="absolute top-[30%] left-[60%] w-[30%] h-[30%] bg-yellow-600 blur-[120px] rounded-full opacity-50" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 flex flex-col items-center">
        {/* Header */}
        <header className="text-center space-y-6 mb-16">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-yellow-500 font-bold text-sm tracking-widest uppercase">
            <Music2 className="h-4 w-4" />
            Sindicato de la Danza Chile
          </div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-[0.8] max-w-4xl mx-auto">
            Crea el próximo <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-red-500 to-green-500">
              Himno Urbano
            </span>
          </h1>

          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto font-medium">
            Letras y melodias sugeridas para Hip Hop y Reggae.
            Directo desde el asfalto para la posteridad.
          </p>
        </header>

        {/* Generator Component */}
        <Generator />

        {/* Footer */}
        <footer className="mt-32 pt-12 border-t border-zinc-900 w-full text-center">
          <p className="text-zinc-600 text-sm font-bold uppercase tracking-widest">
            © 2026 Sindicato de la Danza - El Sonido de la Calle
          </p>
        </footer>
      </div>
    </main>
  );
}
