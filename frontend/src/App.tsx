import { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Package, TrendingUp, Plus, Trash2, Search, Wallet, X, Store, Loader2, History, Info } from 'lucide-react';
import './index.css';

type Product = {
  id: number;
  name: string;
  price: number;
  cost: number;
  stock: number;
};

type Transaction = {
  id: number;
  items: any;
  total: number;
  profit: number;
  date: string;
};

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pos' | 'inventory' | 'report'>('pos');
  const [cart, setCart] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', cost: '', stock: '' });
  const [adding, setAdding] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) return prev;
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateCartQty = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        if (newQty <= 0) return null;
        if (newQty > item.stock) return item;
        return { ...item, qty: newQty };
      }
      return item;
    }).filter(Boolean));
  };

  const totalCart = useMemo(() => cart.reduce((acc: number, item: any) => acc + (item.price * item.qty), 0), [cart]);

  const handleCheckout = async () => {
    if (cart.length === 0 || isProcessing) return;
    setIsProcessing(true);
    try {
      let total = 0, profit = 0, items: any[] = [];
      for (const item of cart) {
        total += item.price * item.qty;
        profit += (item.price - item.cost) * item.qty;
        items.push({ id: item.id, name: item.name, qty: item.qty });
      }
      const res = await fetch('http://localhost:4000/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, total, profit })
      });
      const data = await res.json();
      setTransactions((trx: Transaction[]) => [data, ...trx]);
      setCart([]);
    } catch (err) {
      alert('Gagal proses transaksi');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await fetch('http://localhost:4000/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProduct.name,
          price: Number(newProduct.price),
          cost: Number(newProduct.cost),
          stock: Number(newProduct.stock),
        })
      });
      const data = await res.json();
      setProducts(p => [...p, data]);
      setNewProduct({ name: '', price: '', cost: '', stock: '' });
      setIsAddingProduct(false);
    } catch {}
    setAdding(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const prodRes = await fetch('http://localhost:4000/api/products');
        const prodData = await prodRes.json();
        setProducts(prodData);
        const trxRes = await fetch('http://localhost:4000/api/transactions');
        const trxData = await trxRes.json();
        setTransactions(trxData);
      } catch (err) {
        // Error handling
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm('Yakin hapus produk ini?')) return;
    await fetch(`http://localhost:4000/api/products/${id}`, { method: 'DELETE' });
    setProducts(p => p.filter(prod => prod.id !== id));
  };

  const stats = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayTrans = transactions.filter(t => new Date(t.date) >= startOfToday);
    const todaySales = todayTrans.reduce((acc, t) => acc + t.total, 0);
    const todayProfit = todayTrans.reduce((acc, t) => acc + t.profit, 0);
    const totalAllTimeProfit = transactions.reduce((acc, t) => acc + t.profit, 0);
    return {
      todaySales,
      todayProfit,
      todayCount: todayTrans.length,
      allTimeProfit: totalAllTimeProfit
    };
  }, [transactions]);

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-32 sm:pb-24 md:pb-0">
      <nav className="hidden md:flex flex-col w-72 bg-white h-screen fixed border-r border-slate-200 p-6 lg:p-8 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-12">
          <div className="bg-emerald-600 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl text-white shadow-lg shadow-emerald-100">
            <Store size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="text-base sm:text-xl font-black tracking-tighter leading-none text-slate-900">WARUNGKU</h1>
            <span className="text-[8px] sm:text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Enterprise Pro</span>
          </div>
        </div>
        <div className="space-y-3">
          {[
            { id: 'pos', label: 'Mesin Kasir', icon: ShoppingCart },
            { id: 'inventory', label: 'Stok Barang', icon: Package },
            { id: 'report', label: 'Analisis Laba', icon: TrendingUp },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all duration-200 ${activeTab === item.id ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-100 translate-x-1' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
            >
              <item.icon size={22} /> {item.label}
            </button>
          ))}
        </div>
        <div className="mt-auto">
          <div className="bg-slate-900 rounded-[2rem] p-6 text-white relative overflow-hidden">
            <TrendingUp className="absolute -right-4 -bottom-4 text-white/10" size={100} />
            <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">Untung Hari Ini</p>
            <h3 className="text-2xl font-black">Rp {stats.todayProfit.toLocaleString()}</h3>
            <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-emerald-400 bg-white/5 py-1 px-3 rounded-full w-fit">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div> REAL-TIME
            </div>
          </div>
        </div>
      </nav>
      <main className="md:ml-72 p-2 sm:p-4 md:p-10">
        {activeTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 md:gap-10 pb-4 sm:pb-6 md:pb-0">
            <div className="lg:col-span-8 space-y-4 sm:space-y-8">
              <div className="relative group">
                <Search className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={18} className="sm:size-5" />
                <input 
                  type="text" 
                  placeholder="Cari produk..." 
                  className="w-full bg-white border-none p-3 sm:p-5 pl-10 sm:pl-14 rounded-2xl sm:rounded-3xl shadow-sm focus:ring-4 focus:ring-emerald-500/10 font-medium text-sm sm:text-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-5">
                {filteredProducts.map(product => (
                  <button 
                    key={product.id}
                    onClick={() => addToCart(product)}
                    disabled={product.stock <= 0}
                    className={`bg-white p-2 sm:p-5 rounded-lg sm:rounded-[2rem] shadow-sm border-2 transition-all text-left relative group ${product.stock <= 0 ? 'opacity-40 grayscale' : 'hover:border-emerald-500 border-transparent active:scale-95'}`}
                  >
                    <div className={`text-[7px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded-full inline-block mb-1 sm:mb-3 ${product.stock < 5 ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-500'}`}>
                      {product.stock}
                    </div>
                    <h4 className="font-bold text-slate-800 line-clamp-2 leading-tight text-[11px] sm:text-sm mb-1">{product.name}</h4>
                    <p className="text-emerald-600 font-black text-xs sm:text-lg">Rp {product.price.toLocaleString()}</p>
                    {product.stock > 0 && (
                      <div className="absolute top-1 sm:top-4 right-1 sm:right-4 bg-emerald-500 text-white p-1 sm:p-1.5 rounded-lg sm:rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus size={12} className="sm:w-4 sm:h-4" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="lg:col-span-4 flex flex-col h-auto lg:h-[calc(100vh-80px)] lg:sticky lg:top-10">
              <div className="bg-white rounded-2xl sm:rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 flex flex-col h-auto lg:h-full overflow-hidden">
                <div className="p-3 sm:p-8 border-b border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="bg-emerald-50 p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-emerald-600"><ShoppingCart size={16} className="sm:w-5 sm:h-5" /></div>
                    <h3 className="font-black text-sm sm:text-xl">Order</h3>
                  </div>
                  <span className="bg-slate-900 text-white text-[9px] sm:text-[10px] font-black px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">{cart.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-3 sm:p-8 space-y-4 sm:space-y-6">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300">
                      <Wallet size={32} className="sm:w-10 sm:h-10 opacity-10 mb-2 sm:mb-4" />
                      <p className="font-bold text-xs sm:text-sm italic text-center">Pilih barang</p>
                    </div>
                  ) : (
                    cart.map(item => (
                      <div key={item.id} className="flex flex-col gap-1 sm:gap-2">
                        <div className="flex justify-between items-start gap-1">
                          <h5 className="font-bold text-slate-800 flex-1 text-xs sm:text-sm">{item.name}</h5>
                          <button onClick={() => updateCartQty(item.id, -item.qty)} className="text-slate-300 hover:text-red-500"><X size={14} className="sm:w-4 sm:h-4" /></button>
                        </div>
                        <div className="flex justify-between items-center gap-1">
                          <div className="flex items-center gap-1 sm:gap-3 bg-slate-50 rounded-lg sm:rounded-xl p-0.5 sm:p-1 sm:px-3 border border-slate-100">
                            <button onClick={() => updateCartQty(item.id, -1)} className="font-black text-slate-400 text-xs sm:text-sm">-</button>
                            <span className="font-black text-xs">{item.qty}</span>
                            <button onClick={() => updateCartQty(item.id, 1)} className="font-black text-slate-400 text-xs sm:text-sm">+</button>
                          </div>
                          <span className="font-black text-emerald-600 text-xs sm:text-sm">Rp {(item.price * item.qty).toLocaleString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-3 sm:p-8 bg-slate-900 text-white">
                  <div className="flex justify-between items-center mb-3 sm:mb-6">
                    <span className="font-bold text-slate-400 text-xs sm:text-sm">Total</span>
                    <span className="text-xl sm:text-3xl font-black">Rp {totalCart.toLocaleString()}</span>
                  </div>
                  <button 
                    onClick={handleCheckout}
                    disabled={cart.length === 0 || isProcessing}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-500 py-3 sm:py-5 rounded-xl sm:rounded-[1.5rem] font-black shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 sm:gap-3 active:scale-95 text-sm sm:text-base"
                  >
                    {isProcessing ? <Loader2 className="animate-spin sm:w-6 sm:h-6" size={16} /> : <Wallet size={16} className="sm:w-6 sm:h-6" />}
                    {isProcessing ? 'MENYIMPAN...' : 'SELESAIKAN'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'inventory' && (
          <div className="max-w-6xl mx-auto space-y-4 sm:space-y-8">
            <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:justify-between md:items-end">
              <div>
                <h3 className="text-2xl sm:text-3xl font-black mb-1">Stok Barang</h3>
                <p className="text-slate-400 font-medium italic text-xs sm:text-sm">Pantau modal & laba</p>
              </div>
              <button 
                onClick={() => setIsAddingProduct(true)}
                className="bg-emerald-600 text-white px-4 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-2xl font-black shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 active:scale-95 transition-all text-sm sm:text-base"
              >
                <Plus size={16} className="sm:w-5 sm:h-5" strokeWidth={3} /> TAMBAH
              </button>
            </div>
            <div className="bg-white rounded-lg sm:rounded-[2.5rem] shadow-sm border border-slate-200 overflow-x-auto">
              <div className="inline-block min-w-full">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="px-3 sm:px-10 py-3 sm:py-6">Produk</th>
                      <th className="px-2 sm:px-6 py-3 sm:py-6 text-center">Stok</th>
                      <th className="px-2 sm:px-6 py-3 sm:py-6">Modal</th>
                      <th className="px-2 sm:px-6 py-3 sm:py-6">Jual</th>
                      <th className="px-2 sm:px-6 py-3 sm:py-6">Laba</th>
                      <th className="px-3 sm:px-10 py-3 sm:py-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {products.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-3 sm:px-10 py-3 sm:py-6">
                          <div className="font-bold text-slate-800 text-xs sm:text-sm">{p.name}</div>
                          <div className="text-[7px] sm:text-[10px] text-slate-400 font-bold">#{p.id}</div>
                        </td>
                        <td className="px-2 sm:px-6 py-3 sm:py-6 text-center">
                          <div className={`inline-block px-2 sm:px-4 py-0.5 sm:py-1 rounded-lg sm:rounded-xl font-black text-[7px] sm:text-xs ${p.stock < 5 ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>
                            {p.stock}
                          </div>
                        </td>
                        <td className="px-2 sm:px-6 py-3 sm:py-6 text-slate-500 font-medium text-[7px] sm:text-sm">Rp {p.cost.toLocaleString()}</td>
                        <td className="px-2 sm:px-6 py-3 sm:py-6 font-black text-slate-900 text-[7px] sm:text-sm">Rp {p.price.toLocaleString()}</td>
                        <td className="px-2 sm:px-6 py-3 sm:py-6">
                          <div className="text-emerald-600 font-black text-[7px] sm:text-sm">+ Rp {(p.price - p.cost).toLocaleString()}</div>
                        </td>
                        <td className="px-3 sm:px-10 py-3 sm:py-6 text-right">
                          <button onClick={() => handleDeleteProduct(p.id)} className="p-1.5 sm:p-2 text-slate-200 hover:text-red-500 transition-colors">
                            <Trash2 size={14} className="sm:w-4.5 sm:h-4.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'report' && (
          <div className="max-w-6xl mx-auto space-y-6 sm:space-y-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              <div className="bg-white p-4 sm:p-8 rounded-xl sm:rounded-[2.5rem] border border-slate-100 shadow-sm">
                <p className="text-[8px] sm:text-[10px] font-black uppercase text-slate-400 mb-1 sm:mb-2">Penjualan Hari Ini</p>
                <h2 className="text-lg sm:text-3xl font-black text-slate-900">Rp {stats.todaySales.toLocaleString()}</h2>
                <div className="mt-2 sm:mt-3 flex items-center gap-1 text-emerald-500 font-bold text-[8px] sm:text-xs">
                  <TrendingUp size={12} className="sm:w-3.5 sm:h-3.5" /> {stats.todayCount} transaksi
                </div>
              </div>
              <div className="bg-emerald-600 p-4 sm:p-8 rounded-xl sm:rounded-[2.5rem] shadow-xl shadow-emerald-200 text-white relative overflow-hidden">
                <TrendingUp className="absolute -right-2 -bottom-2 text-white/10" size={60} className="sm:w-20 sm:h-20" />
                <p className="text-[8px] sm:text-[10px] font-black uppercase text-white/70 mb-1 sm:mb-2">Laba Hari Ini</p>
                <h2 className="text-lg sm:text-3xl font-black">Rp {stats.todayProfit.toLocaleString()}</h2>
                <p className="mt-2 sm:mt-3 text-[8px] sm:text-[10px] font-bold text-emerald-100 italic">Hasil bersih</p>
              </div>
              <div className="bg-slate-900 p-4 sm:p-8 rounded-xl sm:rounded-[2.5rem] text-white">
                <p className="text-[8px] sm:text-[10px] font-black uppercase text-slate-500 mb-1 sm:mb-2">Total Laba</p>
                <h2 className="text-lg sm:text-3xl font-black">Rp {stats.allTimeProfit.toLocaleString()}</h2>
                <div className="mt-2 sm:mt-3 flex items-center gap-1 text-[8px] sm:text-xs font-bold text-slate-400">
                  <Info size={12} className="sm:w-3.5 sm:h-3.5" /> Semua waktu
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl sm:rounded-[3rem] shadow-sm border border-slate-200 p-4 sm:p-8 md:p-12">
              <div className="flex items-start sm:items-center justify-between gap-2 sm:gap-4 mb-4 sm:mb-8">
                <h3 className="font-black text-lg sm:text-2xl flex items-center gap-1 sm:gap-3">
                  <History className="text-emerald-600" size={18} className="sm:w-6 sm:h-6" /> Riwayat
                </h3>
                <span className="text-[7px] sm:text-xs font-bold text-slate-400 italic">20 terakhir</span>
              </div>
              <div className="space-y-3 sm:space-y-6">
                {transactions.length === 0 ? (
                    <div className="py-10 sm:py-20 text-center text-slate-300 font-bold text-sm sm:text-base">Belum ada transaksi.</div>
                ) : (
                  transactions.slice(0, 20).map(t => (
                    <div key={t.id} className="flex flex-col gap-2 sm:gap-4 p-3 sm:p-6 rounded-lg sm:rounded-3xl bg-slate-50 border border-slate-100">
                      <div className="flex items-start gap-2 sm:gap-4">
                        <div className="bg-white p-1.5 sm:p-3 rounded-lg sm:rounded-2xl shadow-sm text-emerald-600 font-black text-xs sm:text-base">
                          {t.items.length}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-slate-800 text-xs sm:text-sm">Invoice #{t.id}</p>
                          <p className="text-[7px] sm:text-[10px] text-slate-400 font-bold uppercase mb-1 sm:mb-2 truncate">{new Date(t.date).toLocaleString('id-ID')}</p>
                          <div className="flex flex-wrap gap-1">
                            {t.items.slice(0, 2).map((item: any, idx: number) => (
                              <span key={idx} className="text-[7px] sm:text-[9px] font-bold bg-white px-1.5 sm:px-2 py-0.5 rounded-full border border-slate-100 text-slate-500 truncate">
                                {item.qty}x {item.name}
                              </span>
                            ))}
                            {t.items.length > 2 && (
                              <span className="text-[7px] sm:text-[9px] font-bold bg-white px-1.5 sm:px-2 py-0.5 rounded-full border border-slate-100 text-slate-500">
                                +{t.items.length - 2}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-200 pt-2 sm:pt-3">
                         <p className="font-black text-sm sm:text-xl text-slate-900">Rp {t.total.toLocaleString()}</p>
                         <p className="text-[7px] sm:text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg">Untung: Rp {t.profit.toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex justify-around p-2 z-40 rounded-t-2xl shadow-xl">
        {[
          { id: 'pos', icon: ShoppingCart, label: 'KASIR' },
          { id: 'inventory', icon: Package, label: 'STOK' },
          { id: 'report', icon: TrendingUp, label: 'LABA' },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)} 
            className={`flex flex-col items-center gap-0.5 transition-all py-2 px-3 rounded-lg ${activeTab === tab.id ? 'text-emerald-600 bg-emerald-50' : 'text-slate-300'}`}
          >
            <tab.icon size={20} className="sm:w-5 sm:h-5" strokeWidth={activeTab === tab.id ? 3 : 2} />
            <span className="text-[8px] font-black tracking-widest">{tab.label}</span>
          </button>
        ))}
      </div>
      {isAddingProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="bg-white rounded-t-3xl sm:rounded-[3rem] w-full sm:max-w-lg sm:w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex justify-between items-center p-4 sm:p-10 border-b border-slate-100 rounded-t-3xl sm:rounded-t-[3rem]">
               <h2 className="text-lg sm:text-2xl font-black">Barang Baru</h2>
               <button onClick={() => setIsAddingProduct(false)} className="text-slate-300 hover:text-slate-900"><X size={20} className="sm:w-6 sm:h-6" /></button>
            </div>
            <form onSubmit={handleAddProduct} className="space-y-4 sm:space-y-6 p-4 sm:p-10">
              <div>
                <label className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase ml-1 mb-1.5 sm:mb-2 block">Nama Barang</label>
                <input required type="text" placeholder="Contoh: Kopi" className="w-full bg-slate-50 border border-slate-200 p-3 sm:p-5 rounded-lg sm:rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 font-bold text-sm sm:text-base" 
                  value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div>
                  <label className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase ml-1 mb-1.5 sm:mb-2 block">Modal</label>
                  <input required type="number" placeholder="Rp" className="w-full bg-slate-50 border border-slate-200 p-3 sm:p-5 rounded-lg sm:rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 font-bold text-sm sm:text-base" 
                    value={newProduct.cost} onChange={e => setNewProduct({...newProduct, cost: e.target.value})} />
                </div>
                <div>
                  <label className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase ml-1 mb-1.5 sm:mb-2 block">Harga Jual</label>
                  <input required type="number" placeholder="Rp" className="w-full bg-slate-50 border border-slate-200 p-3 sm:p-5 rounded-lg sm:rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 font-bold text-emerald-600 text-sm sm:text-base" 
                    value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase ml-1 mb-1.5 sm:mb-2 block">Stok</label>
                <input required type="number" placeholder="Pcs" className="w-full bg-slate-50 border border-slate-200 p-3 sm:p-5 rounded-lg sm:rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 font-bold text-sm sm:text-base" 
                  value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-emerald-600 text-white py-3 sm:py-5 rounded-lg sm:rounded-[1.5rem] font-black shadow-lg shadow-emerald-100 active:scale-95 transition-all text-sm sm:text-base">
                SIMPAN
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
