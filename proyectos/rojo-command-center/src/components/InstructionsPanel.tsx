"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Send, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InstructionsPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

interface LogEntry {
    time: string;
    text: string;
    type: 'system' | 'user' | 'response';
}

export default function InstructionsPanel({ isOpen, onClose }: InstructionsPanelProps) {
    const [input, setInput] = useState('');
    const [logs, setLogs] = useState<LogEntry[]>([
        { time: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), text: 'Sistema de comando inicializado.', type: 'system' },
        { time: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), text: 'Sede central operativa. Esperando instrucciones...', type: 'system' },
    ]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    const handleSend = () => {
        if (!input.trim()) return;
        const time = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        setLogs(prev => [
            ...prev,
            { time, text: input, type: 'user' },
        ]);

        // Simulate response
        setTimeout(() => {
            const responseTime = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            setLogs(prev => [
                ...prev,
                { time: responseTime, text: `Orden recibida: "${input}". Transmitiendo a la Orquesta...`, type: 'response' },
            ]);
        }, 800);

        setInput('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="fixed bottom-10 left-72 right-64 z-40 wc3-console rounded-t-lg overflow-hidden"
                    style={{ maxHeight: '280px' }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-2 border-b border-wc3-gold-dark/30 bg-wc3-stone-dark/60">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-wc3-gold flex items-center gap-2" style={{ fontFamily: 'var(--font-cinzel)' }}>
                            <Terminal className="w-3.5 h-3.5" /> Consola de Comando
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-wc3-text-dim hover:text-wc3-red transition-colors p-1"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Log area */}
                    <div ref={scrollRef} className="h-36 overflow-y-auto px-4 py-2 space-y-1 text-xs" style={{ fontFamily: 'Courier New, monospace' }}>
                        {logs.map((log, i) => (
                            <div key={i} className="flex gap-2 leading-relaxed">
                                <span className="text-wc3-text-dim shrink-0">[{log.time}]</span>
                                {log.type === 'user' && <ChevronRight className="w-3 h-3 text-wc3-gold mt-0.5 shrink-0" />}
                                <span className={`${log.type === 'system' ? 'text-wc3-text-dim' :
                                        log.type === 'user' ? 'text-wc3-gold' :
                                            'text-wc3-green'
                                    }`}>
                                    {log.type === 'system' && '> '}
                                    {log.text}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Input */}
                    <div className="flex items-center gap-2 px-4 py-2 border-t border-wc3-gold-dark/20 bg-black/40">
                        <span className="text-wc3-gold text-xs shrink-0" style={{ fontFamily: 'Courier New' }}>&gt;</span>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Escribe una orden para la Orquesta..."
                            className="flex-1 bg-transparent border-none outline-none text-xs text-wc3-green placeholder:text-wc3-text-dim/30"
                            style={{ fontFamily: 'Courier New, monospace' }}
                        />
                        <button
                            onClick={handleSend}
                            className="wc3-btn px-3 py-1.5 rounded flex items-center gap-1.5 text-[9px]"
                        >
                            <Send className="w-3 h-3" /> Enviar
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
