'use client';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Save, Package } from 'lucide-react';

const emptyForm = {
  id: '',
  name: '',
  slug: '',
  category: 'tshirts',
  price: '',
  minQty: '',
  description: '',
  features: '',
  colors: '',
  badge: '',
  material: '',
  weight: '',
};

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchProducts = () => {
    setLoading(true);
    fetch('/api/products')
      .then(r => r.json())
      .then(data => {
        setProducts(data.products || []);
        setCategories(data.categories || []);
        setLoading(false);
      });
  };

  useEffect(() => { fetchProducts(); }, []);

  const openAdd = () => {
    setForm(emptyForm);
    setEditing(false);
    setShowForm(true);
  };

  const openEdit = (product: any) => {
    setForm({
      ...product,
      features: Array.isArray(product.features) ? product.features.join('\n') : product.features,
      colors: Array.isArray(product.colors) ? product.colors.join(', ') : product.colors,
    });
    setEditing(true);
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      ...form,
      price: Number(form.price),
      minQty: Number(form.minQty),
      slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'),
      features: form.features.split('\n').map((f: string) => f.trim()).filter(Boolean),
      colors: form.colors.split(',').map((c: string) => c.trim()).filter(Boolean),
    };
    const method = editing ? 'PUT' : 'POST';
    await fetch('/api/products', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    setShowForm(false);
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
    setDeleteConfirm(null);
    fetchProducts();
  };

  const categoryColor: Record<string, string> = {
    tshirts: 'text-blue-400 bg-blue-500/10',
    caps: 'text-green-400 bg-green-500/10',
    bags: 'text-purple-400 bg-purple-500/10',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl text-white mb-1">PRODUCTS</h1>
          <p className="text-gray-500 text-sm">{products.length} products in catalog</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all uppercase tracking-wide">
          <Plus size={14} /> Add Product
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-gray-600 text-xs uppercase tracking-wide px-5 py-3">Product</th>
                <th className="text-left text-gray-600 text-xs uppercase tracking-wide px-5 py-3 hidden sm:table-cell">Category</th>
                <th className="text-left text-gray-600 text-xs uppercase tracking-wide px-5 py-3">Price</th>
                <th className="text-left text-gray-600 text-xs uppercase tracking-wide px-5 py-3 hidden md:table-cell">Min Qty</th>
                <th className="text-left text-gray-600 text-xs uppercase tracking-wide px-5 py-3 hidden lg:table-cell">Badge</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-600">Loading...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-600">No products yet</td></tr>
              ) : products.map((p) => (
                <tr key={p.id} className="hover:bg-white/2 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-[#1a1a1a] rounded-lg flex items-center justify-center shrink-0">
                        <Package size={16} className="text-gray-600" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{p.name}</p>
                        <p className="text-gray-600 text-xs">{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 hidden sm:table-cell">
                    <span className={`text-xs px-2 py-0.5 rounded capitalize font-medium ${categoryColor[p.category] || 'text-gray-400 bg-gray-800'}`}>
                      {p.category}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-orange-400 font-semibold">₹{p.price}</td>
                  <td className="px-5 py-3 text-gray-400 hidden md:table-cell">{p.minQty} pcs</td>
                  <td className="px-5 py-3 hidden lg:table-cell">
                    {p.badge && <span className="text-xs bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded">{p.badge}</span>}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => openEdit(p)}
                        className="w-8 h-8 bg-white/5 hover:bg-blue-500/10 border border-white/10 hover:border-blue-500/30 rounded-lg flex items-center justify-center text-gray-500 hover:text-blue-400 transition-all">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setDeleteConfirm(p.id)}
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

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/5 sticky top-0 bg-[#111] z-10">
              <h2 className="text-white font-semibold text-base uppercase tracking-wide">
                {editing ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: 'name', label: 'Product Name', type: 'text' },
                  { key: 'slug', label: 'Slug (URL)', type: 'text' },
                  { key: 'price', label: 'Price (₹)', type: 'number' },
                  { key: 'minQty', label: 'Min Quantity', type: 'number' },
                  { key: 'material', label: 'Material', type: 'text' },
                  { key: 'weight', label: 'Weight/GSM', type: 'text' },
                  { key: 'badge', label: 'Badge (optional)', type: 'text' },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="block text-gray-500 text-xs uppercase tracking-wide mb-1.5">{field.label}</label>
                    <input
                      type={field.type}
                      value={form[field.key]}
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500/50 transition-colors"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-gray-500 text-xs uppercase tracking-wide mb-1.5">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500/50 transition-colors">
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-gray-500 text-xs uppercase tracking-wide mb-1.5">Description</label>
                <textarea rows={3} value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500/50 transition-colors resize-none" />
              </div>
              <div>
                <label className="block text-gray-500 text-xs uppercase tracking-wide mb-1.5">Features (one per line)</label>
                <textarea rows={4} value={form.features}
                  onChange={(e) => setForm({ ...form, features: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500/50 transition-colors resize-none"
                  placeholder="200 GSM Cotton&#10;Custom embroidery&#10;All sizes available" />
              </div>
              <div>
                <label className="block text-gray-500 text-xs uppercase tracking-wide mb-1.5">Colors (comma separated)</label>
                <input type="text" value={form.colors}
                  onChange={(e) => setForm({ ...form, colors: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500/50 transition-colors"
                  placeholder="Black, White, Navy Blue, Red" />
              </div>
            </div>
            <div className="p-6 border-t border-white/5 flex gap-3">
              <button onClick={() => setShowForm(false)}
                className="flex-1 border border-white/10 text-gray-400 hover:text-white py-2.5 rounded-lg text-sm font-medium transition-all">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white py-2.5 rounded-lg text-sm font-semibold transition-all">
                <Save size={14} /> {saving ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-red-500/20 rounded-2xl p-6 max-w-sm w-full text-center">
            <Trash2 size={32} className="text-red-400 mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-2">Delete Product?</h3>
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
