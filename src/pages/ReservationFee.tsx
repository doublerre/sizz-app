import { useState } from "react";
import { ArrowLeft, Banknote, Check, CreditCard, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../components/SideBarBox";
import "./ReservationFee.css";

type PaymentMethod = "cash" | "card" | "mixed";

const reservationItems = [
	{ label: "_", quantity: "_", amount: "_" },
];

const subtotal = 0;
const discount = 0;
const total = subtotal - discount;

const formatCurrency = (value: number) => `$${value.toLocaleString("en-US", {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
})}`;

export default function ReservationFee() {
	const navigate = useNavigate();
	const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>();
	const [receivedAmount, setReceivedAmount] = useState("0");
	const [isConfirmed, setIsConfirmed] = useState(true);

	const received = Number.parseFloat(receivedAmount) || 0;
	const change = Math.max(received - total, 0);

	return (
		<div className="reservation-fee-page">
			<Sidebar userName="_" userRole="_" />

			<main className="reservation-fee-main">
				<header className="reservation-fee-header">
					<button className="reservation-back-button" type="button" onClick={() => navigate(-1)}>
						<ArrowLeft size={18} />
					</button>
					<div>
						<h1>Cobro de reservación</h1>
						<p>Folio  · Solicitud aprobada</p>
					</div>
				</header>

				<div className="reservation-fee-grid">
					<section className="reservation-detail-card">
						<div className="reservation-card-heading">
							<div>
								<h2>Información del grupo</h2>
								<h3>_</h3>
								<p>_</p>
							</div>
							<span className="approval-badge">_</span>
						</div>

						<div className="visit-summary">
							<span>VISITA CONFIRMADA</span>
							<strong>_</strong>
						</div>

						<div className="attendees-section">
							<h2>Desglose de asistentes</h2>
							<div className="attendees-table" role="table" aria-label="Desglose de asistentes">
								<div className="attendees-row attendees-header" role="row">
									<span>TIPO</span><span>CANTIDAD</span><span>IMPORTE</span>
								</div>
								{reservationItems.map((item) => (
									<div className="attendees-row" role="row" key={item.label}>
										<strong>{item.label}</strong><strong>{item.quantity}</strong><strong>{item.amount}</strong>
									</div>
								))}
							</div>
						</div>

						<div className="discount-summary">
							<div>
								<span>DESCUENTO AUTORIZADO POR OFICIO</span>
								<strong>_</strong>
							</div>
							<strong>- {formatCurrency(discount)}</strong>
						</div>

						<p className="expected-visitors">Visitantes esperados:_</p>
					</section>

					<aside className="reservation-payment-card">
						<h2>Resumen de cobro</h2>

						<div className="payment-totals">
							<div><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></div>
							<div><span>Descuento por oficio</span><strong className="discount-value">- {formatCurrency(discount)}</strong></div>
							<div className="total-divider"><span>Total a cobrar</span><strong>{formatCurrency(total)}</strong></div>
						</div>

						<div className="payment-method-section">
							<span className="payment-label">MÉTODO DE PAGO</span>
							<div className="payment-methods" role="group" aria-label="Método de pago">
								<button className={paymentMethod === "cash" ? "selected" : ""} type="button" onClick={() => setPaymentMethod("cash")}><Banknote size={16} />Efectivo</button>
								<button className={paymentMethod === "card" ? "selected" : ""} type="button" onClick={() => setPaymentMethod("card")}><CreditCard size={16} />Tarjeta</button>
								<button className={paymentMethod === "mixed" ? "selected" : ""} type="button" onClick={() => setPaymentMethod("mixed")}><Wallet size={16} />Mixto</button>
							</div>
						</div>

						<label className="received-input">
							<span>Importe recibido</span>
							<input type="number" min="0" step="0.01" value={receivedAmount} onChange={(event) => setReceivedAmount(event.target.value)} />
						</label>

						<div className="change-summary"><span>CAMBIO</span><strong>{formatCurrency(change)}</strong></div>

						<label className="confirmation-check">
							<input type="checkbox" checked={isConfirmed} onChange={(event) => setIsConfirmed(event.target.checked)} />
							<span className="check-icon"><Check size={13} strokeWidth={3} /></span>
							<span>Confirmo el desglose y el oficio</span>
						</label>

						<button className="charge-button" type="button" disabled={!isConfirmed || received < total} onClick={() => navigate("/taquilla/saleComplete")}>
							Cobrar e imprimir boletos
						</button>
						<p className="print-note">Se imprimirán _ boletos térmicos</p>
					</aside>
				</div>
			</main>
		</div>
	);
}

