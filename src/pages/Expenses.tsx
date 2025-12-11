import React, { useState, useMemo } from 'react';
import { DollarSign, Plus, X, Camera, Upload, Trash2 } from 'lucide-react';
import { useEntity } from '../hooks/useEntity';
import { storage } from '../services/storage';
import type { Expense, Child, ExpenseCategory } from '../types';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { HapticFeedback } from '../utils/ios';
import { springConfig } from '../lib/animations';

/**
 * SwipeableExpenseCard Component
 *
 * Displays an expense with swipe-to-delete functionality
 */
const SwipeableExpenseCard: React.FC<{
    expense: Expense;
    onDelete: () => void;
}> = ({ expense, onDelete }) => {
    const x = useMotionValue(0);
    const [isDeleting, setIsDeleting] = useState(false);

    // Transform for delete icon opacity
    const deleteOpacity = useTransform(x, [-100, -50, 0], [1, 0.5, 0]);
    const deleteScale = useTransform(x, [-100, 0], [1, 0.8]);

    const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const threshold = -100;

        // If swiped left past threshold, delete
        if (info.offset.x < threshold) {
            HapticFeedback.heavy();
            setIsDeleting(true);
            // Animate out then delete
            setTimeout(() => {
                onDelete();
            }, 300);
        } else {
            // Snap back
            x.set(0);
        }
    };

    return (
        <div className="relative overflow-hidden rounded-xl">
            {/* Delete background */}
            <motion.div
                className="absolute inset-0 bg-[#F14040] flex items-center justify-end px-6 rounded-xl"
                style={{ opacity: deleteOpacity }}
            >
                <motion.div style={{ scale: deleteScale }}>
                    <Trash2 size={24} className="text-white" />
                </motion.div>
            </motion.div>

            {/* Swipeable card */}
            <motion.div
                drag="x"
                dragConstraints={{ left: -120, right: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                style={{ x }}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={isDeleting ? { opacity: 0, x: -300, scale: 0.8 } : { opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={springConfig.smooth}
                className="border border-[#EFEFEF] rounded-xl p-4 flex justify-between items-center bg-white cursor-grab active:cursor-grabbing"
            >
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#10B981]/10 flex items-center justify-center text-[#10B981] font-bold">
                        <DollarSign size={22} />
                    </div>
                    <div>
                        <p className="font-semibold text-[#00082D]">{expense.merchantName}</p>
                        <p className="text-xs text-[#202020] opacity-70 capitalize">
                            {expense.category} • {new Date(expense.date).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <span className="font-bold text-lg block text-[#00082D]">
                            ${expense.amount.toFixed(2)}
                        </span>
                        {expense.receiptImageId && (
                            <span className="text-xs text-[#10B981] flex items-center gap-1">
                                <Camera size={10} /> Receipt
                            </span>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export const Expenses: React.FC = () => {
    const { items: expenses, add: addExpense, remove: removeExpense } = useEntity<Expense>('expenses');
    const { items: children } = useEntity<Child>('children');

    const [showForm, setShowForm] = useState(false);
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState<ExpenseCategory>('food');
    const [merchant, setMerchant] = useState('');
    const [selectedChildId, setSelectedChildId] = useState('');
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !merchant) {
            HapticFeedback.warning();
            return;
        }

        setUploading(true);
        let receiptImageId = undefined;

        // Upload receipt if provided
        if (receiptFile) {
            const uploadedUrl = await storage.uploadFile(receiptFile, 'receipts', 'receipts');
            if (uploadedUrl) {
                receiptImageId = uploadedUrl;
            }
        }

        HapticFeedback.success();

        addExpense({
            parentId: 'current-user', // Mock user ID
            amount: parseFloat(amount),
            category,
            merchantName: merchant,
            date: new Date().toISOString(),
            childId: selectedChildId || undefined,
            reimbursementStatus: 'not_requested',
            receiptImageId
        });

        setShowForm(false);
        setAmount('');
        setMerchant('');
        setReceiptFile(null);
        setUploading(false);
    };

    const sortedExpenses = useMemo(() =>
        [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        [expenses]
    );

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen bg-white p-6 space-y-4"
        >
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-[#00082D]">Expenses</h2>
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
                            <h3 className="font-semibold text-[#00082D]">New Expense</h3>
                            <button onClick={() => setShowForm(false)}><X size={20} className="text-[#202020] opacity-70" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div className="input-group">
                                <label className="input-label text-sm font-semibold text-[#00082D]">Amount ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="input-field text-lg font-bold"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label text-sm font-semibold text-[#00082D]">Merchant / Description</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="e.g. McDonald's"
                                    value={merchant}
                                    onChange={e => setMerchant(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label text-sm font-semibold text-[#00082D]">Category</label>
                                <select
                                    className="input-field"
                                    value={category}
                                    onChange={e => setCategory(e.target.value as ExpenseCategory)}
                                >
                                    <option value="food">Food</option>
                                    <option value="medical">Medical</option>
                                    <option value="school">School</option>
                                    <option value="clothing">Clothing</option>
                                    <option value="entertainment">Entertainment</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-label text-sm font-semibold text-[#00082D]">Child (Optional)</label>
                                <select
                                    className="input-field"
                                    value={selectedChildId}
                                    onChange={e => setSelectedChildId(e.target.value)}
                                >
                                    <option value="">All / Shared</option>
                                    {children.map(c => (
                                        <option key={c.id} value={c.id}>{c.fullName}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-label text-sm font-semibold text-[#00082D] flex items-center gap-2">
                                    <Camera size={16} />
                                    Receipt Image (Optional)
                                </label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept="image/*,application/pdf"
                                        className="hidden"
                                        id="receipt-upload"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                HapticFeedback.light();
                                                setReceiptFile(file);
                                            }
                                        }}
                                    />
                                    <label
                                        htmlFor="receipt-upload"
                                        className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-[#EFEFEF] rounded-xl cursor-pointer hover:border-[#1A66FF] transition-colors bg-[#FAFAFA]"
                                    >
                                        {receiptFile ? (
                                            <>
                                                <Camera size={20} className="text-[#10B981]" />
                                                <span className="text-sm font-medium text-[#10B981]">{receiptFile.name}</span>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setReceiptFile(null);
                                                    }}
                                                    className="ml-auto text-[#F14040]"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={20} className="text-[#202020] opacity-70" />
                                                <span className="text-sm text-[#202020] opacity-70">Tap to upload receipt</span>
                                            </>
                                        )}
                                    </label>
                                </div>
                                {uploading && (
                                    <p className="text-xs text-[#1A66FF] mt-1 animate-pulse">Uploading receipt...</p>
                                )}
                            </div>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                type="submit"
                                disabled={uploading}
                                className="w-full bg-[#1A66FF] text-white py-4 px-6 rounded-full font-semibold disabled:opacity-50"
                            >
                                {uploading ? 'Uploading...' : 'Save Expense'}
                            </motion.button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="space-y-3">
                {sortedExpenses.length === 0 ? (
                    <p className="text-center text-[#202020] opacity-70 py-8">No expenses recorded.</p>
                ) : (
                    <AnimatePresence>
                        {sortedExpenses.map(expense => (
                            <SwipeableExpenseCard
                                key={expense.id}
                                expense={expense}
                                onDelete={() => removeExpense(expense.id)}
                            />
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </motion.div>
    );
};
