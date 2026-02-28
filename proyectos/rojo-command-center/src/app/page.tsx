"use client";

import React from 'react';
import CommandMap from '@/components/CommandMap';
import { useAgents } from '@/hooks/useAgents';
import {
  Shield,
  Sword,
  Wand2,
  Cpu,
  Database,
  Plus,
  RefreshCw,
  Book,
  Terminal as TerminalIcon,
  Zap,
  Skull,
  Sun,
  Moon,
  Gem,
  Wheat,
  Users,
  AlertTriangle,
} from 'lucide-react';
import InstructionsPanel from '@/components/InstructionsPanel';
import GrimoireModal from '@/components/GrimoireModal';

const getRoleIcon = (role: string, size = 'w-5 h-5') => {
  const r = role.toLowerCase();
  if (r.includes('comunic') || r.includes('chat') || r.includes('mago')) return <Wand2 className={`${size} text-wc3-blue`} />;
  if (r.includes('asistente') || r.includes('personal') || r.includes('defens')) return <Shield className={`${size} text-wc3-green`} />;
  if (r.includes('dev') || r.includes('code') || r.includes('guerr')) return <Sword className={`${size} text-wc3-red`} />;
  if (r.includes('db') || r.includes('data') || r.includes('anal')) return <Database className={`${size} text-wc3-blue`} />;
  if (r.includes('financi') || r.includes('gestor')) return <Gem className={`${size} text-wc3-gold`} />;
  return <Cpu className={`${size} text-wc3-gold`} />;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'working': return { ring: 'border-wc3-green shadow-[0_0_12px_rgba(0,255,102,0.3)]', dot: 'bg-wc3-green', label: 'ACTIVO', barColor: 'wc3-bar-fill-green' };
    case 'error': return { ring: 'border-wc3-red shadow-[0_0_12px_rgba(204,34,0,0.3)]', dot: 'bg-wc3-red', label: 'ERROR', barColor: 'wc3-bar-fill-red' };
    default: return { ring: 'border-wc3-text-dim', dot: 'bg-wc3-text-dim', label: 'INACTIVO', barColor: 'wc3-bar-fill-blue' };
  }
};

