'use client';
import { useEffect, useState, type ChangeEvent } from 'react';
import { Plus, Pencil, Trash2, X, Save, Package, ImagePlus } from 'lucide-react';

const emptyForm = {
  id: '',
  name: '',
  category: '',
  minQty: '',
  description: '',
  image: '',
  images: [] as string[],
};

function compressImageFile(file: File, maxWidth = 150, maxHeight = 150, quality = 0.3): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const src = event.target?.result as string;
      if (!src) return resolve('');
      const img = new Image();
      img.src = src;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = Math.max(width, 1);
        canvas.height = Math.max(height, 1);
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = () => resolve(src);
    };
    reader.onerror = () => resolve('');
  });
}

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchProducts = () => {
    setLoading(true);
    fetch('/api/products', { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        const cats = data.categories || [];
        setCategories(cats);
        setProducts(data.products || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(); }, []);

  const openAdd = () => {
    const defaultCat = categories.length > 0 ? categories[0].id : 'general';
    setForm({ ...emptyForm, category: defaultCat, images: [] });
    setEditing(false);
    setPreviewImages([]);
    setShowForm(true);
  };

  const openEdit = (product: any) => {
    const existingImages = Array.isArray(product.images) && product.images.length
      ? product.images
      : product.image
        ? [product.image]
        : [];

    setForm({
      ...product,
      category: product.category || (categories.length > 0 ? categories[0].id : 'general'),
      image: product.image || '',
      images: existingImages,
    });
    setEditing(true);
    setPreviewImages(existingImages);
    setShowForm(true);
  };

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setUploadingImage(true);
    const compressedResults = await Promise.all(
      files.map((file) => compressImageFile(file))
    );

    const validImages = compressedResults.filter(Boolean);
    setPreviewImages(prev => [...prev, ...validImages]);
    setUploadingImage(false);
    event.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);

    const selectedCategory = form.category || (categories[0]?.id || 'general');

    const payload = {
      id: form.id || `prod_${Date.now()}`,
      name: form.name.trim(),
      category: selectedCategory,
      minQty: Number(form.minQty || 0),
      description: form.description || '',
      images: previewImages,
      image: previewImages[0] || '',
    };

    const method = editing ? 'PUT' : 'POST';
    try {
      const res = await fetch('/api/products', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSaving(false);
        setShowForm(false);
        setPreviewImages([]);
        fetchProducts();
      } else {
        const errData = await res.json().catch(() => ({}));
        setSaving(false);
        alert(errData.error || 'Failed to save product. Please check fields and try again.');
      }
    } catch (err: any) {
      setSaving(false);
      alert(err?.message || 'Network error while saving product.');
    }
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
                <th className="text-left text-gray-600 text-xs uppercase tracking-wide px-5 py-3 hidden md:table-cell">Min Qty</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-12 text-gray-600">Loading products...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-12 text-gray-600">No products yet</td></tr>
              ) : products.map((p) => {
                const mainImage = Array.isArray(p.images) && p.images.length ? p.images[0] : p.image || '';
                const categoryObj = categories.find(c => c.id === p.category);
                return (
                  <tr key={p.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#1a1a1a] rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                          {mainImage ? (
                            <img src={mainImage} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package size={16} className="text-gray-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">{p.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell">
                      <span className={`text-xs px-2 py-0.5 rounded capitalize font-medium ${categoryColor[p.category] || 'text-gray-400 bg-gray-800'}`}>
                        {categoryObj?.name || p.category}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-400 hidden md:table-cell">{p.minQty || 0} pcs</td>
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
                );
              })}
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
                <div>
                  <label className="block text-gray-500 text-xs uppercase tracking-wide mb-1.5">Product Name</label>
                  <input
                    type="text"
                    value={form.name || ''}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Dry-Fit T-Shirt"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 text-xs uppercase tracking-wide mb-1.5">Min Quantity</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.minQty || ''}
                    onChange={(e) => setForm({ ...form, minQty: e.target.value })}
                    placeholder="e.g. 30"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500/50 transition-colors"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-gray-500 text-xs uppercase tracking-wide mb-1.5">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500/50 transition-colors">
                    {categories.length === 0 ? (
                      <option value="">No categories available - Please add a category first</option>
                    ) : (
                      categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-gray-500 text-xs uppercase tracking-wide mb-1.5">Description</label>
                <textarea rows={4} value={form.description || ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Product description..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500/50 transition-colors resize-none" />
              </div>
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <label className="block text-gray-500 text-xs uppercase tracking-wide">Product Images</label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-300 hover:border-orange-500/40 hover:text-orange-400 transition-colors">
                    <ImagePlus size={14} /> {uploadingImage ? 'Processing...' : 'Add Images'}
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} disabled={uploadingImage} />
                  </label>
                </div>
                <p className="mb-3 text-[11px] text-gray-600">Upload one or more images. Click the red ✕ button to delete any image.</p>
                {previewImages.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {previewImages.map((image, index) => (
                      <div key={`${image}-${index}`} className="relative group overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1a]">
                        <img src={image} alt={`Preview ${index + 1}`} className="h-24 w-full object-cover" />
                        
                        {/* Remove image button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg transition-all z-10 cursor-pointer"
                          title="Delete image"
                        >
                          <X size={12} />
                        </button>

                        {/* Main image label */}
                        {index === 0 && (
                          <span className="absolute bottom-1.5 left-1.5 bg-orange-500/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs z-10 uppercase tracking-wider">
                            Main
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-sm text-gray-600">
                    {uploadingImage ? 'Processing images...' : 'No images chosen yet.'}
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-white/5 flex gap-3">
              <button onClick={() => setShowForm(false)}
                className="flex-1 border border-white/10 text-gray-400 hover:text-white py-2.5 rounded-lg text-sm font-medium transition-all">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving || !form.name.trim() || uploadingImage}
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
