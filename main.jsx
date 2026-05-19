import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertTriangle, Bell, CalendarDays, CheckCircle, Clock, DatabaseBackup,
  Edit, Eye, FileText, Lock, LogOut, Mail, Paperclip, Plus, QrCode, Search,
  ShieldCheck, Trash2, TrendingDown, TrendingUp, UploadCloud, User, Users,
  Wallet, Save
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell
} from "recharts";
import { QRCodeSVG } from "qrcode.react";
import "./style.css";

const STORAGE_KEY = "gpsruta_sistema_sin_src_v1";
const SESSION_KEY = "gpsruta_login";
const PASS = "1234";

const seed = {
  clients: [
    { id: 1, nombre: "Transportes del Sur SpA", rut: "76.543.210-9", telefono: "56912345678", email: "contacto@delsur.cl", direccion: "Av. Los Pinos 1234, Santiago", contacto: "Juan Pérez" },
    { id: 2, nombre: "Constructora Andes Ltda.", rut: "77.555.333-1", telefono: "56998765432", email: "pagos@andes.cl", direccion: "San Carlos, Ñuble", contacto: "María Torres" }
  ],
  invoices: [
    { id: 1, clienteId: 1, factura: "FAC-2026-001", emision: "2026-05-01", vencimiento: "2026-05-18", monto: 1250000, estado: "Por vencer", detalle: "Servicio GPS mensual" },
    { id: 2, clienteId: 2, factura: "FAC-2026-002", emision: "2026-04-20", vencimiento: "2026-05-10", monto: 2850000, estado: "Vencida", detalle: "Instalación y monitoreo" },
    { id: 3, clienteId: 1, factura: "FAC-2026-003", emision: "2026-05-04", vencimiento: "2026-05-26", monto: 950000, estado: "Pagada", detalle: "Mantención plataforma" }
  ],
  transactions: [
    { id: 1, tipo: "Ingreso", fecha: "2026-05-10", categoria: "Pago factura", descripcion: "Pago FAC-2026-003", monto: 950000 },
    { id: 2, tipo: "Egreso", fecha: "2026-05-11", categoria: "Servidor", descripcion: "Pago sistema", monto: 180000 }
  ],
  attachments: {}
};

const money = (value) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(Number(value || 0));

const today = () => new Date().toISOString().slice(0, 10);

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : seed;
  } catch {
    return seed;
  }
}

function daysUntil(date) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(`${date}T00:00:00`);
  return Math.ceil((due - now) / 86400000);
}

function invoiceStatus(invoice) {
  if (invoice.estado === "Pagada") return { label: "Pagada", cls: "ok", icon: CheckCircle };
  const d = daysUntil(invoice.vencimiento);
  if (invoice.estado === "Vencida" || d < 0) return { label: "Vencida", cls: "bad", icon: AlertTriangle };
  if (d <= 3 && d >= 0) return { label: "Por vencer", cls: "warn", icon: Clock };
  return { label: "Pendiente", cls: "soft", icon: FileText };
}

function buildWhatsApp(invoice, client) {
  const d = daysUntil(invoice.vencimiento);
  const aviso = d === 3 ? "FALTAN 3 DÍAS para el vencimiento" : d === 0 ? "vence HOY" : d < 0 ? "está VENCIDA" : `vence en ${d} días`;
  const text = `Hola ${client?.nombre || "cliente"}, recordamos factura ${invoice.factura} por ${money(invoice.monto)}: ${aviso}. Vencimiento: ${invoice.vencimiento}. GPSruta.cl`;
  return `https://wa.me/${client?.telefono || ""}?text=${encodeURIComponent(text)}`;
}

