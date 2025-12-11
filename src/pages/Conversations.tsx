import React, { useState, useMemo } from 'react';
import { MessageSquare, Plus, X, Phone, Mail, Send, Image as ImageIcon, Upload, Eye, Sparkles, Zap } from 'lucide-react';
import { useEntity } from '../hooks/useEntity';
import { storage } from '../services/storage';
import { AIService } from '../services/ai';
import type { ConversationLog, ChannelType, MessageDirection } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { HapticFeedback } from '../utils/ios';

export const Conversations: React.FC = () => {
    const { items: conversations, add: addConversation, remove: removeConversation } = useEntity<ConversationLog>('conversations');

    const [showForm, setShowForm] = useState(false);
    const [counterpartyName, setCounterpartyName] = useState('');
    const [channel, setChannel] = useState<ChannelType>('sms_share_extension');
    const [messageCount, setMessageCount] = useState<number>(1);
    const [direction, setDirection] = useState<MessageDirection>('mixed');
    const [summaryText, setSummaryText] = useState('');
    const [screenshots, setScreenshots] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [viewingImage, setViewingImage] = useState<string | null>(null);
    const [analyzingAI, setAnalyzingAI] = useState(false);
    const [aiTone, setAiTone] = useState<string>('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!counterpartyName || !summaryText) {
            HapticFeedback.warning();
            return;
        }

        setUploading(true);
        const uploadedScreenshots: string[] = [];

        // Upload all screenshots
        if (screenshots.length > 0) {
            for (const file of screenshots) {
                const uploadedUrl = await storage.uploadFile(file, 'screenshots', 'screenshots');
                if (uploadedUrl) {
                    uploadedScreenshots.push(uploadedUrl);
                }
            }
        }

        HapticFeedback.success();

        addConversation({
            counterpartyName,
            channel,
            startTime: new Date().toISOString(),
            messageCount: messageCount || 1,
            direction,
            summaryText,
            evidenceItemIds: uploadedScreenshots.length > 0 ? uploadedScreenshots : undefined
        });

        // Reset form
        setShowForm(false);
        setCounterpartyName('');
        setSummaryText('');
        setMessageCount(1);
        setScreenshots([]);
        setUploading(false);
        setAiTone('');
    };

    const handleAnalyzeScreenshots = async () => {
        if (screenshots.length === 0) {
            HapticFeedback.warning();
            alert('Please upload screenshots first');
            return;
        }

        setAnalyzingAI(true);
        HapticFeedback.light();

        try {
            const analysis = await AIService.analyzeConversationScreenshots(screenshots);

            if (analysis) {
                HapticFeedback.success();

                // Build summary with key points
                let generatedSummary = analysis.summary;

                if (analysis.keyPoints && analysis.keyPoints.length > 0) {
                    generatedSummary += '\n\nKey Points:\n' + analysis.keyPoints.map(p => `• ${p}`).join('\n');
                }

                setSummaryText(generatedSummary);
                setAiTone(analysis.tone);

                // Auto-detect message count from screenshots
                if (screenshots.length > 0) {
                    setMessageCount(Math.max(screenshots.length, 1));
                }
            } else {
                HapticFeedback.error();
                alert('AI analysis failed. Please check your OpenAI API key in .env file.');
            }
        } catch (error) {
            HapticFeedback.error();
            console.error('AI analysis error:', error);
            alert('AI analysis failed. See console for details.');
        } finally {
            setAnalyzingAI(false);
        }
    };

    const sortedConversations = useMemo(() =>
        [...conversations].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()),
        [conversations]
    );

    const getChannelIcon = (channel: ChannelType) => {
        switch (channel) {
            case 'sms_share_extension':
                return <MessageSquare size={20} />;
            case 'whatsapp_share_extension':
                return <MessageSquare size={20} />;
            case 'email_forward':
                return <Mail size={20} />;
            case 'manual_note':
                return <Send size={20} />;
            default:
                return <MessageSquare size={20} />;
        }
    };

    const getChannelColor = (channel: ChannelType) => {
        switch (channel) {
            case 'sms_share_extension':
                return 'bg-blue-50 text-blue-600';
            case 'whatsapp_share_extension':
                return 'bg-green-50 text-green-600';
            case 'email_forward':
                return 'bg-purple-50 text-purple-600';
            case 'manual_note':
                return 'bg-gray-50 text-gray-600';
            default:
                return 'bg-indigo-50 text-indigo-600';
        }
    };

    const getDirectionBadge = (direction?: MessageDirection) => {
        if (!direction) return null;
        const colors = {
            incoming: 'bg-green-100 text-green-700',
            outgoing: 'bg-blue-100 text-blue-700',
            mixed: 'bg-gray-100 text-gray-700'
        };
        return (
            <span className={`px-2 py-0.5 text-xs rounded-full ${colors[direction]}`}>
                {direction}
            </span>
        );
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
                <div>
                    <h2 className="text-xl font-bold text-[#00082D]">Conversation Log</h2>
                    <p className="text-xs text-[#202020] opacity-70">Track communications with co-parent</p>
                </div>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        HapticFeedback.light();
                        setShowForm(true);
                    }}
                    className="px-4 py-2 bg-[#1A66FF] text-white rounded-full font-semibold text-sm flex items-center gap-2"
                >
                    <Plus size={18} /> Log
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
                            <h3 className="font-semibold text-[#00082D]">New Conversation</h3>
                            <button onClick={() => setShowForm(false)}>
                                <X size={20} className="text-[#202020] opacity-70" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div className="input-group">
                                <label className="input-label">Co-Parent Name</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="e.g., Sarah"
                                    value={counterpartyName}
                                    onChange={e => setCounterpartyName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Channel</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['sms_share_extension', 'whatsapp_share_extension', 'email_forward', 'manual_note'] as ChannelType[]).map(c => (
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            key={c}
                                            type="button"
                                            onClick={() => setChannel(c)}
                                            className={`btn text-xs capitalize ${channel === c ? 'btn-primary' : 'btn-secondary'}`}
                                        >
                                            {c.replace(/_/g, ' ').replace('share extension', '').replace('forward', '')}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            <div className="input-group">
                                <label className="input-label">Direction</label>
                                <div className="flex gap-2">
                                    {(['incoming', 'outgoing', 'mixed'] as MessageDirection[]).map(d => (
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            key={d}
                                            type="button"
                                            onClick={() => setDirection(d)}
                                            className={`btn btn-sm capitalize flex-1 ${direction === d ? 'btn-primary' : 'btn-secondary'}`}
                                        >
                                            {d}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            <div className="input-group">
                                <label className="input-label">Message Count</label>
                                <input
                                    type="number"
                                    min="1"
                                    className="input-field"
                                    placeholder="1"
                                    value={messageCount}
                                    onChange={e => setMessageCount(parseInt(e.target.value) || 1)}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label flex items-center gap-2">
                                    <ImageIcon size={16} />
                                    Conversation Screenshots (Optional)
                                </label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        id="screenshot-upload"
                                        onChange={(e) => {
                                            const files = Array.from(e.target.files || []);
                                            if (files.length > 0) {
                                                HapticFeedback.light();
                                                setScreenshots(prev => [...prev, ...files]);
                                            }
                                        }}
                                    />
                                    <label
                                        htmlFor="screenshot-upload"
                                        className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-[var(--color-border)] rounded-xl cursor-pointer hover:border-indigo-300 transition-colors bg-[var(--color-bg-glass)]"
                                    >
                                        <Upload size={20} className="text-muted" />
                                        <span className="text-sm text-muted">
                                            {screenshots.length > 0
                                                ? `${screenshots.length} screenshot(s) selected`
                                                : 'Tap to upload screenshots'}
                                        </span>
                                    </label>
                                </div>
                                {screenshots.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {screenshots.map((file, index) => (
                                            <div key={index} className="relative group">
                                                <img
                                                    src={URL.createObjectURL(file)}
                                                    alt={`Screenshot ${index + 1}`}
                                                    className="w-20 h-20 object-cover rounded-lg border border-[var(--color-border)]"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        HapticFeedback.light();
                                                        setScreenshots(prev => prev.filter((_, i) => i !== index));
                                                    }}
                                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {uploading && (
                                    <p className="text-xs text-indigo-500 mt-1 animate-pulse">Uploading screenshots...</p>
                                )}

                                {screenshots.length > 0 && !analyzingAI && (
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        type="button"
                                        onClick={handleAnalyzeScreenshots}
                                        className="mt-3 w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
                                    >
                                        <Sparkles size={20} />
                                        Generate Summary with AI
                                        <Zap size={16} />
                                    </motion.button>
                                )}

                                {analyzingAI && (
                                    <div className="mt-3 p-4 bg-purple-50 border border-purple-200 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="animate-spin">
                                                <Sparkles size={20} className="text-purple-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-purple-900">AI is analyzing your screenshots...</p>
                                                <p className="text-xs text-purple-600">Reading messages and generating summary</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="input-group">
                                <label className="input-label flex items-center justify-between">
                                    <span>Summary / Key Points</span>
                                    {aiTone && (
                                        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full flex items-center gap-1">
                                            <Sparkles size={12} />
                                            Tone: {aiTone}
                                        </span>
                                    )}
                                </label>
                                <textarea
                                    className="input-field"
                                    rows={6}
                                    placeholder="Upload screenshots and click 'Generate Summary with AI' or write manually..."
                                    value={summaryText}
                                    onChange={e => setSummaryText(e.target.value)}
                                    required
                                />
                                <p className="text-xs text-muted mt-1">
                                    {screenshots.length > 0
                                        ? '✨ Upload screenshots and use AI to auto-generate summary'
                                        : 'Include: topic, agreements, tone, any conflicts or concerns'}
                                </p>
                            </div>

                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                type="submit"
                                disabled={uploading}
                                className="w-full bg-[#1A66FF] text-white py-4 px-6 rounded-full font-semibold disabled:opacity-50"
                            >
                                {uploading ? 'Uploading...' : 'Save Conversation'}
                            </motion.button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="space-y-3">
                {sortedConversations.length === 0 ? (
                    <div className="text-center py-12">
                        <MessageSquare size={48} className="mx-auto text-muted opacity-30 mb-3" />
                        <p className="text-muted">No conversations logged yet.</p>
                        <p className="text-xs text-muted mt-1">Keep track of all communications for your records.</p>
                    </div>
                ) : (
                    <AnimatePresence>
                        {sortedConversations.map(convo => (
                            <motion.div
                                key={convo.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="border border-[#EFEFEF] rounded-xl p-4 bg-white"
                            >
                                <div className="flex gap-3">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${getChannelColor(convo.channel)}`}>
                                        {getChannelIcon(convo.channel)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <div>
                                                <h4 className="font-bold text-sm">{convo.counterpartyName}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-muted capitalize">
                                                        {convo.channel.replace(/_/g, ' ').replace('share extension', '').replace('forward', '')}
                                                    </span>
                                                    {getDirectionBadge(convo.direction)}
                                                    {convo.messageCount && (
                                                        <span className="text-xs text-muted">
                                                            • {convo.messageCount} msg{convo.messageCount > 1 ? 's' : ''}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    HapticFeedback.light();
                                                    removeConversation(convo.id);
                                                }}
                                                className="text-muted hover:text-red-500"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>

                                        <p className="text-sm mt-2 leading-relaxed">{convo.summaryText}</p>

                                        {/* Screenshots Preview */}
                                        {convo.evidenceItemIds && convo.evidenceItemIds.length > 0 && (
                                            <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                                                {convo.evidenceItemIds.map((imageUrl, idx) => (
                                                    <motion.button
                                                        key={idx}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => {
                                                            HapticFeedback.light();
                                                            setViewingImage(imageUrl);
                                                        }}
                                                        className="relative flex-shrink-0 group"
                                                    >
                                                        <img
                                                            src={imageUrl}
                                                            alt={`Screenshot ${idx + 1}`}
                                                            className="w-16 h-16 object-cover rounded-lg border-2 border-indigo-200"
                                                        />
                                                        <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Eye size={20} className="text-white" />
                                                        </div>
                                                    </motion.button>
                                                ))}
                                                <div className="flex items-center px-2 text-xs text-indigo-600 font-medium whitespace-nowrap">
                                                    {convo.evidenceItemIds.length} screenshot{convo.evidenceItemIds.length > 1 ? 's' : ''}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 mt-3 text-xs text-muted">
                                            <Phone size={12} />
                                            <span>{format(new Date(convo.startTime), 'PPp')}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {/* Quick Tips */}
            {conversations.length === 0 && (
                <div className="card p-4 bg-blue-50 border-blue-200">
                    <h4 className="font-semibold text-sm mb-2 text-blue-900">💡 Documentation Tips</h4>
                    <ul className="text-xs text-blue-800 space-y-1">
                        <li>• Log all significant communications immediately</li>
                        <li>• Upload screenshots for evidence</li>
                        <li>• Include date, time, and method of contact</li>
                        <li>• Summarize key points, agreements, or conflicts</li>
                        <li>• Note tone and any concerning behavior</li>
                        <li>• Keep entries factual and objective</li>
                    </ul>
                </div>
            )}

            {/* Image Viewer Modal */}
            <AnimatePresence>
                {viewingImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                        onClick={() => setViewingImage(null)}
                    >
                        <motion.button
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            onClick={() => setViewingImage(null)}
                            className="absolute top-4 right-4 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
                        >
                            <X size={24} />
                        </motion.button>
                        <motion.img
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            src={viewingImage}
                            alt="Screenshot"
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
