"use client";
import React, { useState } from 'react';
import { Book, X, Shield, Sword, Wand2, Cpu, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MANUAL_DATOS } from '@/data/manual';

interface GrimoireModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const getClassIcon = (clase: string) => {
    const c = clase.toLowerCase();
    if (c.includes('defens')) return <Shield className="w-5 h-5 text-wc3-green" />;
    if (c.includes('guerr')) return <Sword className="w-5 h-5 text-wc3-red" />;
    if (c.includes('mago')) return <Wand2 className="w-5 h-5 text-wc3-blue" />;
    return <Cpu className="w-5 h-5 text-wc3-gold" />;
};

export default function GrimoireModal({ isOpen, onClose }: GrimoireModalProps) {
    const [activeTab, setActiveTab] = useState<'sede' | 'agentes'>('sede');

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/70 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 20 }}
                        className="wc3-scroll w-full max-w-3xl h-[75vh] flex flex-col rounded-lg overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b-2 border-wc3-gold-dark/40 flex items-center justify-between bg-wc3-stone-dark/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded wc3-frame flex items-center justify-center bg-wc3-panel">
                                    <Book className="w-5 h-5 text-wc3-gold" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold uppercase tracking-wider text-wc3-gold" style={{ fontFamily: 'var(--font-cinzel)' }}>
                                        Grimorio de Operaciones
                                    </h2>
                                    <p className="text-[9px] text-wc3-text-dim uppercase tracking-[0.15em]">
                                        Orquesta Roja — Protocolos Tácticos
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="wc3-btn w-8 h-8 flex items-center justify-center rounded"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-wc3-gold-dark/20 bg-wc3-stone-dark/30">
                            <button
                                onClick={() => setActiveTab('sede')}
                                className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-[0.15em] transition-all border-b-2 ${activeTab === 'sede'
                                        ? 'border-wc3-gold text-wc3-gold bg-wc3-gold/5'
                                        : 'border-transparent text-wc3-text-dim hover:text-wc3-gold/60'
                                    }`}
                                style={{ fontFamily: 'var(--font-cinzel)' }}
                            >
                                Sede de Operaciones
                            </button>
                            <button
                                onClick={() => setActiveTab('agentes')}
                                className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-[0.15em] transition-all border-b-2 ${activeTab === 'agentes'
                                        ? 'border-wc3-gold text-wc3-gold bg-wc3-gold/5'
                                        : 'border-transparent text-wc3-text-dim hover:text-wc3-gold/60'
                                    }`}
                                style={{ fontFamily: 'var(--font-cinzel)' }}
                            >
                                Jerarquía de Agentes
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {activeTab === 'sede' ? (
                                <div className="space-y-6">
                                    {/* Platform info */}
                                    <div>
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-wc3-gold mb-3" style={{ fontFamily: 'var(--font-cinzel)' }}>
                                            {MANUAL_DATOS.plataforma.nombre}
                                        </h3>
                                        <p className="text-sm text-wc3-text leading-relaxed mb-4">
                                            {MANUAL_DATOS.plataforma.descripcion}
                                        </p>
                                        <div className="text-[10px] text-wc3-text-dim mb-4">
                                            Versión: <span className="text-wc3-gold">{MANUAL_DATOS.plataforma.vuelo}</span>
                                        </div>
                                    </div>

                                    {/* Controls */}
                                    <div className="space-y-2">
                                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-wc3-gold-dark" style={{ fontFamily: 'var(--font-cinzel)' }}>
                                            Controles del Sistema
                                        </h4>
                                        {MANUAL_DATOS.plataforma.controles.map((c, i) => (
                                            <div key={i} className="flex items-start gap-3 p-3 rounded bg-wc3-panel-light/30 border border-wc3-gold-dark/10 hover:border-wc3-gold-dark/30 transition-all">
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
                                        <p className="text-xs italic text-wc3-text-dim text-center">
                                            &ldquo;La orquesta no solo ejecuta, la orquesta evoluciona.&rdquo;
                                        </p>
                                        <p className="text-[9px] text-wc3-gold-dark text-center mt-1">— Comandante Rojo</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {MANUAL_DATOS.capacidades_agentes.map((ag, i) => (
                                        <div
                                            key={i}
                                            className="p-4 rounded-lg border border-wc3-gold-dark/20 bg-wc3-panel-light/20 hover:border-wc3-gold-dark/40 transition-all"
                                        >
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 rounded border-2 border-wc3-gold-dark flex items-center justify-center bg-wc3-stone-dark">
                                                    {getClassIcon(ag.clase)}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="text-xs font-bold uppercase tracking-wider text-wc3-gold" style={{ fontFamily: 'var(--font-cinzel)' }}>
                                                        {ag.rol}
                                                    </h4>
                                                    <span className="text-[9px] text-wc3-text-dim uppercase tracking-wider">{ag.clase}</span>
                                                </div>
                                            </div>
                                            <p className="text-xs text-wc3-text mb-3 leading-relaxed">{ag.descripcion}</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {ag.poderes.map((p, pi) => (
                                                    <span
                                                        key={pi}
                                                        className="text-[9px] px-2 py-0.5 rounded border border-wc3-gold-dark/30 bg-wc3-gold-dark/10 text-wc3-gold"
                                                    >
                                                        {p}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-3 border-t border-wc3-gold-dark/20 text-center bg-wc3-stone-dark/30">
                            <span className="text-[9px] uppercase tracking-[0.2em] text-wc3-text-dim">
                                División de Inteligencia Roja © 2026
                            </span>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