function buildEmail(invoice, client) {
  const subject = `Recordatorio de cobro - Factura ${invoice.factura}`;
  const body = `Estimado/a ${client?.nombre || "cliente"}:\n\nRecordamos la factura ${invoice.factura} por ${money(invoice.monto)}.\nFecha de vencimiento: ${invoice.vencimiento}\n\nFavor confirmar pago.\n\nGPSruta.cl`;
  return `mailto:${client?.email || ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 32 32" width="18" height="18">
      <path fill="currentColor" d="M16.04 3C8.86 3 3 8.84 3 16.02c0 2.3.6 4.54 1.75 6.51L3 29l6.64-1.7a12.95 12.95 0 0 0 6.4 1.64h.01C23.22 28.94 29 23.1 29 15.92 29 8.8 23.18 3 16.04 3Zm7.56 18.45c-.32.9-1.86 1.7-2.6 1.8-.67.1-1.52.14-2.45-.15-.56-.18-1.28-.42-2.2-.82-3.87-1.68-6.4-5.6-6.6-5.86-.2-.26-1.58-2.1-1.58-4s1-2.84 1.35-3.23c.36-.4.78-.5 1.04-.5h.75c.24.01.57-.09.9.69.32.78 1.1 2.69 1.2 2.89.1.2.16.43.03.69-.13.26-.2.42-.4.64-.2.23-.42.5-.6.67-.2.2-.4.42-.17.82.23.4 1.02 1.68 2.2 2.72 1.51 1.35 2.78 1.77 3.18 1.97.4.2.63.17.86-.1.23-.26 1-1.16 1.26-1.56.26-.4.53-.33.9-.2.36.13 2.3 1.08 2.7 1.28.4.2.66.3.76.46.1.16.1.95-.22 1.85Z"/>
    </svg>
  );
}

function Logo() {
  return (
    <div className="logoText">
      <div className="target">◎</div>
      <div>
        <h1><span>GPS</span><b>ruta</b><small>.cl</small></h1>
        <p>SEGUIMIENTO Y SEGURIDAD</p>
      </div>
    </div>
  );
}

function QR({ client }) {
  const value = JSON.stringify({
    empresa: client.nombre,
    rut: client.rut,
    contacto: client.contacto,
    telefono: client.telefono,
    email: client.email,
    direccion: client.direccion,
    sistema: "GPSruta.cl"
  });

  return (
    <div className="qrReal">
      <QRCodeSVG
        value={value}
        size={150}
        bgColor="#ffffff"
        fgColor="#000000"
        level="H"
        includeMargin={true}
      />
      <span className="qrOk">QR generado correctamente</span>
    </div>
  );
}



function Login({ onLogin }) {
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  function submit(e) {
    e.preventDefault();
    if (pass === PASS) {
      sessionStorage.setItem(SESSION_KEY, "1");
      onLogin();
    } else {
      setError("Clave incorrecta. Clave demo: 1234");
    }
  }

  return (
    <div className="loginPage">
      <form className="loginCard" onSubmit={submit}>
        <Logo />
        <h2>Ingreso Seguro</h2>
        <p>Sistema profesional de cobranza</p>
        <div className="loginInput">
          <Lock size={18} />
          <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Clave de acceso" />
        </div>
        {error && <div className="error">{error}</div>}
        <button className="primary full"><ShieldCheck size={18} /> Ingresar</button>
      </form>
    </div>
  );
}

function Kpi({ title, value, subtitle, icon: Icon, tone = "green" }) {
  return (
    <div className="card kpi">
      <div className={`kpiIcon ${tone}`}><Icon size={32} /></div>
      <div>
        <small>{title}</small>
        <h3>{value}</h3>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}

function FormFields({ obj, setObj, fields }) {
  return (
    <div className="formGrid">
      {fields.map((field) => (
        <input
          key={field}
          value={obj[field] || ""}
          onChange={(e) => setObj({ ...obj, [field]: e.target.value })}
          placeholder={field.toUpperCase()}
          type={["fecha", "emision", "vencimiento"].includes(field) ? "date" : field === "monto" ? "number" : "text"}
        />
      ))}
    </div>
  );
}

function InvoiceTable({ invoices, clientById, editInvoice, deleteInvoice }) {
  return (
    <div className="tableWrap">
      <table>
        <thead>
          <tr>
            <th>Factura</th>
            <th>Cliente</th>
            <th>Vence</th>
            <th>Monto</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => {
            const client = clientById(invoice.clienteId);
            const st = invoiceStatus(invoice);
            const Icon = st.icon;
            return (
              <tr key={invoice.id}>
                <td><b>{invoice.factura}</b></td>
                <td>{client?.nombre}</td>
                <td>{invoice.vencimiento}</td>
                <td>{money(invoice.monto)}</td>
                <td><span className={`status ${st.cls}`}><Icon size={14} /> {st.label}</span></td>
                <td>
                  <div className="actions">
                    <a className="icon whatsapp" href={buildWhatsApp(invoice, client)} target="_blank" rel="noreferrer"><WhatsAppIcon /></a>
                    <a className="icon mail" href={buildEmail(invoice, client)}><Mail size={17} /></a>
                    <button className="icon edit" onClick={() => editInvoice(invoice)}><Edit size={17} /></button>
                    <button className="icon trash" onClick={() => deleteInvoice(invoice.id)}><Trash2 size={17} /></button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function App() {
  const [logged, setLogged] = useState(() => sessionStorage.getItem(SESSION_KEY) === "1");
  const [data, setData] = useState(loadData);
  const [tab, setTab] = useState("dashboard");
  const [clock, setClock] = useState(new Date());
  const [search, setSearch] = useState("");
  const [alertSearch, setAlertSearch] = useState("");
  const [savedAt, setSavedAt] = useState("Sin cambios");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  const [clientForm, setClientForm] = useState({ nombre: "", rut: "", telefono: "569", email: "", direccion: "", contacto: "" });
  const [invoiceForm, setInvoiceForm] = useState({ clienteId: "", factura: "", emision: new Date().toISOString().slice(0, 10), vencimiento: new Date().toISOString().slice(0, 10), monto: "", estado: "Pendiente", detalle: "" });
  const [txForm, setTxForm] = useState({ tipo: "Ingreso", fecha: new Date().toISOString().slice(0, 10), categoria: "", descripcion: "", monto: "" });

  const [editingClient, setEditingClient] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setSavedAt(new Date().toLocaleTimeString("es-CL"));
  }, [data]);

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const clientById = (id) => data.clients.find((c) => Number(c.id) === Number(id));

  const stats = useMemo(() => {
    const ingresos = data.transactions.filter((t) => t.tipo === "Ingreso").reduce((s, t) => s + Number(t.monto), 0);
    const egresos = data.transactions.filter((t) => t.tipo === "Egreso").reduce((s, t) => s + Number(t.monto), 0);
    return { ingresos, egresos, saldo: ingresos - egresos };
  }, [data]);

  const filteredClients = data.clients.filter((c) => `${c.nombre} ${c.rut} ${c.email}`.toLowerCase().includes(search.toLowerCase()));
  const filteredInvoices = data.invoices.filter((i) => `${i.factura} ${clientById(i.clienteId)?.nombre || ""}`.toLowerCase().includes(search.toLowerCase()));

  const alertInvoices = data.invoices
    .filter((i) => ["Vencida", "Por vencer"].includes(invoiceStatus(i).label) || daysUntil(i.vencimiento) === 3)
    .filter((i) => `${i.factura} ${clientById(i.clienteId)?.nombre || ""}`.toLowerCase().includes(alertSearch.toLowerCase()));

  const selectedInvoice = selectedInvoiceId ? data.invoices.find((i) => i.id === selectedInvoiceId) : alertInvoices[0];
  const selectedClient = selectedInvoice ? clientById(selectedInvoice.clienteId) : null;

  const chart = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago"].map((mes, i) => ({
    mes,
    ingresos: Math.round(stats.ingresos * (0.5 + i * 0.08)),
    egresos: Math.round(stats.egresos * (0.5 + i * 0.05))
  }));

  const pie = [
    { name: "Pagadas", value: data.invoices.filter((i) => invoiceStatus(i).label === "Pagada").length },
    { name: "Pendientes", value: data.invoices.filter((i) => invoiceStatus(i).label === "Pendiente").length },
    { name: "Por vencer", value: data.invoices.filter((i) => invoiceStatus(i).label === "Por vencer").length },
    { name: "Vencidas", value: data.invoices.filter((i) => invoiceStatus(i).label === "Vencida").length }
  ];

  function saveClient() {
    if (!clientForm.nombre || !clientForm.rut) return;
    if (editingClient) {
      setData({ ...data, clients: data.clients.map((c) => c.id === editingClient ? { ...clientForm, id: editingClient } : c) });
      setEditingClient(null);
    } else {
      setData({ ...data, clients: [{ ...clientForm, id: Date.now() }, ...data.clients] });
    }
    setClientForm({ nombre: "", rut: "", telefono: "569", email: "", direccion: "", contacto: "" });
  }

  function editClient(client) {
    setEditingClient(client.id);
    setClientForm(client);
    setTab("clientes");
  }

  function deleteClient(id) {
    setData({ ...data, clients: data.clients.filter((c) => c.id !== id), invoices: data.invoices.filter((i) => Number(i.clienteId) !== Number(id)) });
  }

  function saveInvoice() {
    if (!invoiceForm.clienteId || !invoiceForm.factura || !invoiceForm.monto) return;
    const payload = { ...invoiceForm, id: editingInvoice || Date.now(), clienteId: Number(invoiceForm.clienteId), monto: Number(invoiceForm.monto) };
    if (editingInvoice) {
      setData({ ...data, invoices: data.invoices.map((i) => i.id === editingInvoice ? payload : i) });
      setEditingInvoice(null);
    } else {
      setData({ ...data, invoices: [payload, ...data.invoices] });
    }
    setInvoiceForm({ clienteId: "", factura: "", emision: new Date().toISOString().slice(0, 10), vencimiento: new Date().toISOString().slice(0, 10), monto: "", estado: "Pendiente", detalle: "" });
  }

  function editInvoice(invoice) {
    setEditingInvoice(invoice.id);
    setInvoiceForm({ ...invoice, clienteId: String(invoice.clienteId) });
    setTab("facturas");
  }

  function deleteInvoice(id) {
    const attachments = { ...(data.attachments || {}) };
    delete attachments[id];
    setData({ ...data, invoices: data.invoices.filter((i) => i.id !== id), attachments });
  }

  function saveTx() {
    if (!txForm.categoria || !txForm.monto) return;
    setData({ ...data, transactions: [{ ...txForm, id: Date.now(), monto: Number(txForm.monto) }, ...data.transactions] });
    setTxForm({ tipo: "Ingreso", fecha: new Date().toISOString().slice(0, 10), categoria: "", descripcion: "", monto: "" });
  }

  function attachFile(invoiceId, file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setData({
        ...data,
        attachments: {
          ...(data.attachments || {}),
          [invoiceId]: {
            name: file.name,
            size: file.size,
            type: file.type,
            dataUrl: reader.result,
            attachedAt: new Date().toLocaleString("es-CL")
          }
        }
      });
    };
    reader.readAsDataURL(file);
  }

  function removeFile(invoiceId) {
    const attachments = { ...(data.attachments || {}) };
    delete attachments[invoiceId];
    setData({ ...data, attachments });
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    setLogged(false);
  }

  if (!logged) return <Login onLogin={() => setLogged(true)} />;

  return (
    <div className="app">
      <aside>
        <Logo />
        <div className="admin"><User size={24} /><div><b>Administrador</b><p>admin@gpsruta.cl</p></div></div>
        <nav>
          {[
            ["dashboard", "Dashboard", Eye],
            ["clientes", "Clientes", Users],
            ["facturas", "Facturas", FileText],
            ["movimientos", "Ingresos / Egresos", Wallet],
            ["qr", "QR Clientes", QrCode],
            ["alertas", "Cobros / Recordatorios", Bell]
          ].map(([value, label, Icon]) => (
            <button key={value} onClick={() => setTab(value)} className={tab === value ? "active" : ""}>
              <Icon size={20} /> {label}
            </button>
          ))}
        </nav>
        <div className="autosave"><CheckCircle size={20} /><div><b>Guardado automático activo</b><p>Último guardado: {savedAt}</p></div></div>
        <button className="logout" onClick={logout}><LogOut size={19} /> Cerrar sesión</button>
      </aside>

      <main>
        <header>
          <div className="search"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar cliente o factura..." /></div>
          <div className="chips">
            <span><CalendarDays size={17} /> {clock.toLocaleDateString("es-CL")}</span>
            <span><Clock size={17} /> {clock.toLocaleTimeString("es-CL")}</span>
            <span className="green"><Save size={17} /> Guardado automático</span>
          </div>
        </header>

        <section className="kpis">
          <Kpi title="Clientes" value={data.clients.length} subtitle="Activos" icon={Users} />
          <Kpi title="Facturas" value={data.invoices.length} subtitle="Totales" icon={FileText} tone="blue" />
          <Kpi title="Ingresos" value={money(stats.ingresos)} subtitle="Total ingresos" icon={TrendingUp} />
          <Kpi title="Egresos" value={money(stats.egresos)} subtitle="Total egresos" icon={TrendingDown} tone="red" />
          <Kpi title="Saldo neto" value={money(stats.saldo)} subtitle="Balance general" icon={Wallet} tone="gold" />
        </section>

        {tab === "dashboard" && (
          <section className="gridDash">
            <div className="card wide">
              <h2>Resumen financiero</h2>
              <div className="chart">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chart}>
                    <CartesianGrid stroke="rgba(255,255,255,.08)" />
                    <XAxis dataKey="mes" stroke="#ccc" />
                    <YAxis stroke="#ccc" />
                    <Tooltip contentStyle={{ background: "#050505", border: "1px solid #00a3ff" }} />
                    <Area dataKey="ingresos" stroke="#7CFC00" fill="rgba(124,252,0,.25)" strokeWidth={3} />
                    <Area dataKey="egresos" stroke="#ff3131" fill="rgba(255,49,49,.18)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <h2>Estado de facturas</h2>
              <div className="chart">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95}>
                      {pie.map((_, i) => <Cell key={i} fill={["#7CFC00", "#FFD43B", "#ff9500", "#ff3131"][i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#050505", border: "1px solid #00a3ff" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card wide">
              <h2>Facturas recientes</h2>
              <InvoiceTable invoices={filteredInvoices.slice(0, 6)} clientById={clientById} editInvoice={editInvoice} deleteInvoice={deleteInvoice} />
            </div>

            <div className="card">
              <h2>Cliente destacado</h2>
              {data.clients[0] && (
                <>
                  <QR client={data.clients[0]} />
                  <h3>{data.clients[0].nombre}</h3>
                  <p>{data.clients[0].rut}</p>
                  <button className="primary outline" onClick={() => editClient(data.clients[0])}><Edit size={17} /> Editar</button>
                </>
              )}
            </div>
          </section>
        )}

        {tab === "clientes" && (
          <section className="two">
            <div className="card">
              <h2>{editingClient ? "Editar cliente" : "Nuevo cliente"}</h2>
              <FormFields obj={clientForm} setObj={setClientForm} fields={["nombre", "rut", "telefono", "email", "direccion", "contacto"]} />
              <button className="primary" onClick={saveClient}><Plus size={17} /> Guardar cliente</button>
            </div>
            <div className="cards">
              {filteredClients.map((client) => (
                <div className="card client" key={client.id}>
                  <QR client={client} />
                  <div>
                    <h3>{client.nombre}</h3>
                    <p>{client.rut}</p>
                    <p>{client.email}</p>
                    <div className="actions">
                      <button className="icon edit" onClick={() => editClient(client)}><Edit size={17} /></button>
                      <button className="icon trash" onClick={() => deleteClient(client.id)}><Trash2 size={17} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === "facturas" && (
          <section className="two">
            <div className="card">
              <h2>{editingInvoice ? "Editar factura" : "Nueva factura"}</h2>
              <select value={invoiceForm.clienteId} onChange={(e) => setInvoiceForm({ ...invoiceForm, clienteId: e.target.value })}>
                <option value="">Seleccionar cliente</option>
                {data.clients.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
              <FormFields obj={invoiceForm} setObj={setInvoiceForm} fields={["factura", "emision", "vencimiento", "monto", "detalle"]} />
              <select value={invoiceForm.estado} onChange={(e) => setInvoiceForm({ ...invoiceForm, estado: e.target.value })}>
                <option>Pendiente</option>
                <option>Por vencer</option>
                <option>Vencida</option>
                <option>Pagada</option>
              </select>
              <button className="primary" onClick={saveInvoice}><Plus size={17} /> Guardar factura</button>
            </div>
            <div className="card">
              <InvoiceTable invoices={filteredInvoices} clientById={clientById} editInvoice={editInvoice} deleteInvoice={deleteInvoice} />
            </div>
          </section>
        )}

        {tab === "movimientos" && (
          <section className="two">
            <div className="card">
              <h2>Ingresos y egresos</h2>
              <select value={txForm.tipo} onChange={(e) => setTxForm({ ...txForm, tipo: e.target.value })}>
                <option>Ingreso</option>
                <option>Egreso</option>
              </select>
              <FormFields obj={txForm} setObj={setTxForm} fields={["fecha", "categoria", "descripcion", "monto"]} />
              <button className="primary gold" onClick={saveTx}><Plus size={17} /> Guardar movimiento</button>
            </div>
            <div className="card">
              <h2>Historial financiero</h2>
              <div className="tableWrap">
                <table>
                  <tbody>
                    {data.transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td className={tx.tipo === "Ingreso" ? "okText" : "badText"}>{tx.tipo}</td>
                        <td>{tx.fecha}</td>
                        <td>{tx.categoria}<small>{tx.descripcion}</small></td>
                        <td>{money(tx.monto)}</td>
                        <td><button className="icon trash" onClick={() => setData({ ...data, transactions: data.transactions.filter((t) => t.id !== tx.id) })}><Trash2 size={17} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {tab === "qr" && (
          <section className="qrGrid">
            {filteredClients.map((client) => (
              <div className="card qrCard" key={client.id}>
                <QR client={client} />
                <h3>{client.nombre}</h3>
                <p>{client.rut}</p>
              </div>
            ))}
          </section>
        )}

        {tab === "alertas" && (
          <section className="alerts">
            <div className="card reminders">
              <h2><Bell size={20} /> Cobros / Recordatorios</h2>
              <div className="search inner"><Search size={17} /><input value={alertSearch} onChange={(e) => setAlertSearch(e.target.value)} placeholder="Buscar factura..." /></div>
              <div className="reminderList">
                {alertInvoices.map((invoice) => {
                  const client = clientById(invoice.clienteId);
                  const st = invoiceStatus(invoice);
                  const Icon = st.icon;
                  return (
                    <button key={invoice.id} className={`reminder ${selectedInvoice?.id === invoice.id ? "selected" : ""}`} onClick={() => setSelectedInvoiceId(invoice.id)}>
                      <Icon className={st.cls} size={24} />
                      <div>
                        <b>{invoice.factura}</b>
                        <p>{client?.nombre}</p>
                        <small>{invoice.vencimiento} · {money(invoice.monto)}</small>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="card attach">
              <h2><Paperclip size={20} /> Adjuntar factura</h2>
              {selectedInvoice ? (
                <>
                  <div className="selected">
                    <b>{selectedInvoice.factura}</b>
                    <p>{selectedClient?.nombre} · {money(selectedInvoice.monto)}</p>
                  </div>
                  <label className="drop">
                    <UploadCloud size={32} />
                    <b>Buscar factura en mi PC</b>
                    <small>PDF, JPG, PNG, DOCX, XLSX</small>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" onChange={(e) => attachFile(selectedInvoice.id, e.target.files?.[0])} />
                  </label>

                  {data.attachments?.[selectedInvoice.id] && (
                    <div className="fileBox">
                      <FileText size={22} />
                      <div>
                        <b>{data.attachments[selectedInvoice.id].name}</b>
                        <p>{(data.attachments[selectedInvoice.id].size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <button className="icon trash" onClick={() => removeFile(selectedInvoice.id)}><Trash2 size={17} /></button>
                    </div>
                  )}

                  <div className="actions big">
                    <a className="send whatsapp" href={buildWhatsApp(selectedInvoice, selectedClient)} target="_blank" rel="noreferrer"><WhatsAppIcon /> WhatsApp</a>
                    <a className="send mail" href={buildEmail(selectedInvoice, selectedClient)}><Mail size={18} /> Correo</a>
                  </div>
                </>
              ) : <p>No hay facturas por cobrar.</p>}
            </div>

            <div className="card backup">
              <DatabaseBackup size={32} />
              <div>
                <h2>Guardado automático activo</h2>
                <p>Todo queda guardado en el navegador y no se borra al salir.</p>
                <b>Último guardado: {savedAt}</b>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
