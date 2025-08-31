import React, { useEffect, useMemo, useState } from "react";
import {
    LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid
} from "recharts";
import "./AdminPage.scss"; // styles below

const API = "http://localhost:8080/reports";

function Tabs({ value, onChange }) {
    const items = ["Coffees", "Users", "Sales"];
    return (
        <div className="tabs">
            {items.map((label, i) => (
                <button
                    key={label}
                    className={`tab ${value === i ? "tab--active" : ""}`}
                    onClick={() => onChange(i)}
                >
                    {label}
                </button>
            ))}
        </div>
    );
}

function CoffeeCard({ coffee, onEdit, onArchiveToggle }) {
    const { id, name, price, stock, imageUrl, deleted } = coffee;

    return (
        <div className={`coffee-card ${deleted ? "coffee-card--archived" : ""}`}>
            <div className="coffee-card__thumb">
                {imageUrl ? <img src={imageUrl} alt={name}/> : <div className="coffee-card__noimg">No image</div>}
            </div>

            <div className="coffee-card__content">
                <div className="coffee-card__title">{name}</div>

                <div className="coffee-card__meta">
                    <span className="badge">#{id}</span>
                    <span className="dot" />
                    <span className="price">{price} lei</span>
                    <span className="dot" />
                    <span className={`stock ${stock === 0 ? "low" : ""}`}>Stock: {stock}</span>
                </div>

                <div className="coffee-card__actions">
                    <button className="btn btn--primary" onClick={() => onEdit(coffee)}>Edit</button>

                    <button className="btn" onClick={() => onArchiveToggle(coffee)}>
                        {deleted ? "Enable" : "Archive"}
                    </button>
                </div>

                {deleted && <div className="ribbon">Archived</div>}
            </div>
        </div>
    );
}


