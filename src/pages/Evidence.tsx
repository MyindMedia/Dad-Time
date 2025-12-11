import React, { useState, useMemo } from 'react';
import { FileText, Plus, X, Image, Mic, MessageSquare, Sparkles } from 'lucide-react';
import { useEntity } from '../hooks/useEntity';
import { storage } from '../services/storage';
import { AIService } from '../services/ai';
import type { EvidenceItem, EvidenceType } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

export const Evidence: React.FC = () => {
    const { items: evidence, add: addEvidence, remove: removeEvidence } = useEntity<EvidenceItem>('evidence');

    const [showForm, setShowForm] = useState(false);
    const [note, setNote] = useState('');
    const [type, setType] = useState<EvidenceType>('note');
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!note) return;

        setUploading(true);
        let fileUrl = undefined;

        if (file && type !== 'note') {
            const url = await storage.uploadFile(file, 'evidence', 'evidence');
            if (url) fileUrl = url;
        }

        addEvidence({
            type,
            notes: note,
            fileId: fileUrl,
            createdAt: new Date().toISOString(),
            importedAt: new Date().toISOString()
        });

        setUploading(false);
        setShowForm(false);
        setNote('');
        setType('note');
        setFile(null);
    };

    const sortedEvidence = useMemo(() =>
        [...evidence].sort((a, b) => new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime()),
        [evidence]
    );

    const getIcon = (type: EvidenceType) => {
        switch (type) {
            case 'photo': return <Image size={20} />;
            case 'audio_file': return <Mic size={20} />;
            case 'chat_export': return <MessageSquare size={20} />;
            default: return <FileText size={20} />;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen bg-white p-6 space-y-4"
        >
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-[#00082D]">Evidence Log</h2>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowForm(true)}
                    className="px-4 py-2 bg-[#1A66FF] text-white rounded-full font-semibold text-sm flex items-center gap-2"
                >
                    <Plus size={18} /> Add
                </motion.button>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border border-[#EFEFEF] rounded-2xl p-4 bg-white border-l-4 border-l-[#1A66FF] overflow-hidden"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-[#00082D]">New Entry</h3>
                            <button onClick={() => setShowForm(false)}><X size={20} className="text-[#202020] opacity-70" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div className="input-group">
                                <label className="input-label">Type</label>
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {(['note', 'photo', 'chat_export', 'audio_file'] as EvidenceType[]).map(t => (
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            key={t}
                                            type="button"
                                            onClick={() => setType(t)}
                                            className={`btn text-xs capitalize whitespace-nowrap ${type === t ? 'btn-primary' : 'btn-secondary'}`}
                                        >
                                            {t.replace(/_/g, ' ')}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {type !== 'note' && (
                                <div className="input-group">
                                    <label className="input-label">Attachment</label>
                                    <input
                                        type="file"
                                        className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    />
                                    {uploading && <p className="text-xs text-indigo-500 mt-1 animate-pulse">Uploading...</p>}
                                </div>
                            )}

                            <div className="input-group">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="input-label mb-0">Note / Description</label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                if (!note) return;
                                                const tone = await AIService.analyzeTone(note);
                                                if (tone) setNote(prev => `${prev}\n\n[AI Tone: ${tone}]`);
                                            }}
                                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                                        >
                                            <Sparkles size={12} /> Analyze Tone
                                        </button>
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                if (!note) return;
                                                const summary = await AIService.summarizeText(note);
                                                if (summary) setNote(prev => `${prev}\n\n[AI Summary: ${summary}]`);
                                            }}
                                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                                        >
                                            <FileText size={12} /> Summarize
                                        </button>
                                    </div>
                                </div>
                                <textarea
                                    className="input-field"
                                    rows={3}
                                    placeholder="Details..."
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                    required
                                />
                            </div>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                type="submit"
                                disabled={uploading}
                                className="w-full bg-[#1A66FF] text-white py-4 px-6 rounded-full font-semibold disabled:opacity-50"
                            >
                                {uploading ? 'Uploading...' : 'Save Entry'}
                            </motion.button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="space-y-3">
                {sortedEvidence.length === 0 ? (
                    <p className="text-sm text-muted text-center py-4">No evidence logged yet.</p>
                ) : (
                    <AnimatePresence>
                        {sortedEvidence.map(item => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="border border-[#EFEFEF] rounded-xl p-4 flex gap-3 bg-white"
                            >
                                <div className="w-10 h-10 rounded-full bg-[#1A66FF1A] flex items-center justify-center text-[#1A66FF] border border-[#1A66FF33] shrink-0">
                                    {getIcon(item.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <span className="text-xs font-bold uppercase text-muted tracking-wider">{item.type.replace(/_/g, ' ')}</span>
                                        <button onClick={() => removeEvidence(item.id)} className="text-muted hover:text-red-500">
                                            <X size={14} />
                                        </button>
                                    </div>
                                    <p className="text-sm mt-1">{item.notes}</p>
                                    <p className="text-xs text-muted mt-2">{new Date(item.importedAt).toLocaleString()}</p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </motion.div>
    );
};
