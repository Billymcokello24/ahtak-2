import { useEffect, useState } from 'react';
import { reports as reportsApi, type ReportItem } from '../lib/api';

export default function Reports() {
  const [list, setList] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
    setStartDate(firstDay);
    setEndDate(today);
    reportsApi
      .list()
      .then((r) => setList(r.reports || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const download = (r: ReportItem) => {
    const params = new URLSearchParams();
    if (startDate) params.set('start_date', startDate);
    if (endDate) params.set('end_date', endDate);
    const url = `${r.url}?${params.toString()}`;
    const ext = r.id.includes('excel') ? 'xlsx' : 'pdf';
    const filename = `${r.id}_${startDate}_${endDate}.${ext}`;
    reportsApi.download(url, filename);
  };

  if (loading) return <div className="text-slate-500">Loading…</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Reports</h1>
      <div className="flex flex-wrap gap-3 mb-6">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Start date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">End date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg"
          />
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Report</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {list.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">{r.name}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => download(r)}
                    className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                  >
                    Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <div className="p-8 text-center text-slate-500">No reports available.</div>}
      </div>
    </div>
  );
}
