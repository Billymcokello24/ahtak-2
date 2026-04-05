import { useEffect, useState, type ComponentProps } from 'react';
import { useParams, Link } from 'react-router-dom';
import { members as membersApi, documents as documentsApi, type Member, type MemberDocument } from '../lib/api';

const DOC_TYPES = [
  { value: 'photo', label: 'Member Photo' },
  { value: 'other', label: 'Other' },
];

export default function MemberDetail() {
  const { id } = useParams<{ id: string }>();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approving, setApproving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState('photo');
  const [docFiles, setDocFiles] = useState<File[]>([]);
  const [fileInputKey, setFileInputKey] = useState(0);

  const loadMember = () => {
    if (!id) return;
    membersApi.get(Number(id)).then(setMember).catch((e) => setError(e.message));
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    membersApi
      .get(Number(id))
      .then(setMember)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleApprove = () => {
    if (!id) return;
    setApproving(true);
    membersApi
      .approve(Number(id))
      .then(setMember)
      .catch((e) => setError(e.message))
      .finally(() => setApproving(false));
  };

  const handleDownloadIdCard = () => {
    if (!id) return;
    membersApi.downloadIdCard(Number(id));
  };

  const handleUploadDoc: NonNullable<ComponentProps<'form'>['onSubmit']> = async (e) => {
    e.preventDefault();
    if (!id || docFiles.length === 0) return;
    setUploading(true);
    setError('');
    for (let i = 0; i < docFiles.length; i++) {
      const file = docFiles[i];
      const formData = new FormData();
      formData.append('member', id);
      formData.append('document_type', docType);
      formData.append('file', file);
      try {
        await documentsApi.create(formData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
        break;
      }
    }
    loadMember();
    setDocFiles([]);
    setFileInputKey((k) => k + 1);
    setUploading(false);
  };

  if (!id) return <div className="text-red-600">Invalid member route.</div>;
  if (loading) return <div className="text-slate-500">Loading…</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!member) return <div className="text-slate-500">Member details are not available for this record.</div>;

  const docs = (member.documents as MemberDocument[] | undefined) || [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <Link to="/dashboard/members" className="text-sm text-emerald-600 hover:text-emerald-700 mb-2 inline-block">
            ← Back to members
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">
            {member.first_name} {member.last_name}
          </h1>
          <p className="text-slate-500 font-mono text-sm">{member.member_number}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={
              'inline-flex px-3 py-1 rounded-full text-sm font-medium ' +
              (member.status === 'active'
                ? 'bg-emerald-100 text-emerald-800'
                : member.status === 'pending'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-slate-100 text-slate-700')
            }
          >
            {member.status}
          </span>
          {member.status === 'pending' && (
            <button
              onClick={handleApprove}
              disabled={approving}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {approving ? 'Approving…' : 'Approve member'}
            </button>
          )}
          {(member.status === 'active' || member.status === 'pending_renewal') && (
            <button
              onClick={handleDownloadIdCard}
              className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Download ID card (PDF)
            </button>
          )}
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
        <div className="p-6 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Email</p>
            <p className="text-slate-800">{member.email}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Phone</p>
            <p className="text-slate-800">{member.phone}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">KVB number</p>
            <p className="text-slate-800">{String((member as any).kvb_number ?? '—')}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Membership expiry</p>
            <p className="text-slate-800">
              {member.membership_expiry ? new Date(member.membership_expiry).toLocaleDateString() : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Date joined</p>
            <p className="text-slate-800">
              {member.date_joined ? new Date(member.date_joined as string).toLocaleDateString() : '—'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <h2 className="px-6 py-3 border-b border-slate-200 font-semibold text-slate-800">Documents</h2>
        <form onSubmit={handleUploadDoc} className="p-6 border-b border-slate-100 space-y-4">
          <p className="text-sm text-slate-500">Add one or more documents. You can select multiple files at once.</p>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Document type</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                {DOC_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">File(s)</label>
              <input
                key={fileInputKey}
                type="file"
                multiple
                onChange={(e) => setDocFiles(Array.from(e.target.files || []))}
                className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-emerald-50 file:text-emerald-700 file:text-sm file:font-medium hover:file:bg-emerald-100"
              />
            </div>
            <button
              type="submit"
              disabled={uploading || docFiles.length === 0}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm font-medium"
            >
              {uploading ? 'Uploading…' : `Upload ${docFiles.length > 0 ? `(${docFiles.length})` : ''}`}
            </button>
          </div>
          {docFiles.length > 0 && (
            <p className="text-xs text-slate-500">
              {docFiles.length} file{docFiles.length !== 1 ? 's' : ''} selected. All will be uploaded as {DOC_TYPES.find((t) => t.value === docType)?.label}.
            </p>
          )}
        </form>
        <ul className="divide-y divide-slate-100">
          {docs.map((d) => (
            <li key={d.id} className="px-6 py-2 flex items-center justify-between">
              <span className="text-sm">{DOC_TYPES.find((t) => t.value === d.document_type)?.label || d.document_type}</span>
              <a href={d.file} target="_blank" rel="noopener noreferrer" className="text-emerald-600 text-sm">View</a>
            </li>
          ))}
          {docs.length === 0 && <li className="px-6 py-4 text-slate-500 text-sm">No documents uploaded yet.</li>}
        </ul>
      </div>
    </div>
  );
}
