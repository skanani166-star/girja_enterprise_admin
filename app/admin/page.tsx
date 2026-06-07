'use client';
import { useEffect, useState } from 'react';
import { Package, MessageSquare, CheckCircle2, AlertCircle, Clock, Plus, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/contact').then(r => r.json()),
      fetch('/api/products').then(r => r.json()),
    ]).then(([c, p]) => {
      setContacts(Array.isArray(c) ? c : []);
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl text-white mb-1">DASHBOARD</h1>
          <p className="text-gray-500 text-sm">Welcome back! Here's your store overview.</p>
        </div>
        <Link href="/admin/products"
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all uppercase tracking-wide">
          <Plus size={14} /> Add Product
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-[#111] border border-white/5 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-500 text-xs uppercase tracking-wide">{stat.label}</span>
              <div className={`w-8 h-8 ${stat.bg} rounded-lg flex items-center justify-center`}>
                <stat.icon size={15} className={stat.color} />
              </div>
            </div>
            <div className="font-display text-4xl text-white">
              {loading ? <span className="text-gray-700 text-2xl animate-pulse">—</span> : stat.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Enquiries */}
        <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-white font-semibold text-sm uppercase tracking-wide">Recent Enquiries</h2>
            <Link href="/admin/orders" className="text-orange-400 text-xs hover:underline flex items-center gap-1">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {loading ? (
              <div className="p-8 text-center text-gray-600 text-sm">Loading...</div>
            ) : contacts.length === 0 ? (
              <div className="p-8 text-center text-gray-600 text-sm">No enquiries yet</div>
            ) : (
              contacts.slice(0, 5).map((c) => (
                <div key={c.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-400 text-xs font-bold shrink-0">
                      {(c.name || 'U')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{c.name}</p>
                      <p className="text-gray-600 text-xs truncate">{c.company || c.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-gray-600 text-xs hidden sm:flex items-center gap-1">
                      <Clock size={10} /> {new Date(c.createdAt).toLocaleDateString('en-IN')}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      c.status === 'new' ? 'bg-yellow-500/10 text-yellow-400' :
                      c.status === 'resolved' ? 'bg-green-500/10 text-green-400' :
                      'bg-blue-500/10 text-blue-400'
                    }`}>{c.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Products overview */}
        <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-white font-semibold text-sm uppercase tracking-wide">Products</h2>
            <Link href="/admin/products" className="text-orange-400 text-xs hover:underline flex items-center gap-1">
              Manage <ArrowRight size={11} />
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {loading ? (
              <div className="p-8 text-center text-gray-600 text-sm">Loading...</div>
            ) : products.length === 0 ? (
              <div className="p-8 text-center text-gray-600 text-sm">No products yet</div>
            ) : (
              products.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center shrink-0">
                      <Package size={14} className="text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{p.name}</p>
                      <p className="text-gray-600 text-xs capitalize">{p.category}</p>
                    </div>
                  </div>
                  <div className="shrink-0 ml-2 text-right">
                    <p className="text-orange-400 text-sm font-semibold">₹{p.price}</p>
                    <p className="text-gray-600 text-xs">Min {p.minQty} pcs</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
