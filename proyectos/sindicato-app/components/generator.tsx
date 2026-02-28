"use client";

import { useState } from "react";
import { Music, Mic2, Send, Loader2, Sparkles, Copy, Check, AlertCircle, Play, Music4, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface GenerationResult {
    lyrics: string;
    melodyPrompt: string;
}

interface AudioResult {
    audioDescription: string;
    audioUrl: string | null;
}

const AVAILABLE_STYLES = ["Hip Hop", "Reggae", "Dancehall"];

export default function Generator() {
    const [topic, setTopic] = useState("");
    const [selectedStyles, setSelectedStyles] = useState<string[]>(["Hip Hop"]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
    const [result, setResult] = useState<GenerationResult | null>(null);
    const [audioResult, setAudioResult] = useState<AudioResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});

    const toggleStyle = (style: string) => {
        setSelectedStyles(prev => {
            if (prev.includes(style)) {
                if (prev.length === 1) return prev;
                return prev.filter(s => s !== style);
            }
            return [...prev, style];
        });
    };

    const handleGenerate = async () => {
        if (!topic || selectedStyles.length === 0) return;
        setIsGenerating(true);
        setResult(null);
        setAudioResult(null);
        setError(null);

        try {
            const response = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    topic,
                    style: selectedStyles.join(" + ")
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Error inesperado");
            if (!data.lyrics || !data.melodyPrompt) throw new Error("Respuesta incompleta");

            setResult(data);
        } catch (err: any) {
            setError(err.message || "Error al conectar con la IA.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateAudio = async () => {
        if (!result?.melodyPrompt) return;
        setIsGeneratingAudio(true);
        setError(null);

        try {
            const response = await fetch("/api/audio", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: result.melodyPrompt }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Error al generar audio");

            setAudioResult(data);
        } catch (err: any) {
            setError(err.message || "Error en Google Labs Audio.");
        } finally {
            setIsGeneratingAudio(false);
        }
    };

    const copyToClipboard = async (text: string, id: string) => {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            setCopiedStates(prev => ({ ...prev, [id]: true }));
            setTimeout(() => setCopiedStates(prev => ({ ...prev, [id]: false })), 2000);
        } catch (err) {
            console.error("Error al copiar:", err);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8 p-4">
            {/* Search / Input Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 shadow-2xl backdrop-blur-sm"
            >
                <div className="flex flex-col gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Concepto / Tema</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Ej: Resistencia, Amor, Calle..."
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all text-zinc-100"
                            />
                            <Sparkles className="absolute right-4 top-3.5 h-5 w-5 text-zinc-600" />
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-end justify-between gap-6">
                        <div className="flex-1 space-y-3">
                            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Mezcla de Estilos</label>
                            <div className="flex flex-wrap gap-2">
                                {AVAILABLE_STYLES.map(style => (
                                    <button
                                        key={style}
                                        onClick={() => toggleStyle(style)}
                                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${selectedStyles.includes(style)
                                            ? 'bg-yellow-500 border-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.3)]'
                                            : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-600'
                                            }`}
                                    >
                                        {style}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || !topic}
                            className="w-full md:w-auto bg-yellow-500 hover:bg-yellow-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-black uppercase py-4 px-10 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 group"
                        >
                            {isGenerating ? (
                                <><Loader2 className="h-5 w-5 animate-spin" /> Fundiendo...</>
                            ) : (
                                <><Send className="h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" /> Crear Letra</>
                            )}
                        </button>
                    </div>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm font-medium"
                    >
                        <AlertCircle className="h-5 w-5 shrink-0" /> {error}
                    </motion.div>
                )}
            </motion.div>

            {/* Results Section */}
            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-8"
                    >
                        {/* Lyrics Area */}
                        <div className="bg-zinc-900 border border-green-900/30 rounded-3xl overflow-hidden flex flex-col shadow-xl">
                            <div className="bg-green-500/10 border-b border-green-500/20 p-4 flex justify-between items-center">
                                <div className="flex items-center gap-2 text-green-400 font-bold uppercase text-xs tracking-tighter">
                                    <Mic2 className="h-4 w-4" /> Letra Sugerida
                                </div>
                                <button
                                    onClick={() => copyToClipboard(result.lyrics, 'lyrics')}
                                    className={`p-2 rounded-lg transition-all ${copiedStates['lyrics'] ? 'bg-green-500 text-black' : 'hover:bg-white/5 text-zinc-400'}`}
                                >
                                    {copiedStates['lyrics'] ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </button>
                            </div>
                            <div className="p-8 flex-1">
                                <pre className="whitespace-pre-wrap font-sans text-xl leading-relaxed text-zinc-200 tracking-tight italic">
                                    {result.lyrics}
                                </pre>
                            </div>
                        </div>

                        {/* Melody / Beat Area */}
                        <div className="bg-zinc-900 border border-red-900/30 rounded-3xl overflow-hidden flex flex-col shadow-xl">
                            <div className="bg-red-500/10 border-b border-red-500/20 p-4 flex justify-between items-center">
                                <div className="flex items-center gap-2 text-red-400 font-bold uppercase text-xs tracking-tighter">
                                    <Music className="h-4 w-4" /> Melody Prompt
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleGenerateAudio}
                                        disabled={isGeneratingAudio}
                                        className="flex items-center gap-2 px-3 py-1 transparent hover:bg-white/5 rounded-lg text-xs font-bold uppercase text-zinc-400 transition-colors"
                                    >
                                        {isGeneratingAudio ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                                        Audio Labs
                                    </button>
                                    <button
                                        onClick={() => copyToClipboard(result.melodyPrompt, 'melody')}
                                        className={`p-2 rounded-lg transition-all ${copiedStates['melody'] ? 'bg-red-500 text-black' : 'hover:bg-white/5 text-zinc-400'}`}
                                    >
                                        {copiedStates['melody'] ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 text-zinc-400 font-mono text-sm leading-6">
                                    {result.melodyPrompt}
                                </div>

                                {/* Audio/Visualizer Area */}
                                <div className="bg-zinc-950/50 rounded-2xl p-6 border border-zinc-800/50">
                                    {audioResult ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-4 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                                                <div className="p-3 bg-yellow-500 rounded-full text-black">
                                                    <Music4 className="h-5 w-5" />
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="text-xs font-bold text-zinc-500 uppercase">Backing Track (Demo)</p>
                                                    <p className="text-sm font-medium text-zinc-300 truncate">Sindicato Labs Urban Sample</p>
                                                </div>
                                                {audioResult.audioUrl && (
                                                    <a
                                                        href={audioResult.audioUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-yellow-500 transition-all active:scale-95"
                                                        title="Descargar Beat"
                                                    >
                                                        <Download className="h-5 w-5" />
                                                    </a>
                                                )}
                                            </div>
                                            {audioResult.audioUrl && (
                                                <div className="px-1">
                                                    <audio
                                                        controls
                                                        className="w-full h-10 accent-yellow-500 opacity-80 hover:opacity-100 transition-opacity"
                                                        src={audioResult.audioUrl}
                                                    >
                                                        Tu navegador no soporta el audio.
                                                    </audio>
                                                </div>
                                            )}
                                            <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest text-center">
                                                Nota: Audio generado vía Google Labs
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex items-end justify-center gap-1 h-32 py-4 opacity-50">
                                            {[...Array(20)].map((_, i) => (
                                                <motion.div
                                                    key={i}
                                                    animate={{ height: [20, Math.random() * 80 + 20, 20] }}
                                                    transition={{ duration: 1 + Math.random(), repeat: Infinity }}
                                                    className="w-2 rounded-full bg-gradient-to-t from-red-500 via-yellow-500 to-green-500"
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
