"use client"

import { useRef } from "react"
import { AtSign } from "lucide-react"
import { AuthBanner } from "../../components/AuthBanner";
import "../../General.css";
import "../auth/Register.css";
import "./Verify.css";

// Correo de ejemplo — en integración real vendrá de contexto/props/store
const EMAIL_DESTINO = "maria@email.mx";

export default function Verify() {
    // Referencias a cada caja del código OTP
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Avance automático al escribir un dígito
    const handleOtpInput = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const val = e.target.value.replace(/\D/g, "");
        e.target.value = val.slice(-1);

        if (val && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    // Retroceso al borrar
    const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === "Backspace" && !e.currentTarget.value && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    // Pegar el código completo
    const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        pasted.split("").forEach((char, i) => {
            if (inputRefs.current[i]) {
                inputRefs.current[i]!.value = char;
            }
        });
        inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const code = inputRefs.current.map((r) => r?.value ?? "").join("");
        console.log("Código ingresado:", code);
    };

    return (
        <div className="login-wrapper">
            <AuthBanner currentStep={2} />

            <div className="register-right">
                <div className="verify-card">

                    <span className="verify-badge">Sistema Integral Zigzag</span>

                    <div className="verify-icon-circle">
                        <AtSign size={30} strokeWidth={2} />
                    </div>

                    <h1 className="verify-title">Verifica tu correo</h1>

                    <p className="verify-subtitle">Enviamos un código de 6 dígitos a</p>
                    <p className="verify-email">{EMAIL_DESTINO}</p>

                    <form onSubmit={handleSubmit} style={{ width: "100%" }}>

                        {/* Cajas OTP */}
                        <div className="verify-otp-row">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <input
                                    key={i}
                                    ref={(el) => { inputRefs.current[i] = el; }}
                                    id={`otp-${i}`}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    className="verify-otp-input"
                                    onChange={(e) => handleOtpInput(e, i)}
                                    onKeyDown={(e) => handleOtpKeyDown(e, i)}
                                    onPaste={handleOtpPaste}
                                    autoComplete="off"
                                />
                            ))}
                        </div>

                        <p className="verify-timer">El contador vence en &nbsp;--:--</p>

                        <button type="submit" className="verify-btn-primary">
                            Validar y activar cuenta
                        </button>
                    </form>

                    <button className="verify-resend-link">
                        ¿No recibiste el correo? Reenviar código
                    </button>
                    <button className="verify-change-email">
                        Cambiar dirección de correo
                    </button>

                    <hr className="verify-divider" />
                    <p className="verify-note">Nunca compartas este código con otra persona.</p>

                </div>
            </div>
        </div>
    )
}
