import * as z from "zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff } from "lucide-react"
import { useNavigate, Link } from "react-router-dom"
import { AuthBanner } from "../../components/AuthBanner"
import { authService } from "../../services/auth.service"
import { isAxiosError } from "axios"
import "../../General.css"
import "./Register.css"

type ProfileType = "USER" | "GUIDE"

const formSchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio").max(100),
    lastName: z.string().min(1, "El apellido es obligatorio").max(100),
    email: z.string().email("El correo no es válido").max(320),
    password: z.string().min(8, "Mínimo 8 caracteres").max(72),
    repeatPassword: z.string(),
    terms: z.boolean().refine((v) => v, "Debes aceptar el aviso de privacidad y los términos de uso"),
}).refine((d) => d.password === d.repeatPassword, {
    message: "Las contraseñas no coinciden",
    path: ["repeatPassword"],
})

export default function CreateUserForm() {
    const [profileType, setProfileType] = useState<ProfileType>("USER")
    const [showPassword, setShowPassword] = useState(false)
    const [showRepeatPassword, setShowRepeatPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [apiError, setApiError] = useState<string | null>(null)
    const navigate = useNavigate()

    const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { name: "", lastName: "", email: "", password: "", repeatPassword: "", terms: false },
    })

    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        setApiError(null)
        setIsLoading(true)
        try {
            await authService.sendVerificationCode(data.email)
            navigate("/register/verify-account", {
                state: {
                    firstName: data.name,
                    lastName: data.lastName,
                    email: data.email,
                    password: data.password,
                    role: profileType,
                },
            })
        } catch (err) {
            if (isAxiosError(err)) {
                const msg = err.response?.data?.message
                setApiError(msg ?? "Ocurrió un error. Intenta de nuevo.")
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="login-wrapper">
            <AuthBanner currentStep={1} />

            <div className="register-right">
                <div className="register-card">
                    <span className="register-badge">Sistema Integral Zigzag</span>
                    <h1 className="register-title">Crear una cuenta</h1>
                    <p className="register-subtitle">Selecciona cómo usarás el Sistema Integral Zigzag.</p>

                    {/* Selector de tipo de perfil */}
                    <p className="register-profile-label">Tipo de perfil</p>
                    <div className="register-profile-options">
                        <button
                            type="button"
                            className={`register-profile-card${profileType === "USER" ? " active" : ""}`}
                            onClick={() => setProfileType("USER")}
                        >
                            <div className="register-profile-dot blue" />
                            <div className="register-profile-card-text">
                                <strong>Visitante</strong>
                                <span>Reservaciones, boletos y eventos.</span>
                            </div>
                        </button>

                        <button
                            type="button"
                            className={`register-profile-card${profileType === "GUIDE" ? " active" : ""}`}
                            onClick={() => setProfileType("GUIDE")}
                        >
                            <div className="register-profile-dot yellow" />
                            <div className="register-profile-card-text">
                                <strong>Aspirante a guía</strong>
                                <span>Convocatorias de becas y seguimiento.</span>
                            </div>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="register-form">
                        <div className="register-row">
                            <div className="register-field">
                                <label htmlFor="name">Nombre(s)</label>
                                <input
                                    type="text"
                                    id="name"
                                    {...register("name")}
                                    className={errors.name ? "input-error" : ""}
                                />
                                {errors.name && <span className="register-error">{errors.name.message}</span>}
                            </div>
                            <div className="register-field">
                                <label htmlFor="lastName">Apellidos</label>
                                <input
                                    type="text"
                                    id="lastName"
                                    {...register("lastName")}
                                    className={errors.lastName ? "input-error" : ""}
                                />
                                {errors.lastName && <span className="register-error">{errors.lastName.message}</span>}
                            </div>
                        </div>

                        <div className="register-field">
                            <label htmlFor="email">Correo electrónico</label>
                            <input
                                type="email"
                                id="email"
                                {...register("email")}
                                className={errors.email ? "input-error" : ""}
                            />
                            {errors.email && <span className="register-error">{errors.email.message}</span>}
                        </div>

                        <div className="register-row">
                            <div className="register-field">
                                <label htmlFor="password">Contraseña</label>
                                <div className="register-password-wrapper">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        {...register("password")}
                                        className={errors.password ? "input-error" : ""}
                                    />
                                    <button
                                        type="button"
                                        className="register-eye-btn"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {errors.password && <span className="register-error">{errors.password.message}</span>}
                            </div>
                            <div className="register-field">
                                <label htmlFor="repeatPassword">Confirmar contraseña</label>
                                <div className="register-password-wrapper">
                                    <input
                                        type={showRepeatPassword ? "text" : "password"}
                                        id="repeatPassword"
                                        {...register("repeatPassword")}
                                        className={errors.repeatPassword ? "input-error" : ""}
                                    />
                                    <button
                                        type="button"
                                        className="register-eye-btn"
                                        onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                                        aria-label={showRepeatPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                    >
                                        {showRepeatPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {errors.repeatPassword && <span className="register-error">{errors.repeatPassword.message}</span>}
                            </div>
                        </div>

                        <div>
                            <div className="register-terms">
                                <input type="checkbox" id="terms" {...register("terms")} />
                                <label htmlFor="terms">Acepto el aviso de privacidad y los términos de uso.</label>
                            </div>
                            {errors.terms && <span className="register-error">{errors.terms.message}</span>}
                        </div>

                        {apiError && <p className="register-error" style={{ textAlign: "center" }}>{apiError}</p>}

                        <button type="submit" className="register-btn-primary" disabled={isLoading}>
                            {isLoading ? "Enviando código..." : "Crear cuenta y verificar correo"}
                        </button>

                        <div className="register-login-link">
                            <Link to="/login">¿Ya tienes cuenta? Inicia sesión</Link>
                        </div>

                        {profileType === "GUIDE" && (
                            <div className="register-guide-info">
                                <strong>¿Quieres participar como guía?</strong>
                                <p>Después de verificar tu correo podrás consultar convocatorias y postularte.</p>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    )
}