function CoffeeEditor({ open, initial, onClose, onSave }) {
    const [form, setForm] = useState(
        initial ?? { name: "", price: 0, stock: 0, imageUrl: "" , description: ""}
    );
    useEffect(() => {
        if (open) setForm(initial ?? { name: "", price: 0, stock: 0, imageUrl: "" , description : ""});
    }, [open, initial]);

    const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    if (!open) return null;
    return (
        <div className="modal__backdrop" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h3>{initial?.id ? "Edit Coffee" : "Create Coffee"}</h3>
                <div className="form">
                    <label>
                        Name
                        <input value={form.name} onChange={(e) => update("name", e.target.value)}/>
                    </label>
                    <label>
                        Price (lei)
                        <input type="number" step="0.01" value={form.price}
                               onChange={(e) => update("price", parseFloat(e.target.value || "0"))}/>
                    </label>
                    <label>
                        Stock
                        <input type="number" value={form.stock}
                               onChange={(e) => update("stock", parseInt(e.target.value || "0", 10))}/>
                    </label>
                    <label>
                        Image URL
                        <input value={form.imageUrl || ""} onChange={(e) => update("imageUrl", e.target.value)}/>
                    </label>
                    <label>
                        Description
                        <textarea
                            rows={3}
                            value={form.description || ""}
                            onChange={(e) => update("description", e.target.value)}
                        />
                    </label>
                    {form.imageUrl && (
                        <div className="preview">
                            <img src={form.imageUrl} alt="preview"/>
                        </div>
                    )}

                    <div className="modal__actions">
                        <button className="ap-btn" onClick={onClose}>Cancel</button>
                        <button
                            className="ap-btn ap-btn--primary"
                            onClick={() => onSave(form)}
                        >
                            {initial?.id ? "Save changes" : "Create"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CoffeesTab() {
    const [coffees, setCoffees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editorOpen, setEditorOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [query, setQuery] = useState("");

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return coffees;
        return coffees.filter(c =>
            `${c.name} ${c.id}`.toLowerCase().includes(q)
        );
    }, [coffees, query]);

    const load = async () => {
        setLoading(true);
        try {
            const res = await fetch("http://localhost:8080/reports/coffees?includeArchived=true");
            const data = await res.json();

            // normalize: prefer 'deleted', fall back to 'archived'
            const normalized = data.map(c => ({
                ...c,
                deleted: c.deleted ?? c.archived ?? false
            }));
            setCoffees(normalized);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const onEdit = (coffee) => {
        setEditing(coffee);
        setEditorOpen(true);
    };

    const onCreate = () => {
        setEditing(null);
        setEditorOpen(true);
    };

    const onSave = async (payload) => {
        try {
            if (editing?.id) {
                // update
                const res = await fetch(`http://localhost:8080/reports/coffees/${editing.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) throw new Error(await res.text());
            } else {
                // create
                const res = await fetch(`http://localhost:8080/reports/add-coffee`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) throw new Error(await res.text());
            }
            await load();
            setEditorOpen(false);
        } catch (e) {
            console.error(e);
            alert("Save failed: " + e.message);
        }
    };

    const onArchiveToggle = async (coffee) => {
        // optimistic flip
        setCoffees(prev =>
            prev.map(c => c.id === coffee.id ? { ...c, deleted: !coffee.deleted } : c)
        );

        try {
            const base = "http://localhost:8080/reports/coffees"; // <-- keep ONE base
            if (coffee.deleted) {
                await fetch(`${base}/${coffee.id}/restore`, { method: "POST" });
            } else {
                await fetch(`${base}/${coffee.id}/archive`, { method: "POST" });
            }
        } catch (e) {
            // revert on failure
            setCoffees(prev =>
                prev.map(c => c.id === coffee.id ? { ...c, deleted: coffee.deleted } : c)
            );
            console.error(e);
            alert("Operation failed");
        }

        await load();
    };

    return (
        <div className="panel">
            <div className="panel__bar">
                <div className="left">
                    <input
                        placeholder="Search coffees by name or #id…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
                <div className="right">
                    <button className="btn btn--primary" onClick={onCreate}>+ New Coffee</button>
                </div>
            </div>

            {loading ? (
                <div className="empty">Loading…</div>
            ) : filtered.length === 0 ? (
                <div className="empty">No coffees found.</div>
            ) : (
                <div className="grid">
                    {filtered.map((c) => (
                        <CoffeeCard
                            key={c.id}
                            coffee={c}
                            onEdit={onEdit}
                            onArchiveToggle={onArchiveToggle}
                        />
                    ))}
                </div>
            )}

            <CoffeeEditor
                open={editorOpen}
                initial={editing}
                onClose={() => setEditorOpen(false)}
                onSave={onSave}
            />
        </div>
    );
}

function daysOld(iso) {
    if (!iso) return "-";
    const ms = Date.now() - new Date(iso).getTime();
    return Math.max(0, Math.floor(ms / 86400000));
}

function OrdersModal({ open, onClose, user }) {
    const [loading, setLoading] = useState(false);
    const [orders, setOrders] = useState([]);   // always an array

    useEffect(() => {
        if (!open || !user) return;

        const load = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API}/${user.id}/ordersOfUser`);
                const data = await res.json();

                // normalize the response into an array
                const list = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.orders)
                        ? data.orders
                        : Array.isArray(data?.content)
                            ? data.content
                            : [];

                setOrders(list);
            } catch (e) {
                console.error("Failed to load orders:", e);
                setOrders([]); // keep it an array
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [open, user]);

    // safe number helper
    const num = (v) => (typeof v === "number" && !Number.isNaN(v) ? v : 0);

    // compute total safely
    const grandTotal = orders.reduce((sum, o) => sum + num(o.total), 0);

    if (!open) return null;

    return (
        <div className="modal__backdrop" onClick={onClose}>
            <div className="modal wide" onClick={(e) => e.stopPropagation()}>
                <h3>Orders — {user?.email}</h3>

                {loading ? (
                    <div className="empty">Loading orders…</div>
                ) : orders.length === 0 ? (
                    <div className="empty">No orders found.</div>
                ) : (
                    <div className="orders-table">
                        <div className="orders-head">
                            <span>#</span><span>Date</span><span>Items</span><span>Total (lei)</span>
                        </div>

                        {orders.map((o) => (
                            <div key={o.id} className="orders-row">
                                <span>#{o.id}</span>
                                <span>{o.createdAt ? new Date(o.createdAt).toLocaleString() : "-"}</span>
                                <span>{Array.isArray(o.items) ? o.items.length : num(o.itemsCount)}</span>
                                <span>{num(o.total).toFixed(2)}</span>
                            </div>
                        ))}

                        <div className="orders-foot">
                            <span />
                            <span />
                            <span>Total:</span>
                            <span>{grandTotal.toFixed(2)}</span>
                        </div>
                    </div>
                )}

                <div className="modal__actions">
                    <button className="btn" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
}

function UserEditor({ open, user, onClose, onSaved }) {
    const [form, setForm] = useState(() => ({
        email: user?.email ?? "",
        username: user?.username ?? "",
        verified: !!user?.verified,
    }));

    useEffect(() => {
        if (!open) return;
        setForm({
            email: user?.email ?? "",
            username: user?.username ?? "",
            verified: !!user?.verified,
        });
    }, [open, user]);

    const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const save = async () => {
        try {
            // PATCH /reports/users/{id}
            const res = await fetch(`${API}/users/${user.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: form.email,
                    username: form.username,
                    verified: form.verified,
                }),
            });
            if (!res.ok) throw new Error(await res.text());
            onSaved && onSaved();
            onClose();
        } catch (e) {
            console.error(e);
            alert("Failed to save user: " + e.message);
        }
    };

    if (!open) return null;

    return (
        <div className="modal__backdrop" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h3>Edit user</h3>
                <div className="form">
                    <label>
                        Email
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) => update("email", e.target.value)}
                        />
                    </label>

                    <label>
                        Username
                        <input
                            value={form.username}
                            onChange={(e) => update("username", e.target.value)}
                        />
                    </label>

                    <label className="checkbox-row">
                        <input
                            type="checkbox"
                            checked={form.verified}
                            onChange={(e) => update("verified", e.target.checked)}
                        />
                        Verified
                    </label>

                    <div className="modal__actions">
                        <button className="ap-btn" onClick={onClose}>Cancel</button>
                        <button className="ap-btn ap-btn--primary" onClick={save}>Save</button>
                    </div>
                </div>
            </div>
        </div>
    );

}


