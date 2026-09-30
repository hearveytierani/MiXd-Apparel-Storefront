import { useCallback, useContext, useEffect, useMemo, useState, createContext, type ReactNode, type FormEvent, type CSSProperties } from 'react';
import { Link, Route, Router as WouterRouter, Switch, useLocation, useParams } from 'wouter';
import { ArrowRight, Instagram, Menu, Minus, Plus, Send, ShoppingBag, X } from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import NotFound from '@/pages/not-found';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

type Category = 'tees' | 'hoodies' | 'accessories';
type ColorKey = 'ink' | 'bone' | 'cognac' | 'saddle' | 'gold';
type Product = {
  id: string; name: string; cat: Category; type: 'tee' | 'hoodie' | 'cap' | 'beanie' | 'tote' | 'bandana';
  art: 'bolt' | 'x' | 'scrawl' | 'foil' | 'wet'; price: number; colors: ColorKey[]; sizes: string[];
  out: string[]; badge: string; feat: number; added: number; pop: number; blurb: string;
};
type BagLine = { key: string; id: string; color: ColorKey; size: string; qty: number };

const COLORS: Record<ColorKey, { name: string; hex: string }> = {
  ink: { name: 'Ink Black', hex: '#201A18' }, bone: { name: 'Bone', hex: '#F3ECE2' },
  cognac: { name: 'Cognac', hex: '#A36238' }, saddle: { name: 'Saddle', hex: '#63391F' },
  gold: { name: 'Foil Gold', hex: '#B38E46' },
};
const CATEGORIES: Record<Category, string> = { tees: 'Tees', hoodies: 'Hoodies', accessories: 'Accessories' };
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const PRODUCTS: Product[] = [
  { id: 'static-tee', name: 'Static Tee', cat: 'tees', type: 'tee', art: 'bolt', price: 48, colors: ['bone', 'ink', 'cognac'], sizes: SIZES, out: ['XXL'], badge: 'New', feat: 1, added: 12, pop: 9, blurb: 'A boxy heavyweight tee with a hand-inked lightning strike across the chest.' },
  { id: 'crosswire-tee', name: 'Cross-Wire Tee', cat: 'tees', type: 'tee', art: 'x', price: 52, colors: ['ink', 'bone', 'saddle'], sizes: SIZES, out: [], badge: '', feat: 0, added: 9, pop: 8, blurb: 'The mixed-up X, radiating like a live wire. Printed thick, printed loud.' },
  { id: 'ink-bone-tee', name: 'Ink & Bone Tee', cat: 'tees', type: 'tee', art: 'scrawl', price: 46, colors: ['bone', 'cognac'], sizes: SIZES, out: ['XS'], badge: '', feat: 0, added: 6, pop: 6, blurb: 'Loose marker scrawl, printed slightly off-register on purpose.' },
  { id: 'gold-leaf-tee', name: 'Gold Leaf Tee', cat: 'tees', type: 'tee', art: 'foil', price: 58, colors: ['ink', 'saddle'], sizes: SIZES, out: [], badge: 'Limited', feat: 0, added: 10, pop: 7, blurb: 'A pressed foil patch, crinkled and imperfect like real gold leaf.' },
  { id: 'bolt-hoodie', name: 'Bolt Heavyweight Hoodie', cat: 'hoodies', type: 'hoodie', art: 'bolt', price: 128, colors: ['ink', 'saddle', 'bone'], sizes: SIZES, out: ['XS'], badge: 'Limited', feat: 1, added: 11, pop: 10, blurb: 'Our flagship. Brushed-back heavyweight fleece with the hand-inked bolt front and centre.' },
  { id: 'signal-hoodie', name: 'Signal X Hoodie', cat: 'hoodies', type: 'hoodie', art: 'x', price: 118, colors: ['ink', 'cognac'], sizes: SIZES, out: [], badge: '', feat: 0, added: 8, pop: 8, blurb: 'The MiXd X in full burst — rays and all — on a relaxed, roomy pullover.' },
  { id: 'wet-ink-hoodie', name: 'Wet Ink Hoodie', cat: 'hoodies', type: 'hoodie', art: 'wet', price: 124, colors: ['saddle', 'bone', 'ink'], sizes: SIZES, out: ['XXL'], badge: 'New', feat: 1, added: 13, pop: 9, blurb: 'Dripping brush lettering, like the paint never dried. It did. It just looks like it didn’t.' },
  { id: 'no-rules-hoodie', name: 'No Rules Hoodie', cat: 'hoodies', type: 'hoodie', art: 'scrawl', price: 122, colors: ['cognac', 'ink'], sizes: SIZES, out: [], badge: '', feat: 0, added: 5, pop: 5, blurb: 'Scribbled, circled, underlined twice. A hoodie with a point of view.' },
  { id: 'deckle-cap', name: 'Deckle Dad Cap', cat: 'accessories', type: 'cap', art: 'x', price: 38, colors: ['ink', 'cognac', 'bone'], sizes: ['One Size'], out: [], badge: '', feat: 1, added: 7, pop: 7, blurb: 'Washed six-panel cap with a small hand-inked X on the front.' },
  { id: 'static-beanie', name: 'Static Beanie', cat: 'accessories', type: 'beanie', art: 'foil', price: 34, colors: ['ink', 'saddle', 'cognac'], sizes: ['One Size'], out: [], badge: '', feat: 0, added: 4, pop: 5, blurb: 'A ribbed cuff beanie with a foil MiXd patch that catches the light.' },
  { id: 'gold-leaf-tote', name: 'Gold Leaf Tote', cat: 'accessories', type: 'tote', art: 'bolt', price: 42, colors: ['bone', 'ink'], sizes: ['One Size'], out: [], badge: 'New', feat: 0, added: 14, pop: 6, blurb: 'Heavy canvas tote, reinforced handles, one very loud bolt.' },
  { id: 'rebel-bandana', name: 'Rebel Bandana', cat: 'accessories', type: 'bandana', art: 'x', price: 22, colors: ['cognac', 'ink', 'gold'], sizes: ['One Size'], out: [], badge: '', feat: 0, added: 3, pop: 4, blurb: 'Edge-to-edge X print. Wear it on your head, your bag, your wrist.' },
];
const PRODUCT_BY_ID = (id?: string) => PRODUCTS.find((product) => product.id === id) ?? PRODUCTS[0];
const fmt = (amount: number) => `$${amount.toFixed(0)}`;
const readStorage = <T,>(key: string, fallback: T): T => {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; }
};

