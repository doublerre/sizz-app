import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { isAxiosError } from 'axios';
import {passwordResetService} from "@/services/password.reset.service.ts";
import logo from '../../assets/logo_zigzag.png';
import '../Login.css';

const resetSchema = z.object({
    code: z.string().length(6, 'El código debe tener exactamente 6 dígitos'),
    password: z.string().min(8, 'La contraseña debe tener mínimo 8 caracteres'),
    repeatPassword: z.string(),
}).refine((d) => d.password === d.repeatPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['repeatPassword'],
});

export default function ResetPasswordPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const emailFromState = (location.state as { email?: string })?.email || '';

    const [email] = useState(emailFromState);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof resetSchema>>({
        resolver: zodResolver(resetSchema),
        defaultValues: { code: '', password: '', repeatPassword: '' },
    });

    const onSubmit = async (data: z.infer<typeof resetSchema>) => {
        if (!email) {
            setApiError('Correo no encontrado. Vuelve a iniciar la solicitud de recuperación.');
            return;
        }

        setApiError(null);
        setIsLoading(true);
        try {
            await passwordResetService.resetPassword({
                email,
                code: data.code,
                newPassword: data.password,
            });
            setIsSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err: unknown) {
            if (isAxiosError(err)) {
                setApiError(err.response?.data?.message || 'Código incorrecto o expirado.');
            } else {
                setApiError('Ocurrió un error al restablecer la contraseña.');
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
                    <h1>Nueva contraseña</h1>
                    <p>Ingresa el código que te enviamos y escribe tu nueva contraseña.</p>
                </div>
            </div>

            <div className="login-form-container">
                <form onSubmit={handleSubmit(onSubmit)} className="login-card">
                    <span className="subtitle">SISTEMA INTEGRAL ZIGZAG</span>
                    <h2>Restablecer contraseña</h2>
                    <p className="description">
                        Código enviado a: <strong>{email || 'tu correo'}</strong>
                    </p>

                    {isSuccess && (
                        <div style={{ backgroundColor: '#edf8e9', color: '#398a1e', padding: '0.8rem', borderRadius: '8px', display: 'flex', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 600 }}>
                            <CheckCircle2 size={18} />
                            <span>Contraseña actualizada con éxito. Redirigiendo al login...</span>
                        </div>
                    )}

                    <div className="input-group">
                        <label htmlFor="reset-code">Código de 6 dígitos</label>
                        <input
                            id="reset-code"
                            type="text"
                            maxLength={6}
                            placeholder="Ej. 123456"
                            {...register('code')}
                            className={errors.code ? 'input-error' : ''}
                        />
                        {errors.code && <span className="login-field-error">{errors.code.message}</span>}
                    </div>

                    <div className="input-group">
                        <label htmlFor="reset-new-password">Nueva contraseña</label>
                        <div className="login-password-wrapper">
                            <input
                                id="reset-new-password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Mínimo 8 caracteres"
                                {...register('password')}
                                className={errors.password ? 'input-error' : ''}
                            />
                            <button
                                type="button"
                                className="login-eye-btn"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {errors.password && <span className="login-field-error">{errors.password.message}</span>}
                    </div>

                    <div className="input-group">
                        <label htmlFor="reset-confirm-password">Confirmar nueva contraseña</label>
                        <input
                            id="reset-confirm-password"
                            type="password"
                            placeholder="Repite tu nueva contraseña"
                            {...register('repeatPassword')}
                            className={errors.repeatPassword ? 'input-error' : ''}
                        />
                        {errors.repeatPassword && <span className="login-field-error">{errors.repeatPassword.message}</span>}
                    </div>

                    {apiError && (
                        <div className="login-api-error" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertCircle size={16} />
                            <span>{apiError}</span>
                        </div>
                    )}

                    <button type="submit" className="btn-submit" disabled={isLoading || isSuccess}>
                        {isLoading ? 'Guardando...' : 'Cambiar contraseña'}
                    </button>

                    <Link to="/login" className="register-link">
                        Cancelar y volver al login
                    </Link>
                </form>
            </div>
        </div>
    );
}