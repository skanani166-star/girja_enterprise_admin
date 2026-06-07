'use client';
import { useEffect, useState } from 'react';
import { Package, MessageSquare, TrendingUp, Users, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdminDashboard() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/contact').then(r => r.json()),
      fetch('/api/products').then(r => r.json()),
    ]).then(([c, p]) => {
      setContacts(c);
      setProducts(p.products || []);
      setLoading(false);
    });
  }, []);

  const newEnquiries = contacts.filter(c => c.status === 'new').length;
  const resolvedEnquiries = contacts.filter(c => c.status === 'resolved').length;

  const stats = [
    { label: 'Total Products', value: products.length, icon: Package, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Total Enquiries', value: contacts.length, icon: MessageSquare, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: 'New Enquiries', value: newEnquiries, icon: AlertCircle, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'Resolved', value: resolvedEnquiries, icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-4xl text-white mb-1">DASHBOARD</h1>
        <p className="text-gray-500 text-sm">Welcome back! Here's what's happening.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-[#111] border border-white/5 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-500 text-sm">{stat.label}</span>
              <div className={`w-9 h-9 ${stat.bg} rounded-lg flex items-center justify-center`}>
                <stat.icon size={16} className={stat.color} />
              </div>
            </div>
            <div className="font-display text-4xl text-white">
              {loading ? <span className="text-gray-700 text-2xl">—</span> : stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Enquiries */}
      <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-white font-semibold text-base">Recent Enquiries</h2>
          <a href="/admin/orders" className="text-orange-400 text-sm hover:underline">View all</a>
        </div>
        <div className="divide-y divide-white/5">
          {loading ? (
            <div className="p-10 text-center text-gray-600 text-sm">Loading...</div>
          ) : contacts.length === 0 ? (
            <div className="p-10 text-center text-gray-600 text-sm">No enquiries yet</div>
          ) : (
            contacts.slice(0, 6).map((c) => (
              <div key={c.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/2 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-400 text-xs font-bold">
                    {c.name?.[0] || '?'}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{c.name}</p>
                    <p className="text-gray-600 text-xs">{c.company || c.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-600 text-xs flex items-center gap-1">
                    <Clock size={10} /> {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    c.status === 'new' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                    c.status === 'resolved' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                    'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>{c.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