function shade(hex: string, amount: number) {
  const value = parseInt(hex.slice(1), 16);
  const channels = [value >> 16, value >> 8 & 255, value & 255].map((channel) => Math.max(0, Math.min(255, Math.round(channel + (255 - channel) * amount))));
  return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

function Garment({ product, color, view = 'front', label = false }: { product: Product; color: ColorKey; view?: 'front' | 'back' | 'detail'; label?: boolean }) {
  const base = COLORS[color].hex;
  const dark = shade(base, -.25);
  const line = color === 'ink' || color === 'saddle' ? '#e7d6bc' : '#201a18';
  const ink = color === 'bone' || color === 'gold' ? '#201a18' : '#f3ece2';
  const art = product.art;
  const isWear = product.type === 'tee' || product.type === 'hoodie';
  return (
    <svg className="garment" viewBox="0 0 300 300" role={label ? 'img' : undefined} aria-label={label ? `${product.name}, ${COLORS[color].name}` : undefined} aria-hidden={label ? undefined : true}>
      <ellipse cx="150" cy="286" rx="84" ry="7" fill="#201a18" opacity=".16" />
      {product.type === 'tee' && <path d="M100 38 62 52 14 96l34 36 26-22v152q0 8 8 8h136q8 0 8-8V110l26 22 34-36-48-44-38-14q-50 42-100 0Z" fill={base} stroke={line} strokeWidth="3" strokeLinejoin="round" />}
      {product.type === 'hoodie' && <><path d="m96 74-38 14-38 108 34 12 22-60v120q0 8 8 8h132q8 0 8-8V148l22 60 34-12-38-108-38-14q-54 26-108 0Z" fill={base} stroke={line} strokeWidth="3" strokeLinejoin="round" /><path d="M96 74Q90 18 150 14q60 4 54 60-54 32-108 0Z" fill={base} stroke={line} strokeWidth="3" /></>}
      {product.type === 'cap' && <><path d="M52 172Q52 66 150 62t98 110Z" fill={base} stroke={line} strokeWidth="3" /><path d="M40 172q110-24 220 0 32 42-110 54Q8 214 40 172Z" fill={dark} stroke={line} strokeWidth="3" /></>}
      {product.type === 'beanie' && <><path d="M66 196Q60 58 150 56t84 140Z" fill={base} stroke={line} strokeWidth="3" /><path d="M58 190h184l4 56q-96 18-192 0Z" fill={dark} stroke={line} strokeWidth="3" /></>}
      {product.type === 'tote' && <><path d="M110 118q-4-78 40-78t40 78" fill="none" stroke={dark} strokeWidth="12" strokeLinecap="round" /><path d="M78 112h144l10 156q0 6-6 6H74q-6 0-6-6Z" fill={base} stroke={line} strokeWidth="3" /></>}
      {product.type === 'bandana' && <path d="m150 26 126 124-126 124L24 150Z" fill={base} stroke={line} strokeWidth="3" />}
      {!label || view !== 'back' ? <g transform={`translate(150 ${isWear ? 150 : product.type === 'cap' ? 120 : product.type === 'beanie' ? 205 : 180})`}>
        {art === 'bolt' && <><path d="m18-60-39 68 25-5-18 64 49-77-25 5Z" fill={ink} /><text y="75" textAnchor="middle" fill={ink} fontSize="22" fontFamily="Permanent Marker">STATIC</text></>}
        {art === 'x' && <><path d="m-60-44 42 26 18-42 18 42 42-26-26 42 42 18-42 18 26 42-42-26-18 42-18-42-42 26 26-42-42-18 42-18Z" fill={ink} opacity=".9" /><circle r="13" fill={color === 'ink' ? '#e3bd6a' : dark} /></>}
        {art === 'scrawl' && <><ellipse rx="58" ry="36" fill="none" stroke={ink} strokeWidth="3.5" strokeDasharray="150 12 60 8" transform="rotate(-5)" /><text y="9" textAnchor="middle" fill={ink} fontSize="36" fontFamily="Permanent Marker">MiXd</text><text y="32" textAnchor="middle" fill={color === 'ink' ? '#e3bd6a' : '#b38e46'} fontSize="12" letterSpacing="3" fontFamily="Special Elite">NO RULES</text></>}
        {art === 'wet' && <><text y="10" textAnchor="middle" fill={ink} fontSize="48" fontFamily="Permanent Marker">MiXd</text><path d="M-40 21v22M-14 21v38M12 20v15M36 22v29" stroke={ink} strokeWidth="5" strokeLinecap="round" /><circle cx="-14" cy="64" r="5" fill={ink} /><circle cx="36" cy="55" r="4" fill={ink} /></>}
        {art === 'foil' && <><rect x="-38" y="-25" width="76" height="48" rx="3" fill="url(#foil)" stroke="#201a18" strokeWidth="2.5" /><text y="8" textAnchor="middle" fill="#201a18" fontSize="24" fontFamily="Permanent Marker">MiXd</text></>}
      </g> : <path d="M150 45q0 46 0 85M72 110q10-40 28-70M228 110q-10-40-28-70" fill="none" stroke={line} strokeWidth="3" opacity=".6" />}
      {view === 'detail' && <circle cx="232" cy="62" r="26" fill="none" stroke={ink} strokeWidth="3" strokeDasharray="3 5" />}
      <defs><linearGradient id="foil" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f3d98f" /><stop offset=".5" stopColor="#b38e46" /><stop offset="1" stopColor="#e3bd6a" /></linearGradient></defs>
    </svg>
  );
}

type StoreValue = {
  bag: BagLine[]; drawerOpen: boolean; openDrawer: () => void; closeDrawer: () => void;
  addToBag: (id: string, color: ColorKey, size: string, qty?: number) => void;
  changeQty: (key: string, delta: number) => void; removeLine: (key: string) => void; notify: (message: string) => void;
};
const StoreContext = createContext<StoreValue | null>(null);
const useStore = () => {
  const value = useContext(StoreContext);
  if (!value) throw new Error('Store context missing');
  return value;
};

function StoreProvider({ children }: { children: ReactNode }) {
  const [bag, setBag] = useState<BagLine[]>(() => readStorage('mixd.cart.v1', []));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState('');
  useEffect(() => localStorage.setItem('mixd.cart.v1', JSON.stringify(bag)), [bag]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(''), 3200); return () => window.clearTimeout(timer); }, [toast]);
  const notify = useCallback((message: string) => setToast(message), []);
  const addToBag = useCallback((id: string, color: ColorKey, size: string, qty = 1) => {
    setBag((current) => {
      const key = `${id}|${color}|${size}`;
      const existing = current.find((line) => line.key === key);
      return existing ? current.map((line) => line.key === key ? { ...line, qty: Math.min(10, line.qty + qty) } : line) : [...current, { key, id, color, size, qty: Math.min(10, qty) }];
    });
    setDrawerOpen(true);
    notify('Added to your bag.');
  }, [notify]);
  const changeQty = useCallback((key: string, delta: number) => setBag((current) => current.flatMap((line) => line.key !== key ? [line] : line.qty + delta <= 0 ? [] : [{ ...line, qty: Math.min(10, line.qty + delta) }])), []);
  const removeLine = useCallback((key: string) => setBag((current) => current.filter((line) => line.key !== key)), []);
  const value = useMemo(() => ({ bag, drawerOpen, openDrawer: () => setDrawerOpen(true), closeDrawer: () => setDrawerOpen(false), addToBag, changeQty, removeLine, notify }), [bag, drawerOpen, addToBag, changeQty, removeLine, notify]);
  return <StoreContext.Provider value={value}>{children}<Toast message={toast} /></StoreContext.Provider>;
}

