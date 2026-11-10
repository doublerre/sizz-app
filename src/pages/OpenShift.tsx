import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../components/SideBarBox";
import { useAuth } from "../context/AuthContext";
import { ticketbootService, type ActiveShift } from "../services/ticketboot.service";
import "./OpenShift.css";

const checklist = [
	"Cuenta el efectivo que recibes.",
	"Registra solo el fondo inicial, no las ventas.",
	"Confirma que el importe coincida con lo contado.",
];

const formatCurrency = (value: number) => `$${value.toLocaleString("en-US", {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
})}`;

const formatLongDate = (date: Date) => {
	const text = date.toLocaleDateString("es-MX", {
		weekday: "long",
		day: "numeric",
		month: "long",
		year: "numeric",
	});
	// "viernes, 23 de octubre de 2026" -> "Viernes 23 de octubre de 2026"
	return text.charAt(0).toUpperCase() + text.slice(1).replace(",", "");
};

export default function StartShift() {
	const navigate = useNavigate();
	const { user } = useAuth();
	const [cashRegister, setCashRegister] = useState("");
	const [initialFund, setInitialFund] = useState("");
	const [notes, setNotes] = useState("");
	const [activeShift, setActiveShift] = useState<ActiveShift | null>(null);
	const [isCheckingShift, setIsCheckingShift] = useState(true);
	const [isOpeningShift, setIsOpeningShift] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [touched, setTouched] = useState({ cashRegister: false, initialFund: false });

	useEffect(() => {
		let isActive = true;

		ticketbootService.getDashboard()
			.then((dashboard) => {
				if (isActive) setActiveShift(dashboard.activeShift);
			})
			.catch(() => {
				if (isActive) setError("No se pudo verificar si ya tienes un turno abierto. Intenta de nuevo.");
			})
			.finally(() => {
				if (isActive) setIsCheckingShift(false);
			});

		return () => {
			isActive = false;
		};
	}, []);

	const fund = Number(initialFund);
	const hasCashRegisterError = touched.cashRegister && !cashRegister;
	const hasInitialFundError = touched.initialFund && (!Number.isFinite(fund) || fund <= 0);
	const hasValidationErrors = !cashRegister || !Number.isFinite(fund) || fund <= 0;
	const canOpen = !isCheckingShift && !activeShift && !error && !isOpeningShift && !hasValidationErrors;
	const displayedFund = activeShift?.openingAmount ?? (Number.isFinite(fund) ? fund : 0);

	const handleOpenShift = async () => {
		setTouched({ cashRegister: true, initialFund: true });
		if (!cashRegister || !Number.isFinite(fund) || fund <= 0) {
			return;
		}

		setError(null);
		setIsOpeningShift(true);
		try {
			await ticketbootService.openShift({ openingAmount: fund, notes: notes.trim() || null });
			navigate("/taquilla/dashboard", { replace: true });
		} catch (requestError) {
			const message = isAxiosError<{ message?: string }>(requestError)
				? requestError.response?.data?.message
				: null;
			setError(message ?? "No se pudo abrir el turno. Verifica tu conexión e inténtalo de nuevo.");
		} finally {
			setIsOpeningShift(false);
		}
	};

	return (
		<div className="start-shift-page">
			<Sidebar userName={user?.sub ?? "Cajero"} userRole="Taquilla" />

			<main className="start-shift-main">
				<header className="start-shift-header">
					<div>
						<h1>Iniciar turno</h1>
						<p>{formatLongDate(new Date())} · Taquilla</p>
					</div>
					<span className="shift-status-badge">
						{isCheckingShift ? "Verificando turno" : activeShift ? "Turno abierto" : "Sin turno abierto"}
					</span>
				</header>

				<div className="start-shift-content">
					<div className="start-shift-intro">
						<h2>Todo listo para comenzar</h2>
						<p>Selecciona tu caja y registra el efectivo que recibes antes de vender.</p>
					</div>

					<div className="start-shift-grid">
						<section className="shift-form-card">
							<h2>Apertura de caja</h2>

							<div className="shift-responsible">
								<span>Cuenta responsable del turno</span>
								<strong>{user?.sub ?? "Usuario autenticado"}</strong>
							</div>

							<div className="shift-field">
								<label htmlFor="cash-register">Caja *</label>
								<div className={`select-wrapper ${hasCashRegisterError ? "input-error" : ""}`}>
									<select
										id="cash-register"
										value={cashRegister}
										onChange={(event) => {
											setCashRegister(event.target.value);
											setTouched((current) => ({ ...current, cashRegister: true }));
										}}
										disabled={Boolean(activeShift) || isOpeningShift}
									>
										<option value="">Selecciona una caja</option>
										<option value="Caja 1">Caja 1</option>
										<option value="Caja 2">Caja 2</option>
										<option value="Caja 3">Caja 3</option>
									</select>
								</div>
								{hasCashRegisterError && <small className="field-error">Selecciona una caja.</small>}
							</div>

							<div className="shift-field">
								<label htmlFor="initial-fund">Fondo inicial en efectivo (MXN) *</label>
								<div className={`currency-input ${hasInitialFundError ? "input-error" : ""}`}>
									<span>$</span>
									<input
										id="initial-fund"
										type="number"
										min="0.01"
										step="0.01"
										value={initialFund}
										onChange={(event) => {
											setInitialFund(event.target.value);
											setTouched((current) => ({ ...current, initialFund: true }));
										}}
										disabled={Boolean(activeShift) || isOpeningShift}
									/>
								</div>
								{hasInitialFundError ? (
									<small className="field-error">Ingresa el fondo inicial en efectivo.</small>
								) : (
									<small>Registra el importe contado, no las ventas del día.</small>
								)}
							</div>

							{(touched.cashRegister || touched.initialFund) && hasValidationErrors && (
								<div className="shift-validation-banner" role="alert">
									<strong>Revisa los 2 campos señalados.</strong>
									<span>Selecciona una caja e ingresa un importe válido.</span>
								</div>
							)}

							<div className="shift-field">
								<label htmlFor="notes">Observaciones (opcional)</label>
								<input
									id="notes"
									className="text-input"
									type="text"
									value={notes}
									onChange={(event) => setNotes(event.target.value)}
									maxLength={500}
									disabled={Boolean(activeShift) || isOpeningShift}
								/>
							</div>

							{error && <p className="shift-error" role="alert">{error}</p>}
							{activeShift && (
								<p className="shift-active-message" role="status">
									Ya tienes un turno abierto. Puedes continuar desde el inicio de taquilla.
								</p>
							)}

							<div className="shift-notice">
								<strong>Confirma el efectivo antes de abrir.</strong>
								<p>El fondo se incluirá en el corte al terminar el turno.</p>
							</div>

							<div className="shift-actions">
								<button
									className="open-shift-button"
									type="button"
									disabled={Boolean(activeShift) || isCheckingShift || isOpeningShift}
									onClick={handleOpenShift}
								>
									{isOpeningShift ? "Abriendo turno..." : isCheckingShift ? "Verificando turno..." : activeShift ? "Turno ya abierto" : canOpen ? "Abrir turno" : "Corregir datos"}
								</button>
							</div>
						</section>

						<aside className="shift-side">
							<div className="shift-summary-card">
								<h2>Resumen de apertura</h2>
								<span className="pending-badge">
									{activeShift ? "Turno abierto" : "Pendiente de apertura"}
								</span>

								<div className="summary-item">
									<span>Responsable</span>
									<strong>{activeShift?.cashierName ?? user?.sub ?? "—"}</strong>
								</div>

								<div className="summary-item">
									<span>Caja asignada</span>
									<strong>{cashRegister || "Sin seleccionar"}</strong>
								</div>

								<div className="summary-item">
									<span>Fondo inicial</span>
									<strong className="summary-amount">{formatCurrency(displayedFund)} MXN</strong>
								</div>

								<p className="summary-note">
									{activeShift
										? `Abierto el ${new Date(activeShift.openedAt).toLocaleString("es-MX")}.`
										: "La hora se registra al abrir el turno."}
								</p>
							</div>

							<div className="shift-checklist-card">
								<h2>Antes de abrir</h2>
								<ol>
									{checklist.map((item) => (
										<li key={item}>{item}</li>
									))}
								</ol>
							</div>
						</aside>
					</div>
				</div>
			</main>
		</div>
	);
}