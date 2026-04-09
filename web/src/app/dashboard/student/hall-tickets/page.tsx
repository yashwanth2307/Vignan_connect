'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Printer, Ticket, Calendar, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '@/lib/api';

export default function StudentHallTicketsPage() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewTicket, setViewTicket] = useState<any>(null);

    useEffect(() => {
        (async () => {
            try {
                const req = await api.get<any[]>('/exam/hall-tickets/my');
                setTickets(req);
            } catch (e) { console.error(e); }
            setLoading(false);
        })();
    }, []);

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">My Hall Tickets</h2>
                <p className="text-[hsl(var(--muted-foreground))]">Download and print your examination hall tickets</p>
            </div>

            {tickets.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-[hsl(var(--muted-foreground))]">
                        <Ticket className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        No hall tickets have been generated for you yet.
                    </CardContent>
                </Card>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {tickets.map((t, i) => (
                        <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                            <Card className="hover:shadow-lg transition-all border-blue-100 dark:border-blue-900 border-2 overflow-hidden relative">
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg">Semester {t.semester?.number}</p>
                                            <p className="text-xs text-[hsl(var(--muted-foreground))]">Regulation {t.semester?.regulation?.code}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm flex items-center gap-2 mb-6">
                                        <Calendar className="w-4 h-4" /> Generated {new Date(t.createdAt).toLocaleDateString()}
                                    </p>
                                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setViewTicket(t)}>
                                        View & Print Hall Ticket
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Hall Ticket View Dialog */}
            <Dialog open={!!viewTicket} onOpenChange={(open) => !open && setViewTicket(null)}>
                <DialogContent className="max-w-4xl bg-white text-black p-0 overflow-hidden">
                    <DialogHeader className="p-4 border-b bg-gray-50 flex flex-row items-center justify-between no-print">
                        <DialogTitle className="text-gray-900">Digital Hall Ticket</DialogTitle>
                        <Button variant="outline" size="sm" onClick={handlePrint} className="no-print border-blue-200 text-blue-700 hover:bg-blue-50">
                            <Printer className="w-4 h-4 mr-2" /> Print
                        </Button>
                    </DialogHeader>

                    {/* Printable Area - strictly styled for printing */}
                    <div className="p-8 print-section bg-white" id="printable-hall-ticket">
                        {/* Header Area */}
                        <div className="flex items-center justify-between border-b-2 border-gray-800 pb-4 mb-6">
                            <img src="/images/logo.png" alt="Vignan Logo" className="w-24 h-24 object-contain" />
                            <div className="text-center flex-1">
                                <h1 className="text-2xl font-bold uppercase tracking-wide text-gray-900">Vignan Institute of Technology and Science</h1>
                                <p className="text-sm font-semibold text-gray-700 mt-1">(An Autonomous Institution)</p>
                                <p className="text-xs text-gray-600 mt-1">Deshmukhi (V), Pochampally (M), Yadadri Bhuvanagiri Dist., Telangana</p>
                                <div className="inline-block bg-gray-800 text-white px-4 py-1 rounded mt-3 font-semibold tracking-widest text-sm uppercase">
                                    HALL TICKET
                                </div>
                            </div>
                            {/* Student Photo Placeholder */}
                            <div className="w-24 h-32 border-2 border-gray-300 flex items-center justify-center bg-gray-50 rounded text-[10px] text-gray-400">
                                {viewTicket?.student?.photoUrl ? (
                                    <img src={viewTicket.student.photoUrl} alt="Student" className="w-full h-full object-cover" />
                                ) : (
                                    "Attach Photo"
                                )}
                            </div>
                        </div>

                        {/* Student Details Grid */}
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-8 text-sm">
                            <div className="flex"><span className="font-bold w-32">Roll Number:</span> <span className="uppercase font-mono font-bold text-gray-900">{viewTicket?.student?.rollNo}</span></div>
                            <div className="flex"><span className="font-bold w-32">Course / Branch:</span> <span className="uppercase text-gray-900">B.Tech / {viewTicket?.student?.department?.code}</span></div>
                            <div className="flex"><span className="font-bold w-32">Student Name:</span> <span className="uppercase font-semibold text-gray-900">{viewTicket?.student?.user?.name}</span></div>
                            <div className="flex"><span className="font-bold w-32">Semester:</span> <span className="uppercase text-gray-900">{viewTicket?.semester?.number}</span></div>
                            <div className="flex"><span className="font-bold w-32">Father Name:</span> <span className="uppercase text-gray-900">{viewTicket?.student?.fatherName || '________________'}</span></div>
                            <div className="flex"><span className="font-bold w-32">Regulation:</span> <span className="uppercase text-gray-900">{viewTicket?.semester?.regulation?.code}</span></div>
                        </div>

                        {/* Subjects Table */}
                        <div className="mb-12">
                            <h3 className="font-bold mb-2 text-gray-800">Subjects Appearing:</h3>
                            <table className="w-full border-collapse border border-gray-300 text-sm">
                                <thead>
                                    <tr className="bg-gray-100 border-b border-gray-300">
                                        <th className="border border-gray-300 px-3 py-2 text-left">S.No</th>
                                        <th className="border border-gray-300 px-3 py-2 text-left">Subject Code</th>
                                        <th className="border border-gray-300 px-3 py-2 text-left">Subject Name</th>
                                        <th className="border border-gray-300 px-3 py-2 text-center">Date & Session</th>
                                        <th className="border border-gray-300 px-3 py-2 text-center w-32">Invigilator Sign</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Usually we fetch exam sessions mapped to these subjects, for now we leave blank/generate static slots */}
                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                        <tr key={i} className="border-b border-gray-200">
                                            <td className="border border-gray-300 px-3 py-3 text-center">{i}</td>
                                            <td className="border border-gray-300 px-3 py-3"></td>
                                            <td className="border border-gray-300 px-3 py-3"></td>
                                            <td className="border border-gray-300 px-3 py-3"></td>
                                            <td className="border border-gray-300 px-3 py-3"></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Signatures Area */}
                        <div className="flex justify-between items-end mt-16 px-4">
                            <div className="text-center">
                                <div className="border-t border-gray-800 w-40 pt-2 font-semibold text-xs">Signature of Student</div>
                            </div>
                            <div className="flex gap-16">
                                <div className="text-center">
                                    <div className="w-32 h-16 bg-[url('/images/digital-sign-ce.png')] bg-contain bg-no-repeat bg-center mb-1"></div>
                                    <div className="border-t border-gray-800 w-40 pt-2 font-semibold text-xs text-gray-800">Controller of Examinations</div>
                                </div>
                                <div className="text-center">
                                    <div className="w-32 h-16 bg-[url('/images/digital-sign-principal.png')] bg-contain bg-no-repeat bg-center mb-1"></div>
                                    <div className="border-t border-gray-800 w-40 pt-2 font-semibold text-xs text-gray-800">Principal</div>
                                </div>
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="mt-12 pt-4 border-t border-gray-300 text-[10px] text-gray-600">
                            <p className="font-bold mb-1">Important Instructions:</p>
                            <ol className="list-decimal pl-4 space-y-1">
                                <li>The candidate must carry this Hall Ticket along with valid College ID card to the examination hall.</li>
                                <li>Electronic devices, smartwatches, and programmable calculators are strictly prohibited.</li>
                                <li>Candidates must occupy their allotted seats 15 minutes before the commencement of the exam.</li>
                                <li>Malpractice of any kind will lead to strict disciplinary action as per college regulations.</li>
                            </ol>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    .no-print { display: none !important; }
                    body { visibility: hidden; }
                    .print-section { 
                        visibility: visible; 
                        position: absolute; 
                        left: 0; 
                        top: 0; 
                        width: 100%;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                }
            `}} />
        </div>
    );
}