function Toast({ message }: { message: string }) { return <div className={`toast ${message ? 'show' : ''}`} role="status" aria-live="polite" data-testid="status-toast">{message}</div>; }

function Header() {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { bag, openDrawer } = useStore();
  const total = bag.reduce((sum, line) => sum + line.qty, 0);
  const close = () => setMenuOpen(false);
  return <header className="nav">
    <div className="nav-bar">
      <nav className={`nav-links ${menuOpen ? 'open' : ''}`} aria-label="Primary">
        {[['/', 'Home'], ['/shop', 'Shop'], ['/about', 'About'], ['/contact', 'Contact']].map(([href, label]) => <Link key={href} href={href} onClick={close} aria-current={location === href ? 'page' : undefined} data-testid={`link-nav-${label.toLowerCase()}`}>{label}</Link>)}
      </nav>
      <Link href="/" className="brand" aria-label="MiXd Apparel home" data-testid="link-brand"><span>Mi</span><img src="/logo.jpg" alt="" /><span>d</span><small>Apparel</small></Link>
      <div className="nav-right">
        <button className="bag-button" onClick={openDrawer} aria-label={`Open bag, ${total} item${total === 1 ? '' : 's'}`} data-testid="button-open-bag"><ShoppingBag size={18} /><span>Bag</span>{total > 0 && <b className="bag-count" data-testid="text-bag-count">{total}</b>}</button>
        <button className="menu-button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-label="Toggle menu" data-testid="button-menu"><Menu size={22} /></button>
      </div>
    </div>
  </header>;
}

