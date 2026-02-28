"use client";

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Cpu,
    Shield,
    Sword,
    Wand2,
    Database,
    Gem,
} from 'lucide-react';
import { Agent } from '@/hooks/useAgents';

interface CommandMapProps {
    agents: Agent[];
    selectedAgent: string | null;
    onSelectAgent: (id: string | null) => void;
}

const getRoleIcon = (role: string) => {
    const r = role.toLowerCase();
    if (r.includes('comunic') || r.includes('chat') || r.includes('mago')) return <Wand2 className="w-5 h-5 text-wc3-blue" />;
    if (r.includes('asistente') || r.includes('personal') || r.includes('defens')) return <Shield className="w-5 h-5 text-wc3-green" />;
    if (r.includes('dev') || r.includes('code') || r.includes('guerr')) return <Sword className="w-5 h-5 text-wc3-red" />;
    if (r.includes('db') || r.includes('data') || r.includes('anal')) return <Database className="w-5 h-5 text-wc3-blue" />;
    if (r.includes('financi') || r.includes('gestor')) return <Gem className="w-5 h-5 text-wc3-gold" />;
    return <Cpu className="w-5 h-5 text-wc3-gold" />;
};

const getRoleColor = (status: string) => {
    switch (status) {
        case 'working': return {
            ring: 'border-wc3-green',
            glow: 'shadow-[0_0_20px_rgba(0,255,102,0.3)]',
            bg: 'bg-wc3-green/10',
            pulse: 'animate-unit-pulse',
        };
        case 'error': return {
            ring: 'border-wc3-red',
            glow: 'shadow-[0_0_20px_rgba(204,34,0,0.3)]',
            bg: 'bg-wc3-red/10',
            pulse: 'animate-unit-error',
        };
        default: return {
            ring: 'border-wc3-text-dim/50',
            glow: '',
            bg: 'bg-wc3-stone/30',
            pulse: '',
        };
    }
};

const getDeterministicPosition = (id: string, index: number, total: number) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = ((hash << 5) - hash) + id.charCodeAt(i);
        hash |= 0;
    }
    // Spread agents across the center of the map (20%-80% range)
    const x = 20 + Math.abs(hash % 60);
    const y = 15 + Math.abs((hash >> 8) % 65);
    return { x, y };
};

export default function CommandMap({ agents, selectedAgent, onSelectAgent }: CommandMapProps) {
    const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);

    const mappedAgents = useMemo(() => {
        return agents.map((agent, index) => ({
            ...agent,
            pos: getDeterministicPosition(agent.id, index, agents.length)
        }));
    }, [agents]);

    return (
        <div className="relative w-full h-full overflow-hidden">
            {/* Terrain background */}
            <div className="absolute inset-0 wc3-terrain" />

            {/* Subtle terrain variation patches */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute w-40 h-40 rounded-full bg-green-900/10 blur-3xl" style={{ left: '20%', top: '30%' }} />
                <div className="absolute w-56 h-56 rounded-full bg-emerald-900/8 blur-3xl" style={{ left: '60%', top: '50%' }} />
                <div className="absolute w-32 h-32 rounded-full bg-yellow-900/5 blur-2xl" style={{ left: '45%', top: '20%' }} />
                <div className="absolute w-48 h-48 rounded-full bg-teal-900/6 blur-3xl" style={{ left: '10%', top: '65%' }} />
            </div>

            {/* Agent Units */}
            <AnimatePresence>
                {mappedAgents.map((agent) => {
                    const colors = getRoleColor(agent.status);
                    const isSelected = selectedAgent === agent.id;
                    const isHovered = hoveredAgent === agent.id;
                    const level = Math.abs(agent.name.length * 7 % 60) + 1;

                    return (
                        <motion.div
                            key={agent.id}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                            }}
                            exit={{ opacity: 0, scale: 0 }}
                            transition={{ type: 'spring', stiffness: 120, damping: 15, delay: Math.random() * 0.3 }}
                            className="absolute cursor-pointer z-10"
                            style={{
                                left: `${agent.pos.x}%`,
                                top: `${agent.pos.y}%`,
                                transform: 'translate(-50%, -50%)',
                            }}
                            onClick={() => onSelectAgent(isSelected ? null : agent.id)}
                            onMouseEnter={() => setHoveredAgent(agent.id)}
                            onMouseLeave={() => setHoveredAgent(null)}
                        >
                            {/* Selection ring */}
                            {isSelected && (
                                <motion.div
                                    className="absolute -inset-3 rounded-full border-2 border-wc3-green/60"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.3, 0.6] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                            )}

                            {/* Ground shadow */}
                            <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-14 h-3 rounded-full bg-black/40 blur-sm ${agent.status === 'working' ? 'bg-wc3-green/20' : ''}`} />

                            {/* Unit circle */}
                            <div className={`relative w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300
                                ${colors.ring} ${colors.glow} ${colors.bg} ${colors.pulse}
                                ${isSelected ? 'scale-125 border-wc3-gold shadow-[0_0_25px_rgba(200,170,110,0.4)]' : ''}
                                ${isHovered ? 'scale-110' : ''}
                            `}>
                                {/* Inner glow */}
                                <div className="absolute inset-1 rounded-full bg-wc3-panel/80 flex items-center justify-center">
                                    {getRoleIcon(agent.role)}
                                </div>
                            </div>

                            {/* Name tag */}
                            <div className={`absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-center transition-opacity ${isSelected || isHovered ? 'opacity-100' : 'opacity-70'}`}>
                                <span className="text-[8px] font-bold text-wc3-gold uppercase tracking-wider px-1.5 py-0.5 bg-black/60 rounded" style={{ fontFamily: 'var(--font-cinzel)' }}>
                                    {agent.name.split('_').pop()}
                                </span>
                            </div>

                            {/* HP bar below unit */}
                            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-14 wc3-bar h-1 rounded-sm">
                                <div
                                    className={`h-full ${colors.ring.includes('green') ? 'wc3-bar-fill-green' : colors.ring.includes('red') ? 'wc3-bar-fill-red' : 'wc3-bar-fill-blue'} transition-all`}
                                    style={{ width: agent.status === 'working' ? '85%' : agent.status === 'error' ? '20%' : '50%' }}
                                />
                            </div>

                            {/* Tooltip on hover */}
                            <AnimatePresence>
                                {isHovered && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 5 }}
                                        className="wc3-tooltip absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap z-50 rounded"
                                    >
                                        <div className="font-bold text-wc3-gold-bright" style={{ fontFamily: 'var(--font-cinzel)' }}>
                                            {agent.name.replace(/_/g, ' ')}
                                        </div>
                                        <div className="text-[9px] text-wc3-text-dim">
                                            Nivel {level} — {agent.role}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </AnimatePresence>

            {/* Fog of War overlay */}
            <div className="absolute inset-0 fog-of-war pointer-events-none" />

            {/* Map border frame */}
            <div className="absolute inset-0 pointer-events-none border-2 border-wc3-gold-dark/30" />

            {/* Status indicator bottom-left */}
            <div className="absolute bottom-3 left-3 wc3-tooltip rounded flex items-center gap-2 z-20">
                <span className="w-1.5 h-1.5 rounded-full bg-wc3-green animate-pulse" />
                <span className="text-[9px] uppercase tracking-wider">Sede Central Activa</span>
            </div>
        </div>
    );
}
