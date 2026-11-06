'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useSession } from '@/lib/session-context';

interface Message {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    timestamp: string;
}

export default function CoachPage() {
    const { user } = useSession();
    const [mode, setMode] = useState<'interview' | 'resume' | 'gap' | 'salary'>('interview');
    const [targetRole, setTargetRole] = useState('Senior Full Stack Engineer');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            sender: 'ai',
            text: "Hello! I am your HireMe Career Preparation Assistant. How can I help you prepare today?",
            timestamp: '10:00 AM',
        },
        {
            id: '2',
            sender: 'ai',
            text: "Here are 3 tailored technical interview questions based on modern full-stack development:\n\n1. **System Design**: How would you design a real-time messaging architecture using Next.js, Node.js, and MongoDB to support 50,000 active concurrent connections?\n2. **Optimization**: Explain your approach to eliminating hydration mismatches and optimizing bundle size in Next.js 14.\n3. **Distributed Systems**: How do you implement idempotent API mutations with connection pooling and automated retry backoff?",
            timestamp: '10:01 AM',
        },
    ]);
    const [inputPrompt, setInputPrompt] = useState('');
    const [loading, setLoading] = useState(false);

    const presets = [
        'How do I answer "Tell me about a complex technical challenge you solved"?',
        'Rewrite my React and Node.js bullet points to quantify business metrics.',
        'Create a 2-week learning roadmap to master Kubernetes and Docker.',
        'Give me negotiation scripts to request a 15% higher base salary.',
    ];

    const handleSend = async (textToSend?: string) => {
        const text = textToSend || inputPrompt;
        if (!text.trim() || loading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            sender: 'user',
            text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, userMsg]);
        if (!textToSend) setInputPrompt('');
        setLoading(true);

        try {
            const res = await fetch('/api/career-coach/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, prompt: text, topic: mode, mode, targetRole }),
            });
            const data = await res.json();
            if (data.success && data.reply) {
                const aiMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    sender: 'ai',
                    text: data.reply,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                };
                setMessages((prev) => [...prev, aiMsg]);
            }
        } catch (err) {
            console.error('Coach chat failed:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-background text-on-surface font-sans">
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                <Header title="AI Career Coach" />

                <main className="flex-1 p-6 flex flex-col min-h-0 max-w-7xl mx-auto w-full space-y-4">
                    {/* Top Mode Selector Bar */}
                    <div className="glass-card p-4 rounded-2xl border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
                        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none w-full sm:w-auto">
                            {[
                                { id: 'interview', label: 'Interview Prep', icon: 'quiz' },
                                { id: 'resume', label: 'Bullet Optimizer', icon: 'edit_note' },
                                { id: 'gap', label: 'Skill Gap Strategy', icon: 'trending_up' },
                                { id: 'salary', label: 'Salary Negotiator', icon: 'payments' },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setMode(item.id as any)}
                                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${mode === item.id
                                            ? 'bg-primary-container text-white shadow-sm shadow-indigo-500/30'
                                            : 'bg-surface-container-high text-slate-400 hover:text-white'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-sm">{item.icon}</span>
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-400 w-full sm:w-auto justify-end">
                            <span>Target:</span>
                            <input
                                type="text"
                                value={targetRole}
                                onChange={(e) => setTargetRole(e.target.value)}
                                className="bg-surface-container-high border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-primary-container"
                            />
                        </div>
                    </div>

                    {/* Chat Messages Column */}
                    <div className="flex-1 glass-card rounded-2xl p-6 border border-white/5 flex flex-col min-h-0 overflow-hidden">
                        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex gap-3 max-w-3xl ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                                >
                                    <div
                                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm ${msg.sender === 'user'
                                                ? 'bg-primary-container text-white'
                                                : 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-base">
                                            {msg.sender === 'user' ? 'person' : 'smart_toy'}
                                        </span>
                                    </div>
                                    <div
                                        className={`p-4 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${msg.sender === 'user'
                                                ? 'bg-primary-container text-white rounded-tr-none'
                                                : 'bg-surface-container-high border border-white/5 text-slate-200 rounded-tl-none shadow-sm'
                                            }`}
                                    >
                                        {msg.text}
                                        <div
                                            className={`text-[9px] mt-2 opacity-60 ${msg.sender === 'user' ? 'text-right text-indigo-200' : 'text-slate-400'}`}
                                        >
                                            {msg.timestamp}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {loading && (
                                <div className="flex gap-3 max-w-3xl">
                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shrink-0">
                                        <span className="material-symbols-outlined text-base animate-pulse">smart_toy</span>
                                    </div>
                                    <div className="bg-surface-container-high border border-white/5 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                                        <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
                                        <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Preset Prompt Suggestions */}
                        <div className="pt-4 border-t border-white/5 flex gap-2 overflow-x-auto pb-2 scrollbar-none shrink-0">
                            {presets.map((prompt, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSend(prompt)}
                                    className="px-3 py-1.5 rounded-xl bg-surface-container-high/80 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 text-[11px] whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0"
                                >
                                    <span className="material-symbols-outlined text-xs text-primary">tips_and_updates</span>
                                    {prompt}
                                </button>
                            ))}
                        </div>

                        {/* Input Form Bar */}
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSend();
                            }}
                            className="pt-3 flex gap-2 shrink-0"
                        >
                            <input
                                type="text"
                                placeholder={`Ask your AI Coach anything (${mode} mode)...`}
                                value={inputPrompt}
                                onChange={(e) => setInputPrompt(e.target.value)}
                                className="flex-1 bg-surface-container-high border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-container"
                            />
                            <button
                                type="submit"
                                disabled={!inputPrompt.trim() || loading}
                                className="bg-primary-container hover:bg-primary-container/90 text-white font-bold px-5 py-3 rounded-xl transition-all shadow-md shadow-indigo-500/25 flex items-center gap-1.5 disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-sm">send</span>
                            </button>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
}
