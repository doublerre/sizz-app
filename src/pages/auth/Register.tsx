"use client"

import * as z from "zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff } from "lucide-react"
import { AuthBanner } from "../../components/AuthBanner";
import "../../General.css";
import "./Register.css";
import { Link } from "react-router-dom"

const formSchema = z.object({
    name: z.string().min(3, "El nombre es obligatorio"),
    lastName: z.string().min(3, "El apellido es obligatorio"),
    email: z.string().email("El correo no es válido"),
    password: z.string().min(8, "La contraseña debe ser de al menos 8 caracteres"),
    repeatPassword: z.string().min(8, "Las contraseñas deben ser iguales"),
    terms: z.boolean().refine((value) => value, "Debes aceptar el aviso de privacidad y los términos de uso"),
})

export default function CreateUserForm() {
    const [showPassword, setShowPassword] = useState(false);
    const [showRepeatPassword, setShowRepeatPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            lastName: "",
            email: "",
            password: "",
            repeatPassword: "",
            terms: false,
        },
    })

    const onSubmit = (data: z.infer<typeof formSchema>) => {
        console.log(data)
    }

    return (
        <div className="login-wrapper">
            <AuthBanner currentStep={1} />

            <div className="register-right">
                <div className="register-card">
                    <span className="register-badge">Sistema Integral Zigzag</span>
                    <h1 className="register-title">Crear cuenta</h1>
                    <p className="register-subtitle">Registra tus datos para comenzar.</p>

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
                                {errors.name && (
                                    <span className="register-error">{errors.name.message}</span>
                                )}
                            </div>
                            <div className="register-field">
                                <label htmlFor="lastName">Apellidos</label>
                                <input
                                    type="text"
                                    id="lastName"
                                    {...register("lastName")}
                                    className={errors.lastName ? "input-error" : ""}
                                />
                                {errors.lastName && (
                                    <span className="register-error">{errors.lastName.message}</span>
                                )}
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
                            {errors.email && (
                                <span className="register-error">{errors.email.message}</span>
                            )}
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
                                {errors.password && (
                                    <span className="register-error">{errors.password.message}</span>
                                )}
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
                                {errors.repeatPassword && (
                                    <span className="register-error">{errors.repeatPassword.message}</span>
                                )}
                            </div>
                        </div>

                        <p className="register-hint">La contraseña debe tener al menos 8 caracteres.</p>

                        <div>
                            <div className="register-terms">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    {...register("terms")}
                                />
                                <label htmlFor="terms">Acepto el aviso de privacidad y los términos de uso.</label>
                            </div>
                            {errors.terms && (
                                <span className="register-error">{errors.terms.message}</span>
                            )}
                        </div>

                        <Link to="/verify-account">
                            <button type="submit" className="register-btn-primary">
                                Crear cuenta y enviar código
                            </button>
                        </Link>

                        <div className="register-login-link">
                            <a href="/login">¿Ya tienes cuenta? Inicia sesión</a>
                        </div>

                        <p className="register-note">
                            Recibirás un código de verificación en tu correo.
                        </p>
                    </form>
                </div>
            </div>
        </div>
    )
}