function Footer() {
  return <footer className="footer"><div className="wrap footer-grid">
    <div><Link href="/" className="brand" data-testid="link-footer-brand"><span>Mi</span><img src="/logo.jpg" alt="" /><span>d</span><small>Apparel</small></Link><p>Small-batch streetwear, hand-inked and wrong in exactly the right ways.</p><a href="https://instagram.com/" target="_blank" rel="noreferrer" aria-label="Instagram" data-testid="link-instagram"><Instagram size={21} /></a></div>
    <nav aria-label="Pages"><p className="footer-h">Pages</p><ul><li><Link href="/">Home</Link></li><li><Link href="/shop">Shop</Link></li><li><Link href="/about">About</Link></li><li><Link href="/contact">Contact</Link></li></ul></nav>
    <nav aria-label="Shop categories"><p className="footer-h">Shop</p><ul><li><Link href="/shop">All pieces</Link></li><li><Link href="/shop?cat=tees">Tees</Link></li><li><Link href="/shop?cat=hoodies">Hoodies</Link></li><li><Link href="/shop?cat=accessories">Accessories</Link></li></ul></nav>
    <div><p className="footer-h">Help</p><ul><li><a href="mailto:support@mixdapperal.com" data-testid="link-support-email">support@mixdapperal.com</a></li><li><Link href="/contact">Contact form</Link></li></ul></div>
  </div><div className="wrap footer-base"><span>© 2026 MiXd Apparel. All rights reserved.</span><span>Imperfect on purpose.</span></div></footer>;
}

function BagDrawer() {
  const { bag, drawerOpen, closeDrawer, changeQty, removeLine, notify } = useStore();
  const subtotal = bag.reduce((sum, line) => sum + PRODUCT_BY_ID(line.id).price * line.qty, 0);
  const freeShip = 150; const left = Math.max(0, freeShip - subtotal);
  return <><div className={`scrim ${drawerOpen ? 'open' : ''}`} onClick={closeDrawer} aria-hidden="true" /><aside className={`drawer ${drawerOpen ? 'open' : ''}`} role="dialog" aria-modal="true" aria-hidden={!drawerOpen} aria-labelledby="bag-title">
    <div className="drawer-head"><h2 id="bag-title">Your bag</h2><button className="icon-button" onClick={closeDrawer} aria-label="Close bag" data-testid="button-close-bag"><X size={20} /></button></div>
    <div className="ship"><span>{bag.length === 0 ? 'Free shipping over $150' : left ? `${fmt(left)} away from free shipping` : 'Free shipping unlocked'}</span><div className="ship-bar"><i style={{ width: `${Math.min(100, subtotal / freeShip * 100)}%` }} /></div></div>
    {bag.length ? <ul className="drawer-list" aria-label="Items in your bag">{bag.map((line) => { const p = PRODUCT_BY_ID(line.id); return <li className="line" key={line.key} data-testid={`row-bag-${line.id}`}><div className="line-img"><Garment product={p} color={line.color} /></div><div><Link className="line-name" href={`/product/${p.id}`} onClick={closeDrawer}>{p.name}</Link><p className="line-meta">{COLORS[line.color].name} · {line.size} · {fmt(p.price)}</p><div className="qty"><button onClick={() => changeQty(line.key, -1)} aria-label={`Decrease ${p.name}`} data-testid={`button-decrease-${line.id}`}><Minus size={13} /></button><span data-testid={`text-quantity-${line.id}`}>{line.qty}</span><button onClick={() => changeQty(line.key, 1)} aria-label={`Increase ${p.name}`} data-testid={`button-increase-${line.id}`}><Plus size={13} /></button></div></div><div className="line-end"><span>{fmt(p.price * line.qty)}</span><button className="remove" onClick={() => removeLine(line.key)} data-testid={`button-remove-${line.id}`}>Remove</button></div></li>; })}</ul> : <div className="drawer-empty"><div className="bolt" /><h3>Your bag’s empty.</h3><p>Nothing here yet. Go make some noise.</p><Link href="/shop" className="btn" onClick={closeDrawer} data-testid="link-empty-shop">Shop the drop</Link></div>}
    {bag.length > 0 && <div className="drawer-foot"><div className="drawer-row"><span>Subtotal</span><span data-testid="text-bag-subtotal">{fmt(subtotal)}</span></div><p className="fine">Shipping and taxes calculated at checkout.</p><button className="btn btn-block" onClick={() => notify('Demo store: connect checkout here.')} data-testid="button-checkout">Checkout</button><button className="link-button" onClick={closeDrawer} data-testid="button-keep-shopping">Keep shopping</button></div>}
  </aside></>;
}

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  useEffect(() => {
    const titles: Record<string, string> = {
      '/': 'MiXd Apparel — Wear the Mix',
      '/shop': 'Shop — MiXd Apparel',
      '/about': 'About — MiXd Apparel',
      '/contact': 'Contact — MiXd Apparel',
    };
    document.title = titles[location] ?? 'Product — MiXd Apparel';
  }, [location]);
  return <div className="suede-frame"><div className="gold-card"><div className="scroll"><Header /><main id="main">{children}</main><Footer /></div></div><BagDrawer /></div>;
}

