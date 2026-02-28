
"use client";

import { useState, useEffect } from 'react';

export interface Agent {
    id: string;
    name: string;
    role: string;
    status: 'idle' | 'working' | 'error';
    lastActive: number;
}

export function useAgents() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAgents = async () => {
        try {
            const response = await fetch('/api/agents');
            if (!response.ok) throw new Error('Failed to fetch agents');
            const data = await response.json();
            setAgents(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAgents();
        const interval = setInterval(fetchAgents, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    return { agents, loading, error, refetch: fetchAgents };
}
