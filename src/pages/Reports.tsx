import React, { useMemo } from 'react';
import { FileText, Download, TrendingUp, DollarSign, MapPin, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEntity } from '../hooks/useEntity';
import { ReportGenerator } from '../services/reportGenerator';
import type { Trip, Expense, EvidenceItem, ParentProfile, VisitSession } from '../types';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format, differenceInMinutes } from 'date-fns';
import { HapticFeedback } from '../utils/ios';

export const Reports: React.FC = () => {
    const { items: trips } = useEntity<Trip>('trips');
    const { items: expenses } = useEntity<Expense>('expenses');
    const { items: evidence } = useEntity<EvidenceItem>('evidence');
    const { items: profiles } = useEntity<ParentProfile>('parent_profile');
    const { items: visits } = useEntity<VisitSession>('visits');

    const parentName = profiles[0]?.fullName || 'Parent';

    // Calculate stats
    const stats = useMemo(() => {
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        const totalMileage = trips.reduce((sum, t) => sum + (t.distanceMiles || 0), 0);
        const totalVisitHours = visits.reduce((sum, v) => {
            if (!v.endTime) return sum;
            return sum + differenceInMinutes(new Date(v.endTime), new Date(v.startTime)) / 60;
        }, 0);

        return {
            totalExpenses,
            totalMileage,
            totalVisitHours,
            totalEvidence: evidence.length
        };
    }, [expenses, trips, visits, evidence]);

    // Expense category data for pie chart
    const expenseByCategory = useMemo(() => {
        const categoryTotals: Record<string, number> = {};
        expenses.forEach(e => {
            categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
        });

        return Object.entries(categoryTotals).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value: parseFloat(value.toFixed(2))
        }));
    }, [expenses]);

    // Weekly visit hours (last 4 weeks)
    const weeklyVisitData = useMemo(() => {
        const now = new Date();
        const weeks = [];

        for (let i = 3; i >= 0; i--) {
            const weekStart = new Date(now);
            weekStart.setDate(weekStart.getDate() - (i * 7 + 7));
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 7);

            const weekVisits = visits.filter(v => {
                const startDate = new Date(v.startTime);
                return v.endTime && startDate >= weekStart && startDate < weekEnd;
            });

            const hours = weekVisits.reduce((sum, v) => {
                return sum + differenceInMinutes(new Date(v.endTime!), new Date(v.startTime)) / 60;
            }, 0);

            weeks.push({
                week: format(weekStart, 'MMM d'),
                hours: parseFloat(hours.toFixed(1))
            });
        }

        return weeks;
    }, [visits]);

    const COLORS = ['#1A66FF', '#F79C21', '#10B981', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

    const reports = [
        { id: 'time', title: 'Time Share Report', desc: 'Monthly breakdown of custody time' },
        { id: 'mileage', title: 'Mileage Log', desc: 'Trips and distance for reimbursement' },
        { id: 'expenses', title: 'Expense Report', desc: 'Categorized expenses with receipts' },
        { id: 'evidence', title: 'Evidence Archive', desc: 'Full export of notes and media' },
    ];

    const handleGenerate = (id: string) => {
        HapticFeedback.light();

        switch (id) {
            case 'mileage':
                ReportGenerator.generateMileageReport(trips, parentName);
                break;
            case 'expenses':
                ReportGenerator.generateExpenseReport(expenses, parentName);
                break;
            case 'evidence':
                ReportGenerator.generateEvidenceReport(evidence, parentName);
                break;
            case 'time':
                ReportGenerator.generateTimeShareReport(parentName);
                break;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen bg-white p-6 space-y-6"
        >
            <h2 className="text-xl font-bold text-[#00082D]">Reports & Analytics</h2>
            <p className="text-[#202020] opacity-70 text-sm">Visualize your data and generate PDF reports</p>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-[#EFEFEF] rounded-2xl p-4 bg-[#1A66FF1A]"
                >
                    <div className="flex items-center justify-between mb-2">
                        <Clock size={20} className="text-[#1A66FF]" />
                        <span className="text-xs text-[#1A66FF] font-semibold">HOURS</span>
                    </div>
                    <p className="text-2xl font-bold text-[#00082D]">{stats.totalVisitHours.toFixed(1)}</p>
                    <p className="text-xs text-[#1A66FF]">Total Visit Time</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="card p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-100"
                >
                    <div className="flex items-center justify-between mb-2">
                        <DollarSign size={20} className="text-green-600" />
                        <span className="text-xs text-green-600 font-semibold">EXPENSES</span>
                    </div>
                    <p className="text-2xl font-bold text-green-900">${stats.totalExpenses.toFixed(0)}</p>
                    <p className="text-xs text-green-600">{expenses.length} transactions</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="card p-4 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100"
                >
                    <div className="flex items-center justify-between mb-2">
                        <MapPin size={20} className="text-orange-600" />
                        <span className="text-xs text-orange-600 font-semibold">MILES</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-900">{stats.totalMileage.toFixed(0)}</p>
                    <p className="text-xs text-orange-600">{trips.length} trips logged</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="card p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100"
                >
                    <div className="flex items-center justify-between mb-2">
                        <FileText size={20} className="text-purple-600" />
                        <span className="text-xs text-purple-600 font-semibold">EVIDENCE</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-900">{stats.totalEvidence}</p>
                    <p className="text-xs text-purple-600">Items documented</p>
                </motion.div>
            </div>

            {/* Weekly Visit Hours Chart */}
            {weeklyVisitData.some(w => w.hours > 0) && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="border border-[#EFEFEF] rounded-2xl p-4 bg-white"
                >
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-[#00082D]">
                        <TrendingUp size={18} className="text-[#1A66FF]" />
                        Weekly Visit Hours (Last 4 Weeks)
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={weeklyVisitData}>
                            <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Bar dataKey="hours" fill="#1A66FF" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>
            )}

            {/* Expense Breakdown Pie Chart */}
            {expenseByCategory.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="card p-4"
                >
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <DollarSign size={18} className="text-green-500" />
                        Expenses by Category
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={expenseByCategory}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {expenseByCategory.map((_entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </motion.div>
            )}

            {/* PDF Reports */}
            <h3 className="font-semibold text-sm mt-4 mb-2">Download PDF Reports</h3>
            <div className="grid gap-3">
                {reports.map((report, index) => (
                    <motion.div
                        key={report.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="card p-4 flex justify-between items-center"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                <FileText size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold">{report.title}</h3>
                                <p className="text-xs text-muted">{report.desc}</p>
                            </div>
                        </div>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleGenerate(report.id)}
                            className="btn btn-secondary p-2"
                        >
                            <Download size={20} />
                        </motion.button>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};