function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { addToBag } = useStore();
  const color = product.colors[0];
  const action = product.sizes.length === 1 ? <button className="btn btn-block" onClick={() => addToBag(product.id, color, product.sizes[0])} data-testid={`button-add-${product.id}`}>Add to bag</button> : <Link href={`/product/${product.id}`} className="btn btn-ghost btn-block" data-testid={`link-choose-${product.id}`}>Choose size <ArrowRight size={16} /></Link>;
  return <article className="product-card" style={{ '--rotation': `${[-.8, .7, -.5, .9][index % 4]}deg` } as CSSProperties} data-testid={`card-product-${product.id}`}><Link className="product-visual" href={`/product/${product.id}`} data-testid={`link-product-image-${product.id}`}><Garment product={product} color={color} />{product.badge && <span className="sticker">{product.badge}</span>}</Link><div className="product-body"><p className="product-cat">{CATEGORIES[product.cat]}</p><h3 className="product-name"><Link href={`/product/${product.id}`} data-testid={`link-product-${product.id}`}>{product.name}</Link></h3><div className="product-row"><span className="price">{fmt(product.price)}</span><span className="dots" aria-label={`Colors: ${product.colors.map((key) => COLORS[key].name).join(', ')}`}>{product.colors.map((key) => <i key={key} style={{ '--swatch': COLORS[key].hex } as CSSProperties} />)}</span></div>{action}</div></article>;
}

function Newsletter() {
  const [email, setEmail] = useState(''); const [message, setMessage] = useState('');
  const submit = (event: FormEvent) => { event.preventDefault(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) { setMessage('That email looks off. Try again.'); return; } const list = readStorage<string[]>('mixd.newsletter.v1', []); if (!list.includes(email.trim())) localStorage.setItem('mixd.newsletter.v1', JSON.stringify([...list, email.trim()])); setMessage('You’re in. First dibs on every drop.'); setEmail(''); };
  return <section className="newsletter"><div className="wrap newsletter-inner"><div><p className="label">The studio list</p><h2 className="display">Get on the list.</h2><p>Drops sell out fast. Join for early access, restocks, and the occasional scribble from the studio.</p></div><form onSubmit={submit} noValidate><label className="sr-only" htmlFor="newsletter-email">Email address</label><input id="newsletter-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@email.com" data-testid="input-newsletter-email" /><button className="btn" type="submit" data-testid="button-newsletter-submit">Sign me up</button><p className={`form-message ${message.startsWith('That') ? 'error' : ''}`} role="status" data-testid="status-newsletter">{message}</p></form></div></section>;
}

function Home() {
  const featured = PRODUCTS.filter((product) => product.feat);
  return <><section className="hero"><div className="hero-copy"><p className="label">Drop 01 · Small-batch streetwear</p><h1 className="display">Wear the <span className="brush">Mix.</span></h1><p className="lead">Hand-inked graphics. Heavyweight cuts. Foil where it counts. Loud, a little bit wrong, and built to be worn hard.</p><div className="cta-row"><Link href="/shop" className="btn btn-lg" data-testid="link-hero-shop">Shop the drop</Link><Link href="/about" className="btn btn-ghost btn-lg" data-testid="link-hero-story">Our story</Link></div><ul className="hero-facts"><li>Small-batch runs</li><li>Hand-drawn art</li><li>Free shipping over $150</li></ul></div><div className="hero-art"><Garment product={PRODUCT_BY_ID('bolt-hoodie')} color="ink" label /><span className="stamp">Drop 01<br />Limited<br />run</span></div></section><div className="marquee" aria-hidden="true"><div className="marquee-track"><span>Limited runs</span><span>Hand-inked</span><span>Imperfect on purpose</span><span>Foil and suede</span><span>Wear the mix</span><span>Limited runs</span><span>Hand-inked</span><span>Imperfect on purpose</span><span>Foil and suede</span></div></div><section className="wrap section" aria-labelledby="featured-heading"><div className="section-head"><div><p className="label">Fresh off the press</p><h2 className="display" id="featured-heading">Featured pieces</h2></div><Link href="/shop" className="btn btn-ghost" data-testid="link-featured-shop">Shop all <ArrowRight size={17} /></Link></div><div className="grid grid-4">{featured.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}</div></section><section className="wrap section story"><figure className="polaroid"><img src="/logo.jpg" alt="The MiXd logo on gold leaf inside a suede frame" data-testid="img-brand-logo" /><figcaption>the mark, on foil.</figcaption></figure><div><p className="label">The story</p><h2 className="display">Born in <span className="brush">the mix.</span></h2><p className="lead">MiXd started with a simple problem: nothing fit in just one box.</p><p>So we made the in-between. Hand-drawn graphics, thick ink, foil that crinkles like the real thing, and cuts that hold up.</p><Link href="/about" className="btn btn-ghost" data-testid="link-home-about">Read the story</Link></div></section><Newsletter /></>;
}