function UsersTab() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");
    const [ordersOpen, setOrdersOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [editOpen, setEditOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const openEditor = (u) => {
        setEditingUser(u);
        setEditOpen(true);
    };

    const load = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/listOfUsers`);
            const data = await res.json();
            // expect: [{id,email,createdAt}, ...]
            setUsers(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return users;
        return users.filter(u =>
            `${u.email} ${u.id}`.toLowerCase().includes(q)
        );
    }, [users, query]);

    const openOrders = (u) => {
        setSelectedUser(u);
        setOrdersOpen(true);
    };

    return (
        <div className="panel">
            <div className="panel__bar">
                <div className="left">
                    <input
                        placeholder="Search users by email or #id…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="empty">Loading…</div>
            ) : filtered.length === 0 ? (
                <div className="empty">No users found.</div>
            ) : (
                <div className="users-grid">
                    {filtered.map(u => (
                        <div key={u.id} className="user-card">
                            <div className="user-main">
                                <div className="user-email">{u.email}</div>
                                <div className="user-meta">
                                    <span className="badge">#{u.id}</span>
                                    <span className="dot"/>
                                    <span className="age">{daysOld(u.createdAt)} days old</span>
                                </div>
                            </div>
                            <div className="user-actions">
                                <button className="ap-btn" onClick={() => openEditor(u)}>Edit</button>
                                <button className="ap-btn ap-btn--primary" onClick={() => openOrders(u)}>View orders
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <OrdersModal
                open={ordersOpen}
                onClose={() => setOrdersOpen(false)}
                user={selectedUser}
            />
            <UserEditor
                open={editOpen}
                user={editingUser}
                onClose={() => setEditOpen(false)}
                onSaved={load}
            />
        </div>
    );
}

function SalesTab() {
    const { products, loading: loadingProducts } = useProducts();
    const [{ from, to }, setRange] = useState(defaultRange());
    const [selectedIds, setSelectedIds] = useState([]); // ["1","2"]
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [seriesDates, setSeriesDates] = useState([]);
    const [byDate, setByDate] = useState({});

    // Select all by default once products load
    useEffect(() => {
        if (!loadingProducts && products.length && selectedIds.length === 0) {
            setSelectedIds(products.map(p => String(p.id)));
        }
    }, [loadingProducts, products]);

    const fetchSales = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ from, to });
            // If your backend supports filtering by product IDs, pass them:
            if (selectedIds.length) params.set("productIds", selectedIds.join(","));
            // Try common endpoints; adjust if your backend has a single canonical one
            let res = await fetch(`${API}/sales/daily?` + params.toString());
            if (!res.ok) {
                // fallback
                res = await fetch(`${API}/sales?` + params.toString());
            }
            const raw = await res.json();
            const norm = normalizeSales(raw);
            setSeriesDates(norm.seriesDates);
            setByDate(norm.byDate);
        } catch (e) {
            console.error("Failed to load sales", e);
            setSeriesDates([]);
            setByDate({});
        } finally {
            setLoading(false);
        }
    };

    // Auto-load on first render and when range changes
    useEffect(() => { fetchSales(); /* eslint-disable-next-line */ }, [from, to]);

    const chartData = useMemo(
        () => buildChartData(seriesDates, byDate, selectedIds),
        [seriesDates, byDate, selectedIds]
    );

    const productMap = useMemo(() => {
        const map = {};
        products.forEach(p => { map[String(p.id)] = p; });
        return map;
    }, [products]);

    const kpi = useMemo(() => {
        const totals = chartData.reduce(
            (acc, row) => {
                acc.qty += row.totalQty;
                acc.revenue += row.totalRevenue;
                return acc;
            },
            { qty: 0, revenue: 0 }
        );
        return {
            days: chartData.length,
            units: totals.qty,
            revenue: totals.revenue,
            avgPerDay: chartData.length ? totals.revenue / chartData.length : 0
        };
    }, [chartData]);


    return (
        <div className="panel">
            <div className="panel__bar">
                <div className="left" style={{ gap: 8, display: "flex", alignItems: "center" }}>
                    <label className="inline">
                        From
                        <input type="date" value={from} onChange={e => setRange(r => ({ ...r, from: e.target.value }))} />
                    </label>
                    <label className="inline">
                        To
                        <input type="date" value={to} onChange={e => setRange(r => ({ ...r, to: e.target.value }))} />
                    </label>
                    <button className="btn" onClick={() => setRange(defaultRange())}>Last 30 days</button>
                </div>
                <div className="right" style={{ display: "flex", gap: 8 }}>
                    <button className="btn" onClick={fetchSales} disabled={loading}>Refresh</button>
                </div>
            </div>

            <div className="sales-layout">
                <div className="sales-left">
                    <div className="kpis">
                        <div className="kpi">
                            <div className="kpi__label">Revenue</div>
                            <div className="kpi__value">{toCurrency(kpi.revenue)} lei</div>
                        </div>
                        <div className="kpi">
                            <div className="kpi__label">Units sold</div>
                            <div className="kpi__value">{kpi.units}</div>
                        </div>
                        <div className="kpi">
                            <div className="kpi__label">Avg / day</div>
                            <div className="kpi__value">{toCurrency(kpi.avgPerDay)} lei</div>
                        </div>
                    </div>

                    <div className="chart-card">
                        {loading ? (
                            <div className="empty">Loading chart…</div>
                        ) : !chartData.length ? (
                            <div className="empty">No data in selected range.</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={360}>
                                <LineChart data={chartData} margin={{ top: 16, right: 24, bottom: 8, left: 8 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip />
                                    <Legend />
                                    {/* One line per selected product */}
                                    {selectedIds.map((pid, idx) => (
                                        <Line
                                            key={pid}
                                            type="monotone"
                                            dataKey={pid}
                                            name={productMap[pid]?.name || `#${pid}`}
                                            dot={false}
                                            strokeWidth={2}
                                        />
                                    ))}
                                    {/* Optional: overall total qty as a faint line */}
                                    <Line type="monotone" dataKey="totalQty" name="Total qty" strokeWidth={1} dot={false} strokeOpacity={0.4} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                <div className="sales-right">
                    <h4 className="mb8">Products</h4>
                    {loadingProducts ? (
                        <div className="empty small">Loading products…</div>
                    ) : (
                        <MultiSelect
                            options={products}
                            selected={selectedIds}
                            onChange={setSelectedIds}
                            search={search}
                            setSearch={setSearch}
                        />
                    )}

                    {/* Quick numbers per selected product */}
                    <div className="mini-table">
                        <div className="mini-head">
                            <span>Product</span><span>Units</span><span>Revenue</span>
                        </div>
                        {selectedIds.map(pid => {
                            const units = sum(chartData.map(r => r[pid] || 0));
                            const rev = sum(seriesDates.map(d => byDate[d]?.[pid]?.revenue || 0));
                            return (
                                <div key={pid} className="mini-row">
                                    <span>{productMap[pid]?.name ?? `#${pid}`}</span>
                                    <span>{units}</span>
                                    <span>{toCurrency(rev)}</span>
                                </div>
                            );
                        })}
                        {selectedIds.length === 0 && <div className="empty small">Select at least one product.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
}

