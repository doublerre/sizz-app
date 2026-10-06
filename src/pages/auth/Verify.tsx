import { useRef, useState, useEffect } from "react"
import { AtSign } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"
import { isAxiosError } from "axios"
import { AuthBanner } from "../../components/AuthBanner"
import { authService } from "../../services/auth.service"
import { useAuth } from "../../context/AuthContext"
import "../../General.css"
import "../auth/Register.css"
import "./Verify.css"

interface VerifyState {
    firstName: string
    lastName: string
    email: string
    password: string
    role: "USER" | "GUIDE"
}

const CODE_TTL_SECONDS = 600 // 10 minutos, igual que el backend

export default function Verify() {
    const location = useLocation()
    const navigate = useNavigate()
    const { register: registerUser } = useAuth()

    const state = location.state as VerifyState | null

    // Si el usuario llega directamente a /verify-account sin pasar por Register, lo regresamos
    useEffect(() => {
        if (!state?.email) navigate("/register", { replace: true })
    }, [state, navigate])

    const inputRefs = useRef<(HTMLInputElement | null)[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isResending, setIsResending] = useState(false)
    const [apiError, setApiError] = useState<string | null>(null)
    const [secondsLeft, setSecondsLeft] = useState(CODE_TTL_SECONDS)

    // Contador regresivo de 10 minutos
    useEffect(() => {
        if (secondsLeft <= 0) return
        const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000)
        return () => clearInterval(id)
    }, [secondsLeft])

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60).toString().padStart(2, "0")
        const sec = (s % 60).toString().padStart(2, "0")
        return `${m}:${sec}`
    }

    // ── Manejo del input OTP ──────────────────────────────────────────────────

    const handleOtpInput = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const val = e.target.value.replace(/\D/g, "")
        e.target.value = val.slice(-1)
        if (val && index < 5) inputRefs.current[index + 1]?.focus()
    }

    const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === "Backspace" && !e.currentTarget.value && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
    }

    const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault()
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
        pasted.split("").forEach((char, i) => {
            if (inputRefs.current[i]) inputRefs.current[i]!.value = char
        })
        inputRefs.current[Math.min(pasted.length, 5)]?.focus()
    }

    // ── Submit: llama a /auth/register con todos los datos + código ───────────

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!state) return
        const code = inputRefs.current.map((r) => r?.value ?? "").join("")
        if (code.length < 6) {
            setApiError("Ingresa el código de 6 dígitos.")
            return
        }
        setApiError(null)
        setIsLoading(true)
        try {
            await registerUser({
                firstName: state.firstName,
                lastName: state.lastName,
                email: state.email,
                password: state.password,
                code,
                role: state.role,
            })
            // AuthContext ya guardó los tokens; redirigimos según el perfil
            navigate(state.role === "GUIDE" ? "/app" : "/cuenta/reservaciones", { replace: true })
        } catch (err) {
            if (isAxiosError(err)) {
                const msg = err.response?.data?.message
                setApiError(msg ?? "Código incorrecto o expirado. Inténtalo de nuevo.")
            }
        } finally {
            setIsLoading(false)
        }
    }

    // ── Reenviar código ───────────────────────────────────────────────────────

    const handleResend = async () => {
        if (!state || isResending) return
        setApiError(null)
        setIsResending(true)
        try {
            await authService.sendVerificationCode(state.email)
            setSecondsLeft(CODE_TTL_SECONDS)
            inputRefs.current.forEach((r) => { if (r) r.value = "" })
            inputRefs.current[0]?.focus()
        } catch (err) {
            if (isAxiosError(err)) {
                setApiError(err.response?.data?.message ?? "No se pudo reenviar el código.")
            }
        } finally {
            setIsResending(false)
        }
    }

    if (!state?.email) return null

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
                    <p className="verify-email">{state.email}</p>

                    <form onSubmit={handleSubmit} style={{ width: "100%" }}>
                        <div className="verify-otp-row">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <input
                                    key={i}
                                    ref={(el) => { inputRefs.current[i] = el }}
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

                        <p className="verify-timer">
                            {secondsLeft > 0
                                ? <>El código vence en&nbsp;<strong>{formatTime(secondsLeft)}</strong></>
                                : <span style={{ color: "#E84040" }}>El código expiró. Reenvía uno nuevo.</span>
                            }
                        </p>

                        {apiError && (
                            <p className="register-error" style={{ textAlign: "center", marginBottom: "0.75rem" }}>
                                {apiError}
                            </p>
                        )}

                        <button type="submit" className="verify-btn-primary" disabled={isLoading || secondsLeft <= 0}>
                            {isLoading ? "Verificando..." : "Validar y activar cuenta"}
                        </button>
                    </form>

                    <button className="verify-resend-link" onClick={handleResend} disabled={isResending}>
                        {isResending ? "Reenviando..." : "¿No recibiste el correo? Reenviar código"}
                    </button>

                    <button className="verify-change-email" onClick={() => navigate("/register")}>
                        Cambiar dirección de correo
                    </button>

                    <hr className="verify-divider" />
                    <p className="verify-note">Nunca compartas este código con otra persona.</p>
                </div>
            </div>
        </div>
    )
}