function Shop() {
  const initialCat = new URLSearchParams(window.location.search).get('cat') as Category | null;
  const [category, setCategory] = useState<Category | 'all'>(initialCat && CATEGORIES[initialCat] ? initialCat : 'all');
  const [colors, setColors] = useState<ColorKey[]>([]);
  const [sort, setSort] = useState('featured');
  const products = useMemo(() => PRODUCTS.filter((p) => (category === 'all' || p.cat === category) && (!colors.length || p.colors.some((c) => colors.includes(c)))).sort((a, b) => sort === 'new' ? b.added - a.added : sort === 'price-asc' ? a.price - b.price : sort === 'price-desc' ? b.price - a.price : sort === 'name' ? a.name.localeCompare(b.name) : b.pop - a.pop), [category, colors, sort]);
  const toggleColor = (color: ColorKey) => setColors((current) => current.includes(color) ? current.filter((item) => item !== color) : [...current, color]);
  return <><section className="wrap page-head"><p className="label">The catalog</p><h1 className="display">Shop <span className="brush">all.</span></h1><p className="lead">Tees, hoodies, and the little things that finish a fit. All small-batch, all hand-inked.</p></section><section className="wrap section" style={{ paddingTop: '1rem' }} aria-label="Product catalog"><div className="toolbar"><div className="chips">{(['all', 'tees', 'hoodies', 'accessories'] as const).map((item) => <button key={item} className={`chip ${category === item ? 'active' : ''}`} onClick={() => setCategory(item)} aria-pressed={category === item} data-testid={`button-filter-${item}`}>{item === 'all' ? 'All' : CATEGORIES[item]}</button>)}</div><div className="toolbar-right"><div className="filter-block"><span className="label">Color</span><div className="swatches">{(Object.keys(COLORS) as ColorKey[]).map((key) => <button key={key} className="swatch" style={{ '--swatch': COLORS[key].hex } as CSSProperties} onClick={() => toggleColor(key)} aria-pressed={colors.includes(key)} aria-label={COLORS[key].name} data-testid={`button-color-${key}`} />)}</div></div><div className="filter-block"><label className="label" htmlFor="sort-products">Sort by</label><select id="sort-products" className="field-input" value={sort} onChange={(event) => setSort(event.target.value)} data-testid="select-sort"><option value="featured">Featured</option><option value="new">Newest</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="name">Name: A–Z</option></select></div></div></div><p className="count" aria-live="polite" data-testid="text-product-count">{products.length} piece{products.length === 1 ? '' : 's'}</p>{products.length ? <div className="grid">{products.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}</div> : <div className="empty-state"><h2 className="display">Nothing in that mix.</h2><p>No pieces match those filters.</p><button className="btn" onClick={() => { setCategory('all'); setColors([]); }} data-testid="button-clear-filters">Clear filters</button></div>}</section></>;
}

const INFO: Record<Product['type'], { material: string; fit: string; care: string[] }> = {
  tee: { material: 'Heavyweight combed-cotton jersey, garment-washed for a broken-in feel.', fit: 'Boxy through the body with a slightly dropped shoulder. True to size; size up for an oversized drape.', care: ['Machine wash cold, inside out, with like colors.', 'Gentle cycle. No bleach or fabric softener.', 'Hang dry, or tumble on low.', 'Iron inside out on low heat.'] },
  hoodie: { material: 'Brushed-back heavyweight cotton fleece with a double-layer hood and ribbed cuffs.', fit: 'Relaxed and roomy through the chest and shoulders. True to size; size down for a closer fit.', care: ['Machine wash cold, inside out.', 'Gentle cycle. No bleach.', 'Hang dry to keep the fleece soft.', 'Do not iron the graphic.'] },
  cap: { material: 'Washed cotton twill, six panels, with an adjustable strap.', fit: 'One size. Adjustable strap fits most heads.', care: ['Spot clean with a damp cloth.', 'Do not machine wash.', 'Reshape and air dry.'] },
  beanie: { material: 'Soft ribbed knit with a foil-finish patch on the cuff.', fit: 'One size. Wear folded for a snug fit, unfolded for slouch.', care: ['Hand wash cool.', 'Lay flat to dry.', 'Keep foil away from direct heat.'] },
  tote: { material: 'Heavy cotton canvas with reinforced, double-stitched handles.', fit: 'One size. Roomy enough for a laptop, a hoodie, and a bad decision.', care: ['Spot clean, or wash cold and air dry.', 'Do not tumble dry.', 'Avoid ironing the print.'] },
  bandana: { material: 'Soft cotton twill, printed edge to edge.', fit: 'One size. Roughly 22 × 22 in.', care: ['Wash cold with like colors.', 'Air dry.', 'Iron on low, reverse side only.'] },
};