function fmtDate(d) {
    return new Date(d).toISOString().slice(0, 10); // YYYY-MM-DD
}

function defaultRange() {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 29);
    return { from: fmtDate(from), to: fmtDate(to) };
}

function sum(arr) { return arr.reduce((s, x) => s + x, 0); }
function toCurrency(v) { return (Math.round((v ?? 0) * 100) / 100).toFixed(2); }

/** Normalize various backend shapes to:
 * {
 *   seriesDates: ["2025-08-01", ...],
 *   byDate: { "2025-08-01": { [productId]: { qty, revenue } } },
 * }
 */
function normalizeSales(raw) {
    const days = Array.isArray(raw?.days) ? raw.days : Array.isArray(raw) ? raw : [];
    const byDate = {};
    const seriesDates = [];

    // Case A: row-per-product-per-day
    const looksLikeRows = days.length && days[0]?.productId != null;
    if (looksLikeRows || (Array.isArray(raw) && raw[0]?.productId != null)) {
        const rows = days.length ? days : raw;
        rows.forEach(r => {
            const d = fmtDate(r.date);
            if (!byDate[d]) byDate[d] = {};
            const pid = String(r.productId);
            if (!byDate[d][pid]) byDate[d][pid] = { qty: 0, revenue: 0 };
            byDate[d][pid].qty += (+r.qty || 0);
            byDate[d][pid].revenue += (+r.revenue || 0);
            if (!seriesDates.includes(d)) seriesDates.push(d);
        });
        seriesDates.sort();
        return { seriesDates, byDate };
    }

    // Case B: totals-per-day object
    const list = days.length ? days : raw;
    list.forEach(row => {
        const d = fmtDate(row.date);
        if (!byDate[d]) byDate[d] = {};
        const totals = row.totals || {};
        const revs = row.revenue || {};
        Object.keys(totals).forEach(pid => {
            byDate[d][pid] = {
                qty: (+totals[pid] || 0),
                revenue: (+revs[pid] || 0),
            };
        });
        if (!seriesDates.includes(d)) seriesDates.push(d);
    });

    seriesDates.sort();
    return { seriesDates, byDate };
}

