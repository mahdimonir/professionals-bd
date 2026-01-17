'use client';

import { BookingService } from '@/lib/services/booking-service';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface TimeSlotPickerProps {
    professionalId: string;
    date: string;
    selectedTime: string;
    onSelect: (time: string) => void;
}

export function TimeSlotPicker({ professionalId, date, selectedTime, onSelect }: TimeSlotPickerProps) {
    const [slots, setSlots] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchSlots() {
            if (!date) {
                setSlots([]);
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const res = await BookingService.getAvailability(professionalId, date);
                if (res.success) {
                    setSlots(res.data);
                } else {
                    setError("Could not load slots");
                }
            } catch (err) {
                console.error(err);
                setError("Failed to fetch slots");
            } finally {
                setLoading(false);
            }
        }

        fetchSlots();
    }, [professionalId, date]);

    if (!date) {
        return <p className="text-xs text-slate-400 italic">Please select a date first.</p>;
    }

    if (loading) {
        return (
            <div className="flex justify-center p-4">
                <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center gap-2 text-red-500 text-xs p-2 bg-red-50 dark:bg-red-900/10 rounded-lg">
                <AlertCircle className="w-4 h-4" /> {error}
            </div>
        );
    }

    if (slots.length === 0) {
        return (
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-500">No available slots for this date.</p>
            </div>
        );
    }

    // Helper to format ISO DateTime to Local 12h AM/PM
    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    return (
        <div className="grid grid-cols-3 gap-2">
            {slots.map(time => (
                <button 
                    key={time}
                    onClick={() => onSelect(time)}
                    className={`py-2 rounded-lg border-2 font-bold text-[10px] transition-all ${
                        selectedTime === time 
                        ? 'bg-primary-600 border-primary-600 text-white shadow-md' 
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-500 hover:border-primary-500'
                    }`}
                >
                    {formatTime(time)}
                </button>
            ))}
        </div>
    );
}