function ProductPage() {
  const params = useParams<{ id: string }>(); const product = PRODUCT_BY_ID(params.id); const info = INFO[product.type];
  const [color, setColor] = useState<ColorKey>(product.colors[0]); const [size, setSize] = useState(product.sizes.length === 1 ? product.sizes[0] : ''); const [sizeError, setSizeError] = useState(false); const [qty, setQty] = useState(1); const [view, setView] = useState<'front' | 'back' | 'detail'>('front'); const { addToBag, notify } = useStore();
  useEffect(() => { document.title = `${product.name} — MiXd Apparel`; }, [product.name]);
  const related = PRODUCTS.filter((item) => item.id !== product.id).sort((a, b) => (b.cat === product.cat ? 1 : 0) - (a.cat === product.cat ? 1 : 0) || b.pop - a.pop).slice(0, 4);
  return <><div className="wrap"><nav className="crumbs" aria-label="Breadcrumb"><Link href="/" data-testid="link-breadcrumb-home">Home</Link> / <Link href="/shop" data-testid="link-breadcrumb-shop">Shop</Link> / {CATEGORIES[product.cat]} / {product.name}</nav><div className="pdp"><div className="pdp-gallery"><div className="pdp-main"><Garment product={product} color={color} view={view} label /></div><div className="pdp-thumbs">{(['front', 'back', 'detail'] as const).map((item) => <button key={item} className="thumb" onClick={() => setView(item)} aria-pressed={view === item} aria-label={`${item} view`} data-testid={`button-view-${item}`}><Garment product={product} color={color} view={item} /></button>)}</div></div><div className="pdp-info"><p className="label">{CATEGORIES[product.cat]}{product.badge ? ` · ${product.badge}` : ''}</p><h1>{product.name}</h1><p className="pdp-price">{fmt(product.price)}</p><p>{product.blurb}</p><fieldset className="option"><legend>Color <b>— {COLORS[color].name}</b></legend><div className="swatches" role="radiogroup">{product.colors.map((key) => <button key={key} className="swatch" style={{ '--swatch': COLORS[key].hex } as CSSProperties} onClick={() => setColor(key)} aria-checked={color === key} role="radio" aria-label={COLORS[key].name} data-testid={`button-product-color-${key}`} />)}</div></fieldset><fieldset className="option"><legend>Size <b>{sizeError && <span className="error-note">pick a size first</span>}</b></legend><div className="sizes" role="radiogroup">{product.sizes.map((item) => <button key={item} className={`size ${size === item ? 'active' : ''}`} onClick={() => { setSize(item); setSizeError(false); }} disabled={product.out.includes(item)} aria-checked={size === item} role="radio" data-testid={`button-size-${item}`}>{item}</button>)}</div></fieldset><div className="buy-row"><div className="quantity" role="group" aria-label="Quantity"><button onClick={() => setQty((value) => Math.max(1, value - 1))} aria-label="Decrease quantity" data-testid="button-product-decrease"><Minus size={15} /></button><span data-testid="text-product-quantity">{qty}</span><button onClick={() => setQty((value) => Math.min(10, value + 1))} aria-label="Increase quantity" data-testid="button-product-increase"><Plus size={15} /></button></div><button className="btn" onClick={() => size ? addToBag(product.id, color, size, qty) : (setSizeError(true), notify('Pick a size before adding this piece.'))} data-testid="button-product-add">Add to bag</button></div><ul className="perks"><li>Free shipping over $150</li><li>Small-batch run. When it’s gone, it’s gone</li></ul><div className="accordion"><details open><summary>Description</summary><p>{product.blurb} {info.material}</p></details><details><summary>Fit and sizing</summary><p>{info.fit}</p>{(product.type === 'tee' || product.type === 'hoodie') && <table className="size-table"><caption className="sr-only">Approximate body chest measurements</caption><thead><tr><th>Size</th><th>Chest</th></tr></thead><tbody>{[['XS','32–34'],['S','35–37'],['M','38–40'],['L','41–43'],['XL','44–46'],['XXL','47–49']].map(([item, measurement]) => <tr key={item}><td>{item}</td><td>{measurement} in</td></tr>)}</tbody></table>}</details><details><summary>Care guide</summary><ul>{info.care.map((care) => <li key={care}>{care}</li>)}</ul></details></div></div></div></div><section className="wrap section" style={{ paddingTop: '1rem' }}><div className="section-head"><h2 className="display">More from the mix</h2></div><div className="grid grid-4">{related.map((item, index) => <ProductCard key={item.id} product={item} index={index} />)}</div></section></>;
}

