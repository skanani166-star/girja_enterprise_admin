'use client';
import { useEffect, useState } from 'react';
import { Clock, CheckCircle2, MessageSquare, Phone, Mail, Building2, Trash2, Eye, X } from 'lucide-react';

export default function AdminOrders() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<any | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchContacts = () => {
    setLoading(true);
    fetch('/api/contact', { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        setContacts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchContacts(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await fetch('/api/contact', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    fetchContacts();
    if (selected?.id === id) setSelected({ ...selected, status });
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/contact?id=${id}`, { method: 'DELETE' });
    setDeleteConfirm(null);
    if (selected?.id === id) setSelected(null);
    fetchContacts();
  };

  const filtered = filter === 'all' ? contacts : contacts.filter(c => c.status === filter);

  const statusConfig: Record<string, { label: string; cls: string }> = {
    new: { label: 'New', cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
    inprogress: { label: 'In Progress', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    resolved: { label: 'Resolved', cls: 'bg-green-500/10 text-green-400 border-green-500/20' },
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-4xl text-white mb-1">ENQUIRIES & QUOTES</h1>
        <p className="text-gray-500 text-sm">{contacts.filter(c => c.status === 'new').length} new enquiries</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { id: 'all', label: `All (${contacts.length})` },
          { id: 'new', label: `New (${contacts.filter(c => c.status === 'new').length})` },
          { id: 'inprogress', label: `In Progress (${contacts.filter(c => c.status === 'inprogress').length})` },
          { id: 'resolved', label: `Resolved (${contacts.filter(c => c.status === 'resolved').length})` },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setFilter(tab.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium uppercase tracking-wide transition-all ${
              filter === tab.id ? 'bg-orange-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-gray-600 text-xs uppercase tracking-wide px-5 py-3">Contact</th>
                <th className="text-left text-gray-600 text-xs uppercase tracking-wide px-5 py-3 hidden md:table-cell">Company</th>
                <th className="text-left text-gray-600 text-xs uppercase tracking-wide px-5 py-3 hidden lg:table-cell">Date</th>
                <th className="text-left text-gray-600 text-xs uppercase tracking-wide px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-600">Loading enquiries...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-600">No enquiries found</td></tr>
              ) : filtered.map((c) => (
                <tr key={c.id} className="hover:bg-white/2 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-400 text-xs font-bold shrink-0">
                        {(c.name || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-medium">{c.name}</p>
                        <p className="text-gray-600 text-xs">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-400 hidden md:table-cell">{c.company || '—'}</td>
                  <td className="px-5 py-3 text-gray-500 hidden lg:table-cell text-xs">
                    {c.createdAt ? new Date(c.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <select
                      value={c.status}
                      onChange={(e) => updateStatus(c.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded border bg-[#111] font-medium cursor-pointer focus:outline-none ${statusConfig[c.status]?.cls || 'text-gray-400 border-gray-700'}`}>
                      <option value="new">New</option>
                      <option value="inprogress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => setSelected(c)}
                        className="w-8 h-8 bg-white/5 hover:bg-orange-500/10 border border-white/10 hover:border-orange-500/30 rounded-lg flex items-center justify-center text-gray-500 hover:text-orange-400 transition-all">
                        <Eye size={13} />
                      </button>
                      <button onClick={() => setDeleteConfirm(c.id)}
                        className="w-8 h-8 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-400 transition-all">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h2 className="text-white font-semibold">Enquiry Details</h2>
              <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-400 text-lg font-bold">
                  {(selected.name || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-semibold text-base">{selected.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded border font-medium ${statusConfig[selected.status]?.cls}`}>
                    {statusConfig[selected.status]?.label}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Mail, label: 'Email', value: selected.email },
                  { icon: Phone, label: 'Phone', value: selected.phone || '—' },
                  { icon: Building2, label: 'Company', value: selected.company || '—' },
                  { icon: Clock, label: 'Date', value: selected.createdAt ? new Date(selected.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—' },
                ].map((item, i) => (
                  <div key={i} className="bg-white/3 rounded-xl p-3">
                    <p className="text-gray-600 text-xs flex items-center gap-1 mb-1"><item.icon size={10} />{item.label}</p>
                    <p className="text-white text-sm font-medium">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white/3 rounded-xl p-4">
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-2 flex items-center gap-1"><MessageSquare size={10} />Message</p>
                <p className="text-gray-300 text-sm leading-relaxed">{selected.message || '—'}</p>
              </div>
              <div className="pt-2 flex gap-3">
                <button onClick={() => updateStatus(selected.id, 'resolved')}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-lg text-sm font-semibold transition-all">
                  <CheckCircle2 size={14} /> Resolve Enquiry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-red-500/20 rounded-2xl p-6 max-w-sm w-full text-center">
            <Trash2 size={32} className="text-red-400 mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-2">Delete Enquiry?</h3>
            <p className="text-gray-500 text-sm mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 border border-white/10 text-gray-400 py-2 rounded-lg text-sm">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-semibold transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