function buildChartData(seriesDates, byDate, productIds) {
    // Recharts expects [{ date, [pid1]: qty, [pid2]: qty, totalQty, totalRevenue }, ...]
    return seriesDates.map(d => {
        const row = { date: d, totalQty: 0, totalRevenue: 0 };
        productIds.forEach(pid => {
            const cell = byDate[d]?.[pid];
            row[pid] = cell?.qty ?? 0;
            row.totalQty += (cell?.qty ?? 0);
            row.totalRevenue += (cell?.revenue ?? 0);
        });
        return row;
    });
}

function useProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const res = await fetch("http://localhost:8080/reports/coffees?includeArchived=true");
                const data = await res.json();
                setProducts(Array.isArray(data) ? data : []);
            } catch (e) {
                console.error("Failed to load products", e);
                setProducts([]);
            } finally {
                setLoading(false);
            }
        })();
    }, []);
    return { products, loading };
}

function MultiSelect({ options, selected, onChange, search, setSearch }) {
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return options;
        return options.filter(o => `${o.name} ${o.id}`.toLowerCase().includes(q));
    }, [options, search]);

    const toggle = (id) => {
        onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
    };

    const allIds = filtered.map(o => String(o.id));
    const allSelectedInView = allIds.every(id => selected.includes(id)) && allIds.length > 0;

    const toggleAllInView = () => {
        if (allSelectedInView) {
            onChange(selected.filter(id => !allIds.includes(id)));
        } else {
            const merged = new Set([...selected, ...allIds]);
            onChange([...merged]);
        }
    };

    return (
        <div className="multiselect">
            <div className="multiselect__bar">
                <input
                    placeholder="Search products…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <button className="ap-btn" onClick={toggleAllInView}>
                    {allSelectedInView ? "Unselect shown" : "Select shown"}
                </button>
            </div>
            <div className="multiselect__list">
                {filtered.map(o => (
                    <label key={o.id} className="multiselect__item">
                        <input
                            type="checkbox"
                            checked={selected.includes(String(o.id))}
                            onChange={() => toggle(String(o.id))}
                        />
                        <span className="name">{o.name}</span>
                        <span className="badge">#{o.id}</span>
                    </label>
                ))}
                {filtered.length === 0 && <div className="empty small">No products match.</div>}
            </div>
        </div>
    );
}


export default function AdminPage() {
    const [tab, setTab] = useState(0);
    return (
        <div className="admin">
            <header className="admin__header">
                <h1>Admin</h1>
                <Tabs value={tab} onChange={setTab} />
            </header>
            <main className="admin__content">
                {tab === 0 && <CoffeesTab />}
                {tab === 1 && <UsersTab />}
                {tab === 2 && <SalesTab />}
            </main>
        </div>
    );
}