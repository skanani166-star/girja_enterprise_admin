'use client';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Save, X, FolderOpen } from 'lucide-react';

export default function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ id: '', name: '', slug: '', description: '', icon: 'FolderOpen' });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchData = () => {
    setLoading(true);
    fetch('/api/products', { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        setCategories(data.categories || []);
        setProducts(data.products || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => {
    setForm({ id: '', name: '', slug: '', description: '', icon: 'FolderOpen' });
    setEditing(false);
    setShowForm(true);
  };

  const openEdit = (cat: any) => {
    setForm({
      id: cat.id || '',
      name: cat.name || '',
      slug: cat.slug || '',
      description: cat.description || '',
      icon: cat.icon || 'FolderOpen',
    });
    setEditing(true);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = {
      ...form,
      id: form.id || form.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_'),
      slug: form.slug || form.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'),
    };

    await fetch('/api/categories', {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    setShowForm(false);
    fetchData();
  };

  const productCount = (catId: string) => products.filter(p => p.category === catId).length;

  const handleDelete = async (id: string) => {
    await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
    setDeleteConfirm(null);
    fetchData();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl text-white mb-1">CATEGORIES</h1>
          <p className="text-gray-500 text-sm">{categories.length} categories configured</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all uppercase tracking-wide">
          <Plus size={14} /> Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-gray-600">Loading...</div>
        ) : categories.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-gray-600">No categories found</div>
        ) : categories.map((cat) => (
          <div key={cat.id} className="bg-[#111] border border-white/5 rounded-2xl p-6 hover:border-orange-500/20 transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
                <FolderOpen size={22} className="text-orange-400" />
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(cat)}
                  className="w-8 h-8 bg-white/5 hover:bg-blue-500/10 border border-white/10 rounded-lg flex items-center justify-center text-gray-500 hover:text-blue-400 transition-all">
                  <Pencil size={13} />
                </button>
                <button onClick={() => setDeleteConfirm(cat.id)}
                  className="w-8 h-8 bg-white/5 hover:bg-red-500/10 border border-white/10 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-400 transition-all">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            <h3 className="text-white font-semibold text-base mb-1">{cat.name}</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-4">{cat.description || 'No description provided.'}</p>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 text-xs">{productCount(cat.id)} products</span>
              <span className="text-gray-700 text-xs font-mono">{cat.slug}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h2 className="text-white font-semibold text-sm uppercase tracking-wide">
                {editing ? 'Edit Category' : 'Add Category'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-gray-500 text-xs uppercase tracking-wide mb-1.5">Category Name</label>
                <input type="text" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. T-Shirts"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500/50 transition-colors" />
              </div>
              <div>
                <label className="block text-gray-500 text-xs uppercase tracking-wide mb-1.5">Slug</label>
                <input type="text" value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="e.g. tshirts"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500/50 transition-colors" />
              </div>
              <div>
                <label className="block text-gray-500 text-xs uppercase tracking-wide mb-1.5">Description</label>
                <textarea rows={3} value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Category description..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500/50 transition-colors resize-none" />
              </div>
            </div>
            <div className="p-5 border-t border-white/5 flex gap-3">
              <button onClick={() => setShowForm(false)}
                className="flex-1 border border-white/10 text-gray-400 py-2.5 rounded-lg text-sm transition-all">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name.trim()}
                className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white py-2.5 rounded-lg text-sm font-semibold transition-all">
                <Save size={14} /> {saving ? 'Saving...' : 'Save Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-red-500/20 rounded-2xl p-6 max-w-sm w-full text-center">
            <Trash2 size={32} className="text-red-400 mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-2">Delete Category?</h3>
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
