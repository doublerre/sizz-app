import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { Banknote, CreditCard, Printer, Ticket, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../components/SideBarBox";
import { useAuth } from "../context/AuthContext";
import { ticketbootService, type ShiftSummary } from "../services/ticketboot.service";
import "./CashClosing.css";

const money = (value: number) =>
  `$${Number(value ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const dateTime = (value: string | null) =>
  value ? new Date(value).toLocaleString("es-MX") : "—";

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);

const getErrorMessage = (error: unknown) =>
  isAxiosError<{ message?: string }>(error)
    ? error.response?.data?.message ?? "No se pudo completar la operación. Inténtalo de nuevo."
    : "No se pudo completar la operación. Inténtalo de nuevo.";

const buildReportHtml = (summary: ShiftSummary, cashierName: string) => {
  const categoryRows = summary.ticketCategories.length
    ? summary.ticketCategories
        .map(
          (category) => `
            <tr>
              <td>${escapeHtml(category.name)}</td>
              <td>${category.ticketCount} boletos</td>
            </tr>`,
        )
        .join("")
    : `
      <tr>
        <td colspan="2" style="text-align:center; padding: 1rem;">Sin boletos vendidos en este turno.</td>
      </tr>`;
  const cancellationRow = `
    <tr>
      <td>Ventas canceladas</td>
      <td>${summary.cancellationCount} ventas</td>
    </tr>`;

  return `<!doctype html>
  <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <title>Corte de caja</title>
      <style>
        body { font-family: Arial, sans-serif; color: #0f1b2d; margin: 24px; }
        h1, h2, h3 { margin: 0 0 12px; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .meta { display: grid; grid-template-columns: repeat(3, minmax(140px, 1fr)); gap: 12px; margin: 20px 0; }
        .meta div { background: #f3f7fb; border: 1px solid #dfeaf3; border-radius: 10px; padding: 12px; }
        .meta span { display: block; font-size: 12px; color: #6b7d90; margin-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { border: 1px solid #dfeaf3; padding: 8px 10px; font-size: 12px; text-align: left; }
        th { background: #edf4fb; }
        .summary { display: grid; grid-template-columns: repeat(2, minmax(180px, 1fr)); gap: 12px; margin-top: 12px; }
        .summary div { background: #f9fbfd; border: 1px solid #dfeaf3; border-radius: 10px; padding: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1>Corte de caja</h1>
          <h3>ZigZag · Taquilla</h3>
        </div>
        <div><strong>${dateTime(new Date().toISOString())}</strong></div>
      </div>

      <div class="meta">
        <div><span>Cajero</span><strong>${cashierName}</strong></div>
        <div><span>Turno</span><strong>${summary.id}</strong></div>
        <div><span>Fondo inicial</span><strong>${money(summary.openingAmount)}</strong></div>
        <div><span>Apertura</span><strong>${dateTime(summary.openedAt)}</strong></div>
        <div><span>Cierre</span><strong>${dateTime(summary.closedAt)}</strong></div>
        <div><span>Ventas netas</span><strong>${money(summary.netSales)}</strong></div>
      </div>

      <div class="summary">
        <div><span>Venta bruta</span><br /><strong>${money(summary.grossSales)}</strong></div>
        <div><span>Ventas canceladas</span><br /><strong>${summary.cancellationCount} · ${money(summary.cancellationTotal)}</strong></div>
        <div><span>Devoluciones registradas</span><br /><strong>${summary.refundCount} · ${money(summary.refundTotal)}</strong></div>
        <div><span>Devoluciones en efectivo</span><br /><strong>${money(summary.cashRefunds)}</strong></div>
        <div><span>Devoluciones con tarjeta</span><br /><strong>${money(summary.cardRefunds)} · Pendientes de terminal</strong></div>
        <div><span>Efectivo esperado</span><br /><strong>${money(summary.expectedCash)}</strong></div>
        <div><span>Efectivo contado</span><br /><strong>${money(summary.countedCash ?? 0)}</strong></div>
        <div><span>Diferencia</span><br /><strong>${money(summary.cashDifference ?? 0)}</strong></div>
        <div><span>Notas</span><br /><strong>${(summary.closingNotes || "Sin observaciones").replace(/</g, "&lt;")}</strong></div>
      </div>

      <h3 style="margin-top: 24px;">Resumen agrupado</h3>
      <table>
        <thead>
          <tr>
            <th>Categoría / concepto</th>
            <th>Cantidad</th>
          </tr>
        </thead>
        <tbody>${categoryRows}${cancellationRow}</tbody>
      </table>
    </body>
  </html>`;
};

export default function CashClosing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [summary, setSummary] = useState<ShiftSummary | null>(null);
  const [counted, setCounted] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasCountedError, setHasCountedError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let isActive = true;

    const loadShift = async () => {
      try {
        const dashboardData = await ticketbootService.getDashboard();
        if (!isActive) return;

        if (!dashboardData.activeShift) {
          setSummary(null);
          setCounted("");
          setNotes("");
          return;
        }

        const loadedSummary = await ticketbootService.getShiftSummary(dashboardData.activeShift.id);
        if (!isActive) return;

        setSummary(loadedSummary);
        setCounted(String(loadedSummary.countedCash ?? loadedSummary.expectedCash));
        setNotes(loadedSummary.closingNotes ?? "");
      } catch (requestError) {
        if (!isActive) return;
        setLoadError(getErrorMessage(requestError));
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    loadShift();

    return () => {
      isActive = false;
    };
  }, [loadAttempt]);

  const countedAmount = Number(counted);
  const isCountedValid =
    counted.trim() !== "" && Number.isFinite(countedAmount) && countedAmount >= 0;
  const difference = summary && isCountedValid ? countedAmount - summary.expectedCash : null;
  const isClosed = Boolean(summary?.closedAt);

  const displayedCards = useMemo(() => {
    if (!summary) {
      return [
        { label: "Ventas del turno", value: "$ 0.00", meta: "Sin turno activo", icon: Banknote, iconClass: "cash-icon--green" },
        { label: "Efectivo en caja", value: "$ 0.00", meta: "Sin movimiento", icon: Wallet, iconClass: "cash-icon--blue" },
        { label: "Pagos con tarjeta", value: "$ 0.00", meta: "Sin operaciones", icon: CreditCard, iconClass: "cash-icon--yellow" },
      ];
    }

    return [
      { label: "Ventas del turno", value: money(summary.grossSales), meta: `${summary.ticketCount} boletos emitidos`, icon: Banknote, iconClass: "cash-icon--green" },
      { label: "Efectivo en caja", value: money(summary.expectedCash), meta: "Fondo inicial incluido", icon: Wallet, iconClass: "cash-icon--blue" },
      { label: "Pagos con tarjeta", value: money(summary.cardSales), meta: `${summary.salesCount} operaciones`, icon: CreditCard, iconClass: "cash-icon--yellow" },
    ];
  }, [summary]);

  const handleCloseShift = async () => {
    if (!summary || !isCountedValid || isClosing) {
      setHasCountedError(true);
      return;
    }

    setIsClosing(true);
    setError(null);

    try {
      const closedSummary = await ticketbootService.closeShift(summary.id, {
        countedAmount,
        notes: notes.trim() || null,
      });

      setSummary(closedSummary);
      setCounted(String(closedSummary.countedCash ?? countedAmount));
      setNotes(closedSummary.closingNotes ?? "");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsClosing(false);
    }
  };

  const handlePrint = () => {
    if (!summary) return;

    const reportWindow = window.open("", "_blank", "width=900,height=700");
    if (!reportWindow) {
      setError("No se pudo abrir la ventana del reporte. Desactiva el bloqueo de ventanas emergentes.");
      return;
    }

    const cashierName = summary.cashierName ?? user?.sub ?? "Cajero";
    reportWindow.document.write(buildReportHtml(summary, cashierName));
    reportWindow.document.close();
    reportWindow.addEventListener("afterprint", () => {
      reportWindow.close();
      navigate("/taquilla/inicio-turno", { replace: true });
    }, { once: true });
    reportWindow.focus();
    setTimeout(() => reportWindow.print(), 300);
  };

  if (isLoading) {
    return (
      <div className="cash-closing-page">
        <Sidebar userName={user?.sub ?? "Cajero"} userRole="Taquilla" />
        <main className="cash-closing-main">
          <header className="cash-closing-header">
            <h1>Corte de caja</h1>
            <p>Cargando turno...</p>
          </header>
          <div className="cash-closing-body">
            <div className="cash-closing-layout">
              <section className="cash-closing-panel">
                <p className="cash-closing-date">Cargando datos del turno abierto...</p>
              </section>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="cash-closing-page">
        <Sidebar userName={user?.sub ?? "Cajero"} userRole="Taquilla" />
        <main className="cash-closing-main">
          <header className="cash-closing-header">
            <h1>Corte de caja</h1>
            <p>No se pudo consultar el turno.</p>
          </header>
          <div className="cash-closing-body">
            <div className="cash-closing-panel" style={{ maxWidth: "720px" }}>
              <p className="cash-count-error" role="alert">{loadError}</p>
              <button
                type="button"
                className="cash-close-button"
                onClick={() => {
                  setLoadError(null);
                  setIsLoading(true);
                  setLoadAttempt((attempt) => attempt + 1);
                }}
                style={{ marginTop: "1.5rem" }}
              >
                Reintentar consulta
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="cash-closing-page">
        <Sidebar userName={user?.sub ?? "Cajero"} userRole="Taquilla" />
        <main className="cash-closing-main">
          <header className="cash-closing-header">
            <h1>Corte de caja</h1>
            <p>No hay un turno abierto para cerrar.</p>
          </header>
          <div className="cash-closing-body">
            <div className="cash-closing-panel" style={{ maxWidth: "720px" }}>
              <h2 className="cash-closing-section-title">Sin turno activo</h2>
              <p className="cash-closing-date">Abre un turno de caja para poder revisar ventas, efectivo y cerrar el día.</p>
              <button type="button" className="cash-close-button" onClick={() => navigate("/taquilla/inicio-turno")} style={{ marginTop: "1.5rem" }}>
                Ir a inicio de turno
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const paymentRows = [
    { label: "Efectivo", amount: money(summary.cashSales), className: "cash-amount--green", iconClass: "cash-icon--green", icon: Banknote },
    { label: "Tarjeta", amount: money(summary.cardSales), className: "cash-amount--blue", iconClass: "cash-icon--blue", icon: CreditCard },
    { label: "Cortesía", amount: `${summary.sales.filter((sale) => sale.total === 0 && sale.status === "COMPLETED").reduce((ticketTotal, sale) => ticketTotal + sale.ticketCount, 0)} boletos`, className: "cash-amount--yellow", iconClass: "cash-icon--yellow", icon: Ticket },
  ];

  const differenceClass = difference === null ? "cash-difference cash-difference--ok" : difference >= 0 ? "cash-difference cash-difference--ok" : "cash-difference cash-difference--alert";

  return (
    <div className="cash-closing-page">
      <Sidebar userName={user?.sub ?? "Cajero"} userRole="Taquilla" />

      <main className="cash-closing-main">
        <header className="cash-closing-header">
          <h1>Corte de caja</h1>
          <p>{isClosed ? "Reporte del cierre del turno" : "Revisa el turno antes de cerrarlo"}</p>
        </header>

        <div className="cash-closing-body">
          <div className="cash-closing-layout">
            <section className="cash-closing-panel">
              <h2 className="cash-closing-section-title">{isClosed ? "Reporte del turno" : "Resumen del turno"}</h2>
              <p className="cash-closing-date">{dateTime(summary.openedAt)} · {summary.cashierName ?? user?.sub ?? "Cajero"}</p>

              <div className="cash-summary-grid">
                {displayedCards.map(({ label, value, meta, icon: Icon, iconClass }) => (
                  <div key={label} className="cash-summary-card">
                    <div className={`cash-icon ${iconClass}`}>
                      <Icon size={18} />
                    </div>
                    <div className="cash-summary-copy">
                      <span>{label}</span>
                      <strong>{value}</strong>
                      <span>{meta}</span>
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="cash-breakdown-title">Desglose por forma de pago</h3>
              <div className="cash-payment-list">
                {paymentRows.map(({ label, amount, className, iconClass, icon: Icon }) => (
                  <div key={label} className="cash-payment-row">
                    <div className="cash-payment-label">
                      <div className={`cash-icon ${iconClass}`} style={{ width: 30, height: 30, borderRadius: 8 }}>
                        <Icon size={15} />
                      </div>
                      <p className="cash-closing-date">
                        Devoluciones: {money(summary.refundTotal)} total · {money(summary.cashRefunds)} en efectivo
                        · {money(summary.cardRefunds)} con tarjeta (pendientes de terminal).
                      </p>
                      <span>{label}</span>
                    </div>
                    <strong className={`cash-amount ${className}`}>{amount}</strong>
                  </div>
                ))}
              </div>

              <h3 className="cash-breakdown-title">Conteo físico de efectivo</h3>
              <div className="cash-count">
                <label className="cash-count-field">
                  <span>Efectivo contado (MXN)</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={counted}
                    onChange={(event) => {
                      setCounted(event.target.value);
                      setHasCountedError(false);
                    }}
                    onBlur={() => setHasCountedError(!isCountedValid)}
                    className={hasCountedError ? "cash-count-field-input--error" : ""}
                    disabled={isClosing || isClosed}
                  />
                  {hasCountedError && <small className="cash-count-error">Ingresa un importe válido igual o mayor a cero.</small>}
                </label>

                <div className={differenceClass}>
                  <span>Diferencia</span>
                  <strong>{difference === null ? "—" : money(difference)}</strong>
                </div>
              </div>

              {error && <p className="cash-count-error" style={{ marginTop: "0.75rem" }}>{error}</p>}
            </section>

            <aside className="cash-closing-sidebar-card">
              <div>
                <h2>{isClosed ? "Turno cerrado" : "Turno activo"}</h2>

                <div className="cash-closing-stat">
                  <span>{isClosed ? "Cerrado" : "Abierto"}</span>
                  <strong>{isClosed ? dateTime(summary.closedAt) : "09:02"}</strong>
                </div>

                <div className="cash-closing-stat">
                  <span>Caja</span>
                  <strong>Principal 01</strong>
                </div>

                <div className="cash-closing-stat">
                  <span>Cajera</span>
                  <strong>{summary.cashierName ?? user?.sub ?? "Cajero"}</strong>
                </div>

                <div className="cash-closing-stat cash-closing-stat--total">
                  <span>Fondo inicial</span>
                  <strong>{money(summary.openingAmount)}</strong>
                </div>
              </div>

              <div className="cash-closing-observations">
                <label htmlFor="close-notes">Observaciones</label>
                <input
                  id="close-notes"
                  type="text"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Ej. faltante de efectivo, servicio, etc."
                  disabled={isClosing || isClosed}
                />
              </div>

              {!isClosed ? (
                <button
                  type="button"
                  className="cash-close-button"
                  onClick={handleCloseShift}
                  disabled={isClosing || !isCountedValid}
                  style={{ marginTop: "1.5rem" }}
                >
                  {isClosing ? "Cerrando turno..." : "Guardar cierre"}
                </button>
              ) : (
                <button type="button" className="cash-close-button" onClick={handlePrint} style={{ marginTop: "1.5rem" }}>
                  <Printer size={18} /> Imprimir reporte
                </button>
              )}

              <p className="cash-close-note">
                {isClosed ? "Cierre enviado al backend y disponible para impresión." : "Guardar cierre genera el reporte del turno y deja registro del cajero, ventas y cancelaciones."}
              </p>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
