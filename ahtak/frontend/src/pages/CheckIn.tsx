import { useState } from 'react';
import { events as eventsApi } from '../lib/api';

export default function CheckIn() {
  const [ticketNumber, setTicketNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = ticketNumber.trim().toUpperCase();
    if (!t) return;
    setLoading(true);
    setResult(null);
    setError('');
    eventsApi
      .checkIn(t)
      .then(() => {
        setResult(`✓ Check-in successful for ticket ${t}`);
        setTicketNumber('');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Event Check-In</h1>
      <p className="text-slate-600 mb-4">Enter ticket number or scan QR code</p>
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 max-w-md">
        <input
          type="text"
          value={ticketNumber}
          onChange={(e) => setTicketNumber(e.target.value)}
          placeholder="TKT-00000001"
          className="flex-1 min-w-[200px] px-4 py-3 border border-slate-300 rounded-lg text-lg font-mono"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium"
        >
          {loading ? 'Checking in…' : 'Check in'}
        </button>
      </form>
      {result && <div className="mt-4 p-3 bg-emerald-50 text-emerald-800 rounded-lg">{result}</div>}
      {error && <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg">{error}</div>}
    </div>
  );
}
