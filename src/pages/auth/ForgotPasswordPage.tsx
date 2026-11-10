import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import {passwordResetService} from "@/services/password.reset.service.ts";
import logo from '../../assets/logo_zigzag.png';
import '../Login.css';

const schema = z.object({
    email: z.string().email('Ingresa un correo electrónico válido'),
});

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: { email: '' },
    });

    const onSubmit = async (data: z.infer<typeof schema>) => {
        setApiError(null);
        setIsLoading(true);
        try {
            await passwordResetService.forgotPassword({ email: data.email });
            navigate('/recuperar-contrasena/restablecer', { state: { email: data.email } });
        } catch {
            setApiError('No se pudo procesar la solicitud. Verifica tu conexión o intenta más tarde.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-wrapper">
            <div className="login-banner">
                <div className="banner-content">
                    <img src={logo} alt="ZigZag Logo" className="logo" />
                    <h1>Recuperación de acceso</h1>
                    <p>Te ayudamos a reestablecer tu contraseña de forma rápida y segura.</p>
                </div>
            </div>

            <div className="login-form-container">
                <form onSubmit={handleSubmit(onSubmit)} className="login-card">
                    <span className="subtitle">SISTEMA INTEGRAL ZIGZAG</span>
                    <h2>¿Olvidaste tu contraseña?</h2>
                    <p className="description">
                        Ingresa el correo electrónico asociado a tu cuenta para enviarte un código de 6 dígitos.
                    </p>

                    <div className="input-group">
                        <label htmlFor="forgot-email">Correo electrónico</label>
                        <input
                            id="forgot-email"
                            type="email"
                            placeholder="nombre@zigzag.gob.mx"
                            {...register('email')}
                            className={errors.email ? 'input-error' : ''}
                        />
                        {errors.email && <span className="login-field-error">{errors.email.message}</span>}
                    </div>

                    {apiError && (
                        <div className="login-api-error" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertCircle size={16} />
                            <span>{apiError}</span>
                        </div>
                    )}

                    <button type="submit" className="btn-submit" disabled={isLoading}>
                        {isLoading ? 'Enviando código...' : 'Continuar'}
                    </button>

                    <Link to="/login" className="register-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}>
                        <ArrowLeft size={16} /> Volver al inicio de sesión
                    </Link>
                </form>
            </div>
        </div>
    );
}