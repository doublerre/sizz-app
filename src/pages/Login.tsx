import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { isAxiosError } from 'axios';
import * as z from 'zod';
import logo from '../assets/logo_zigzag.png';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const formSchema = z.object({
    email: z.string().email('Ingresa un correo válido'),
    password: z.string().min(1, 'La contraseña es obligatoria'),
});

export const Login = () => {
    const { login, user } = useAuth();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { email: '', password: '' },
    });

    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        setApiError(null);
        setIsLoading(true);
        try {
            await login(data.email, data.password);
            // El AuthContext ya actualizó `user` con los claims del JWT
            // Redirigimos según el rol decodificado del token
            const role = user?.role;
            navigate(role === 'ADMIN' ? '/app' : '/cuenta/reservaciones', { replace: true });
        } catch (err) {
            if (isAxiosError(err)) {
                const msg = err.response?.data?.message;
                setApiError(msg ?? 'Ocurrió un error. Intenta de nuevo.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-wrapper">
            <div className="login-banner">
                <div className="banner-content">
                    <img src={logo} alt="ZigZag Logo" className="logo" />
                    <h1>Ciencia que se organiza, experiencias que conectan.</h1>
                    <p>Plataforma de gestión del Centro Interactivo de Ciencia y Tecnología ZigZag.</p>
                </div>
            </div>

            <div className="login-form-container">
                <form onSubmit={handleSubmit(onSubmit)} className="login-card">
                    <span className="subtitle">SISTEMA INTEGRAL ZIGZAG</span>
                    <h2>Bienvenido</h2>
                    <p className="description">Ingresa tus credenciales para continuar.</p>

                    <div className="input-group">
                        <label htmlFor="login-email">Correo electrónico</label>
                        <input
                            id="login-email"
                            type="email"
                            placeholder="nombre@zigzag.gob.mx"
                            {...register('email')}
                            className={errors.email ? 'input-error' : ''}
                        />
                        {errors.email && <span className="login-field-error">{errors.email.message}</span>}
                    </div>

                    <div className="input-group">
                        <label htmlFor="login-password">Contraseña</label>
                        <div className="login-password-wrapper">
                            <input
                                id="login-password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Ingresa tu contraseña"
                                {...register('password')}
                                className={errors.password ? 'input-error' : ''}
                            />
                            <button
                                type="button"
                                className="login-eye-btn"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {errors.password && <span className="login-field-error">{errors.password.message}</span>}
                    </div>

                    {apiError && <p className="login-api-error">{apiError}</p>}

                    <button type="submit" className="btn-submit" disabled={isLoading}>
                        {isLoading ? 'Verificando...' : 'Ingresar'}
                    </button>

                    <Link to="/register" className="register-link">
                        ¿No tienes usuario? Regístrate...
                    </Link>
                </form>
            </div>
        </div>
    );
};