function About() {
  return <><section className="wrap page-head"><p className="label">About MiXd</p><h1 className="display">Born in <span className="brush">the mix.</span></h1><p className="lead">A streetwear label for people who never fit in one box, and wouldn’t want to.</p></section><section className="wrap section" style={{ paddingTop: '1rem' }}><p className="label">Our mission</p><blockquote className="statement">Make high-end streetwear that feels hand-made, because it is.</blockquote></section><section className="wrap section story"><figure className="polaroid"><img src="/logo.jpg" alt="MiXd hand-lettered logo on gold leaf" /><figcaption>gold leaf. suede. ink.</figcaption></figure><div><p className="label">The story</p><h2 className="display">Two worlds, one fit.</h2><p>MiXd is a mash-up by design. Luxury finishes meet street-level attitude. Gold leaf and suede sit next to thick marker ink and jagged lightning. It shouldn’t work, and that’s exactly why it does.</p><p>We keep runs small, draw everything by hand first, and leave the human mistakes in. The wobbly line, the off-register print, the crinkled foil: that’s the signature.</p></div></section><section className="wrap section"><div className="section-head"><div><p className="label">What we stand on</p><h2 className="display">Our values</h2></div></div><div className="values">{[['01','Imperfect on purpose','The shaky line, the rough edge, the foil that crinkles. We keep the human in it.'],['02','Made small','Short runs and no endless restocks. When a drop is gone, it’s gone.'],['03','Hand first','Every graphic starts as ink on paper before it goes anywhere near a screen.'],['04','Built to outlast','Heavyweight fabrics, reinforced seams, finishes that get better with age.']].map(([num, title, text]) => <article className="value" key={num}><p className="label">{num}</p><h3>{title}</h3><p>{text}</p></article>)}</div></section><section className="wrap section"><div className="section-head"><div><p className="label">How it gets made</p><h2 className="display">From sketch to street</h2></div></div><ol className="steps">{[['Sketch','Rough ideas in marker and ink, on whatever paper is closest.'],['Ink','The best lines get redrawn thick and bold, wobble intact.'],['Foil and press','Gold leaf and ink go on by hand-fed pressing.'],['Cut and sew','Boxy, heavyweight, reinforced. Then it gets sent out.']].map(([title, text]) => <li key={title}><h3>{title}</h3><p>{text}</p></li>)}</ol></section><section className="wrap section cta-band"><h2 className="display">Ready to wear the mix?</h2><div className="cta-row"><Link href="/shop" className="btn btn-lg" data-testid="link-about-shop">Shop the drop</Link><Link href="/contact" className="btn btn-ghost btn-lg" data-testid="link-about-contact">Say hello</Link></div></section></>;
}

function Contact() {
  const [sent, setSent] = useState(false); const [status, setStatus] = useState(''); const [form, setForm] = useState({ name: '', email: '', topic: 'Order help', order: '', message: '' });
  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const submit = (event: FormEvent) => { event.preventDefault(); if (!form.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email) || !form.message.trim()) { setStatus('Please fill in your name, a valid email, and a message.'); return; } setSent(true); setStatus(''); };
  return <><section className="wrap page-head"><p className="label">Contact</p><h1 className="display">Say <span className="brush">something.</span></h1><p className="lead">Order help, sizing questions, collabs, wholesale, or just a good idea. We read everything.</p></section><section className="wrap contact-grid"><div><div className="panel"><h2>Customer support</h2><p>Email us any time:</p><a className="mail-big" href="mailto:support@mixdapperal.com" data-testid="link-contact-email">support@mixdapperal.com</a><p>We usually reply within 1–2 business days.</p></div><div className="faq"><details><summary>How long does shipping take?</summary><p>Most orders ship within a few business days. You’ll get tracking as soon as it’s on the way.</p></details><details><summary>What’s your return policy?</summary><p>Unworn items in original condition can be returned. Get in touch with your order number.</p></details><details><summary>How do your pieces fit?</summary><p>Tees are boxy, hoodies are relaxed. Both run true to size.</p></details><details><summary>Do you do collabs or wholesale?</summary><p>Always open to it. Choose Collab / Wholesale in the form.</p></details></div></div><div>{sent ? <div className="panel done"><div className="bolt" /><h2>Message sent.</h2><p>Thanks, {form.name}. We’ll get back to you soon.</p><Link href="/shop" className="btn" data-testid="link-contact-shop">Back to the shop</Link></div> : <form className="panel contact-form" onSubmit={submit} noValidate><h2>Drop us a line</h2><div className="field"><label htmlFor="contact-name">Name</label><input id="contact-name" value={form.name} onChange={(event) => update('name', event.target.value)} autoComplete="name" data-testid="input-contact-name" /></div><div className="field"><label htmlFor="contact-email">Email</label><input id="contact-email" type="email" value={form.email} onChange={(event) => update('email', event.target.value)} autoComplete="email" data-testid="input-contact-email" /></div><div className="field"><label htmlFor="contact-topic">Topic</label><select id="contact-topic" value={form.topic} onChange={(event) => update('topic', event.target.value)} data-testid="select-contact-topic"><option>Order help</option><option>Sizing and fit</option><option>Collab / Wholesale</option><option>Press</option><option>Something else</option></select></div><div className="field"><label htmlFor="contact-order">Order number (optional)</label><input id="contact-order" value={form.order} onChange={(event) => update('order', event.target.value)} data-testid="input-contact-order" /></div><div className="field"><label htmlFor="contact-message">Message</label><textarea id="contact-message" value={form.message} onChange={(event) => update('message', event.target.value)} data-testid="input-contact-message" /></div><button className="btn btn-lg" type="submit" data-testid="button-contact-submit"><Send size={17} /> Send it</button><p className="form-message error" role="alert" data-testid="status-contact">{status}</p></form>}</div></section></>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) { const [location] = useLocation(); return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>; }
const queryClient = new QueryClient();
function Router() { return <RoutedErrorBoundary><Shell><Switch><Route path="/" component={Home} /><Route path="/shop" component={Shop} /><Route path="/product/:id" component={ProductPage} /><Route path="/about" component={About} /><Route path="/contact" component={Contact} /><Route component={NotFound} /></Switch></Shell></RoutedErrorBoundary>; }
function App() { return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><StoreProvider><Router /></StoreProvider></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>; }
export default App;