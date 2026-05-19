"use client";
import React, { useState } from 'react';
import { Book, X, Shield, Sword, Wand2, Cpu, ChevronRight, Copy, Terminal, Folder, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MANUAL_DATOS } from '@/data/manual';

interface GrimoireModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const getClassIcon = (clase: string) => {
    const c = clase.toLowerCase();
    if (c.includes('defens') || c.includes('inbox')) return <Shield className="w-5 h-5 text-wc3-green" />;
    if (c.includes('guerr') || c.includes('present') || c.includes('powerpoint')) return <Sword className="w-5 h-5 text-wc3-red" />;
    if (c.includes('mago') || c.includes('propaganda') || c.includes('public')) return <Wand2 className="w-5 h-5 text-wc3-blue" />;
    return <Cpu className="w-5 h-5 text-wc3-gold" />;
};

export default function GrimoireModal({ isOpen, onClose }: GrimoireModalProps) {
    const [activeTab, setActiveTab] = useState<'sede' | 'agentes' | 'prompts'>('sede');
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [copiedCmdIndex, setCopiedCmdIndex] = useState<number | null>(null);

    const handleCopy = (text: string, index: number, isCmd = false) => {
        navigator.clipboard.writeText(text);
        if (isCmd) {
            setCopiedCmdIndex(index);
            setTimeout(() => setCopiedCmdIndex(null), 2000);
        } else {
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 20 }}
                        className="wc3-scroll w-full max-w-3xl h-[80vh] flex flex-col rounded-lg overflow-hidden border border-wc3-gold-dark/40 shadow-[0_0_50px_rgba(0,0,0,0.8)]"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b-2 border-wc3-gold-dark/40 flex items-center justify-between bg-wc3-stone-dark/90">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded wc3-frame flex items-center justify-center bg-wc3-panel">
                                    <Book className="w-5 h-5 text-wc3-gold animate-pulse" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold uppercase tracking-wider text-wc3-gold" style={{ fontFamily: 'var(--font-cinzel), Cinzel, serif' }}>
                                        Grimorio de Operaciones
                                    </h2>
                                    <p className="text-[9px] text-wc3-text-dim uppercase tracking-[0.15em] leading-none mt-1">
                                        Ecosistema Antigravity — Manual de Vanguardia
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="wc3-btn w-8 h-8 flex items-center justify-center rounded transition-all"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-wc3-gold-dark/20 bg-wc3-stone-dark/70">
                            <button
                                onClick={() => setActiveTab('sede')}
                                className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-[0.15em] transition-all border-b-2 ${activeTab === 'sede'
                                        ? 'border-wc3-gold text-wc3-gold bg-wc3-gold/5'
                                        : 'border-transparent text-wc3-text-dim hover:text-wc3-gold/60'
                                    }`}
                                style={{ fontFamily: 'var(--font-cinzel), Cinzel, serif' }}
                            >
                                Sede de Operaciones
                            </button>
                            <button
                                onClick={() => setActiveTab('agentes')}
                                className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-[0.15em] transition-all border-b-2 ${activeTab === 'agentes'
                                        ? 'border-wc3-gold text-wc3-gold bg-wc3-gold/5'
                                        : 'border-transparent text-wc3-text-dim hover:text-wc3-gold/60'
                                    }`}
                                style={{ fontFamily: 'var(--font-cinzel), Cinzel, serif' }}
                            >
                                Unidades de Combate
                            </button>
                            <button
                                onClick={() => setActiveTab('prompts')}
                                className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-[0.15em] transition-all border-b-2 ${activeTab === 'prompts'
                                        ? 'border-wc3-gold text-wc3-gold bg-wc3-gold/5'
                                        : 'border-transparent text-wc3-text-dim hover:text-wc3-gold/60'
                                    }`}
                                style={{ fontFamily: 'var(--font-cinzel), Cinzel, serif' }}
                            >
                                Libro de Prompts
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 bg-wc3-bg/95">
                            {activeTab === 'sede' ? (
                                <div className="space-y-6">
                                    {/* Platform info */}
                                    <div className="p-4 rounded border border-wc3-gold-dark/20 bg-wc3-panel-light/35">
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-wc3-gold mb-2" style={{ fontFamily: 'var(--font-cinzel), Cinzel, serif' }}>
                                            {MANUAL_DATOS.plataforma.nombre}
                                        </h3>
                                        <p className="text-sm text-wc3-text leading-relaxed">
                                            {MANUAL_DATOS.plataforma.descripcion}
                                        </p>
                                        <div className="text-[10px] text-wc3-text-dim mt-3 uppercase tracking-wider">
                                            Vuelo Táctico: <span className="text-wc3-gold">{MANUAL_DATOS.plataforma.vuelo}</span>
                                        </div>
                                    </div>

                                    {/* Controls */}
                                    <div className="space-y-2">
                                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-wc3-gold-dark" style={{ fontFamily: 'var(--font-cinzel), Cinzel, serif' }}>
                                            Arquitectura del Ecosistema
                                        </h4>
                                        {MANUAL_DATOS.plataforma.controles.map((c, i) => (
                                            <div key={i} className="flex items-start gap-3 p-3 rounded bg-wc3-panel-light/20 border border-wc3-gold-dark/10 hover:border-wc3-gold-dark/30 transition-all">
                                                <ChevronRight className="w-3 h-3 text-wc3-gold mt-0.5 shrink-0" />
                                                <div>
                                                    <span className="text-xs font-bold text-wc3-gold">{c.cmd}</span>
                                                    <p className="text-[10px] text-wc3-text-dim mt-0.5">{c.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Quote */}
                                    <div className="p-4 rounded border border-wc3-gold-dark/20 bg-wc3-gold-dark/5 mt-4">
                                        <p className="text-xs italic text-wc3-text-dim text-center leading-relaxed">
                                            &ldquo;El secreto de la victoria no reside en la fuerza ciega del script, sino en la perfecta armonía de la orquesta.&rdquo;
                                        </p>
                                        <p className="text-[9px] text-wc3-gold-dark text-center mt-1 uppercase tracking-wider">— Dirección General de Inteligencia</p>
                                    </div>
                                </div>
                            ) : activeTab === 'agentes' ? (
                                <div className="space-y-4">
                                    {MANUAL_DATOS.capacidades_agentes.map((ag, i) => (
                                        <div
                                            key={i}
                                            className="p-4 rounded-lg border border-wc3-gold-dark/15 bg-wc3-panel-light/10 hover:border-wc3-gold-dark/35 hover:bg-wc3-panel-light/20 transition-all duration-300"
                                        >
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 rounded border-2 border-wc3-gold-dark/60 flex items-center justify-center bg-wc3-stone-dark">
                                                    {getClassIcon(ag.clase)}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="text-xs font-bold uppercase tracking-wider text-wc3-gold" style={{ fontFamily: 'var(--font-cinzel), Cinzel, serif' }}>
                                                        {ag.rol}
                                                    </h4>
                                                    <span className="text-[9px] text-wc3-text-dim uppercase tracking-wider">{ag.clase}</span>
                                                </div>
                                            </div>
                                            <p className="text-xs text-wc3-text leading-relaxed mb-3">{ag.descripcion}</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {ag.poderes.map((p, pi) => (
                                                    <span
                                                        key={pi}
                                                        className="text-[9px] px-2 py-0.5 rounded border border-wc3-gold-dark/30 bg-wc3-gold-dark/10 text-wc3-gold uppercase tracking-wider"
                                                    >
                                                        {p}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="p-3.5 rounded border border-wc3-gold/25 bg-wc3-gold-dark/5 mb-2">
                                        <h4 className="text-xs font-bold text-wc3-gold uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-cinzel), Cinzel, serif' }}>
                                            Grimorio de Invocaciones Rápidas
                                        </h4>
                                        <p className="text-[10px] text-wc3-text-dim leading-normal">
                                            Aquí tienes las fórmulas exactas para activar o invocar a los especialistas. Copia los prompts para alimentar a tu agente orquestador o copia los comandos para correr los scripts nativos en tu terminal de Windows.
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        {MANUAL_DATOS.capacidades_agentes.map((ag, i) => (
                                            <div key={i} className="p-4 rounded-lg border border-wc3-gold-dark/20 bg-wc3-stone-dark/40 space-y-3.5">
                                                {/* Header */}
                                                <div className="flex items-center justify-between border-b border-wc3-gold-dark/15 pb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-wc3-gold" style={{ fontFamily: 'var(--font-cinzel), Cinzel, serif' }}>
                                                            {ag.rol.split(' - ')[0]}
                                                        </span>
                                                        <span className="text-[8px] bg-wc3-panel-light/60 px-1.5 py-0.5 rounded text-wc3-text-dim border border-wc3-gold-dark/20 uppercase">
                                                            {ag.clase}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[9px] text-wc3-text-dim">
                                                        <Folder className="w-3 h-3 text-wc3-gold" />
                                                        <code className="text-wc3-gold-dark">{ag.path}</code>
                                                    </div>
                                                </div>

                                                {/* Prompt Section */}
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[9px] uppercase tracking-wider text-wc3-text-dim flex items-center gap-1">
                                                            🔮 Prompt de Invocación
                                                        </span>
                                                        <button
                                                            onClick={() => handleCopy(ag.prompt, i, false)}
                                                            className="flex items-center gap-1 text-[9px] text-wc3-gold hover:text-wc3-gold-bright transition-all"
                                                        >
                                                            {copiedIndex === i ? (
                                                                <>
                                                                    <Check className="w-3 h-3 text-wc3-green" />
                                                                    <span className="text-wc3-green font-bold">Copiado</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Copy className="w-3 h-3" />
                                                                    <span>Copiar Prompt</span>
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                    <div className="p-2.5 rounded bg-wc3-bg border border-wc3-gold-dark/10">
                                                        <p className="text-xs text-wc3-text leading-relaxed font-serif italic">
                                                            &ldquo;{ag.prompt}&rdquo;
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Command Section */}
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[9px] uppercase tracking-wider text-wc3-text-dim flex items-center gap-1">
                                                            <Terminal className="w-3 h-3 text-wc3-red" /> Comando de Consola (Real)
                                                        </span>
                                                        <button
                                                            onClick={() => handleCopy(ag.comando, i, true)}
                                                            className="flex items-center gap-1 text-[9px] text-wc3-gold hover:text-wc3-gold-bright transition-all"
                                                        >
                                                            {copiedCmdIndex === i ? (
                                                                <>
                                                                    <Check className="w-3 h-3 text-wc3-green" />
                                                                    <span className="text-wc3-green font-bold">Copiado</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Copy className="w-3 h-3" />
                                                                    <span>Copiar Comando</span>
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                    <div className="p-2 rounded bg-black/60 border border-wc3-gold-dark/15 flex items-center justify-between">
                                                        <code className="text-[10px] text-wc3-green truncate font-mono select-all">
                                                            {ag.comando}
                                                        </code>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-3 border-t border-wc3-gold-dark/20 text-center bg-wc3-stone-dark/50">
                            <span className="text-[9px] uppercase tracking-[0.2em] text-wc3-text-dim">
                                División de Inteligencia Roja © 2026 — Antigravity Core
                            </span>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