export default function Home() {
  const { agents, loading, refetch } = useAgents();
  const [isInstructionsOpen, setIsInstructionsOpen] = React.useState(false);
  const [isGrimoireOpen, setIsGrimoireOpen] = React.useState(false);
  const [selectedAgent, setSelectedAgent] = React.useState<string | null>(null);

  // Simulated day/night cycle based on real time
  const hour = new Date().getHours();
  const isNight = hour < 6 || hour >= 20;

  const activeCount = agents.filter(a => a.status === 'working').length;
  const totalCount = agents.length;

  return (
    <main className="relative min-h-screen flex flex-col h-screen overflow-hidden" style={{ fontFamily: 'var(--font-crimson), serif' }}>

      {/* ══════════ TOP RESOURCE BAR ══════════ */}
      <nav className="h-14 wc3-panel flex items-center justify-between px-6 z-50">
        {/* Left: Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 wc3-frame rounded flex items-center justify-center bg-gradient-to-br from-wc3-gold-dark/40 to-wc3-panel">
            <Skull className="w-5 h-5 text-wc3-gold" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-wide text-wc3-gold flex items-center gap-2" style={{ fontFamily: 'var(--font-cinzel), Cinzel, serif' }}>
              ORQUESTA ROJA
              <span className="text-[9px] bg-wc3-red-dark/80 px-1.5 py-0.5 rounded text-wc3-red border border-wc3-red/30">BETA</span>
            </h1>
            <p className="text-[9px] text-wc3-text-dim uppercase tracking-[0.2em] leading-none">Centro de Comando v1.0.42</p>
          </div>
        </div>

        {/* Center: Resources */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2" title="Oro disponible">
            <Gem className="w-4 h-4 text-wc3-gold" />
            <span className="text-sm font-bold text-wc3-gold" style={{ fontFamily: 'var(--font-cinzel)' }}>15,420</span>
          </div>
          <div className="flex items-center gap-2" title="Suministros">
            <Wheat className="w-4 h-4 text-wc3-green" />
            <span className="text-sm font-bold text-wc3-green">{activeCount}<span className="text-wc3-text-dim">/{totalCount}</span></span>
          </div>
          <div className="flex items-center gap-2" title="Agentes activos">
            <Users className="w-4 h-4 text-wc3-blue" />
            <span className="text-sm font-bold text-wc3-blue">{totalCount}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded border border-wc3-gold-dark/30 bg-wc3-panel-light/50" title={isNight ? 'Noche' : 'Día'}>
            {isNight ? <Moon className="w-4 h-4 text-wc3-blue" /> : <Sun className="w-4 h-4 text-wc3-gold-bright" />}
            <span className="text-[10px] text-wc3-text-dim uppercase">{isNight ? 'Noche' : 'Día'}</span>
          </div>
        </div>

        {/* Right: Commander Avatar */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] text-wc3-text-dim uppercase tracking-wider">Comandante</p>
            <p className="text-xs font-bold text-wc3-gold" style={{ fontFamily: 'var(--font-cinzel)' }}>JUANPI</p>
          </div>
          <div className="w-10 h-10 rounded wc3-frame bg-gradient-to-br from-wc3-gold-dark/30 to-wc3-panel flex items-center justify-center">
            <span className="text-sm font-bold text-wc3-gold" style={{ fontFamily: 'var(--font-cinzel)' }}>JP</span>
          </div>
        </div>
      </nav>

      {/* ══════════ MAIN AREA ══════════ */}
      <div className="flex-1 flex overflow-hidden">

        {/* ──── LEFT: UNIT LIST PANEL ──── */}
        <aside className="w-72 wc3-panel flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-wc3-gold-dark/20">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-wc3-gold" style={{ fontFamily: 'var(--font-cinzel)' }}>
              Unidades Desplegadas
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
            {loading ? (
              <div className="text-wc3-text-dim text-xs animate-pulse py-8 text-center">Escaneando sector...</div>
            ) : agents.length === 0 ? (
              <div className="text-wc3-text-dim text-xs italic py-8 text-center">No se detectaron agentes.</div>
            ) : agents.map((agent) => {
              const sc = getStatusColor(agent.status);
              const isSelected = selectedAgent === agent.id;
              return (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgent(isSelected ? null : agent.id)}
                  className={`w-full text-left p-2.5 rounded transition-all group
                    ${isSelected
                      ? 'bg-wc3-gold-dark/15 border border-wc3-gold shadow-[0_0_15px_rgba(200,170,110,0.1)]'
                      : 'border border-transparent hover:bg-wc3-panel-light/60 hover:border-wc3-gold-dark/30'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Portrait */}
                    <div className={`w-10 h-10 rounded border-2 flex items-center justify-center bg-wc3-stone-dark/80 shrink-0 ${sc.ring} transition-all`}>
                      {getRoleIcon(agent.role)}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-wc3-gold truncate uppercase tracking-wider" style={{ fontFamily: 'var(--font-cinzel)' }}>
                        {agent.name.replace(/_/g, ' ')}
                      </p>
                      <p className="text-[9px] text-wc3-text-dim truncate">{agent.role}</p>
                      {/* HP bar */}
                      <div className="wc3-bar h-1.5 mt-1 rounded-sm">
                        <div
                          className={`h-full ${sc.barColor} transition-all duration-1000`}
                          style={{ width: agent.status === 'working' ? '85%' : agent.status === 'error' ? '20%' : '50%' }}
                        />
                      </div>
                    </div>
                    {/* Status dot */}
                    <div className={`w-2 h-2 rounded-full shrink-0 ${sc.dot} ${agent.status === 'working' ? 'animate-pulse' : ''}`} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected unit detail */}
          {selectedAgent && (() => {
            const agent = agents.find(a => a.id === selectedAgent);
            if (!agent) return null;
            const sc = getStatusColor(agent.status);
            const lastTime = agent.lastActive ? new Date(agent.lastActive).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : '--:--';
            return (
              <div className="px-4 py-3 border-t border-wc3-gold-dark/20 bg-wc3-stone-dark/50 space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded border-2 flex items-center justify-center bg-wc3-stone-dark ${sc.ring}`}>
                    {getRoleIcon(agent.role, 'w-4 h-4')}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-wc3-gold uppercase" style={{ fontFamily: 'var(--font-cinzel)' }}>{agent.name.replace(/_/g, ' ')}</p>
                    <p className="text-[9px] text-wc3-text-dim">{sc.label}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[9px]">
                  <div className="text-wc3-text-dim">Última señal:</div>
                  <div className="text-wc3-gold text-right">{lastTime}</div>
                  <div className="text-wc3-text-dim">Nivel:</div>
                  <div className="text-wc3-gold text-right">{Math.abs(agent.name.length * 7 % 60) + 1}</div>
                </div>
              </div>
            );
          })()}
        </aside>

        {/* ──── CENTER: THE MAP ──── */}
        <section className="flex-1 relative bg-wc3-bg overflow-hidden">
          <CommandMap agents={agents} selectedAgent={selectedAgent} onSelectAgent={setSelectedAgent} />

          {/* Map Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-1.5 z-10">
            <button
              onClick={() => refetch()}
              title="Refrescar"
              className="wc3-btn w-9 h-9 flex items-center justify-center rounded"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              title="Agregar Agente"
              className="wc3-btn w-9 h-9 flex items-center justify-center rounded"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* ──── RIGHT: COMMAND CARD & MINIMAP ──── */}
        <aside className="w-64 wc3-panel flex flex-col overflow-hidden">
          {/* Minimap */}
          <div className="p-3">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-wc3-gold mb-2" style={{ fontFamily: 'var(--font-cinzel)' }}>
              Minimapa
            </h3>
            <div className="wc3-minimap-frame aspect-square rounded relative overflow-hidden">
              {/* Terrain background */}
              <div className="absolute inset-0 wc3-terrain" />
              {/* Agent dots */}
              {agents.map((agent, i) => {
                const sc = getStatusColor(agent.status);
                return (
                  <div
                    key={agent.id}
                    className={`absolute w-2 h-2 rounded-full ${sc.dot} ${agent.status === 'working' ? 'animate-pulse' : ''}`}
                    style={{
                      left: `${(i % 6) * 15 + 10}%`,
                      top: `${Math.floor(i / 6) * 15 + 10}%`,
                    }}
                  />
                );
              })}
              {/* Fog overlay */}
              <div className="absolute inset-0 fog-of-war" />
            </div>
          </div>

          {/* Divider */}
          <div className="mx-3 border-t border-wc3-gold-dark/20" />

          {/* Command Card */}
          <div className="p-3 flex-1 flex flex-col">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-wc3-gold mb-3" style={{ fontFamily: 'var(--font-cinzel)' }}>
              Panel de Comando
            </h3>

            {/* 2x2 Action Grid */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={() => setIsInstructionsOpen(!isInstructionsOpen)}
                className="wc3-btn py-4 px-2 rounded flex flex-col items-center gap-1.5"
              >
                <TerminalIcon className="w-5 h-5" />
                <span className="text-[8px] leading-tight text-center">Órdenes</span>
              </button>
              <button
                onClick={() => setIsGrimoireOpen(true)}
                className="wc3-btn py-4 px-2 rounded flex flex-col items-center gap-1.5"
              >
                <Book className="w-5 h-5" />
                <span className="text-[8px] leading-tight text-center">Grimorio</span>
              </button>
              <button className="wc3-btn py-4 px-2 rounded flex flex-col items-center gap-1.5">
                <Zap className="w-5 h-5" />
                <span className="text-[8px] leading-tight text-center">Invocar</span>
              </button>
              <button className="wc3-btn wc3-btn-danger py-4 px-2 rounded flex flex-col items-center gap-1.5">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-[8px] leading-tight text-center">Reinicio</span>
              </button>
            </div>

            {/* Stats */}
            <div className="mt-auto space-y-2">
              <div className="flex justify-between text-[9px]">
                <span className="text-wc3-text-dim uppercase tracking-wider">Estado Sede</span>
                <span className="text-wc3-green font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-wc3-green animate-pulse inline-block" />
                  OPERATIVA
                </span>
              </div>
              <div className="flex justify-between text-[9px]">
                <span className="text-wc3-text-dim uppercase tracking-wider">Agentes Activos</span>
                <span className="text-wc3-gold font-bold">{activeCount}/{totalCount}</span>
              </div>
              <div className="flex justify-between text-[9px]">
                <span className="text-wc3-text-dim uppercase tracking-wider">Uptime</span>
                <span className="text-wc3-blue font-bold">99.7%</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ══════════ BOTTOM: EXP BAR + CONSOLE ══════════ */}
      <footer className="h-10 wc3-panel flex items-center px-6 gap-4 z-50">
        <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-wc3-gold-dark" style={{ fontFamily: 'var(--font-cinzel)' }}>EXP</span>
        <div className="flex-1 wc3-bar h-2.5 rounded-sm">
          <div className="wc3-bar-fill-gold h-full rounded-sm transition-all duration-1000" style={{ width: '42%' }} />
        </div>
        <span className="text-[10px] font-bold text-wc3-gold" style={{ fontFamily: 'var(--font-cinzel)' }}>
          NIVEL 42
        </span>
        <div className="w-px h-5 bg-wc3-gold-dark/30 mx-2" />
        <span className="text-[9px] text-wc3-text-dim truncate max-w-xs">
          &gt; Sede Central operativa — {totalCount} agentes detectados
        </span>
      </footer>

      {/* ══════════ OVERLAYS ══════════ */}
      <InstructionsPanel
        isOpen={isInstructionsOpen}
        onClose={() => setIsInstructionsOpen(false)}
      />
      <GrimoireModal
        isOpen={isGrimoireOpen}
        onClose={() => setIsGrimoireOpen(false)}
      />
    </main>
  );
}
