import { useState } from 'react';
import logo from '../assets/logo_zigzag.png';
import { Link } from 'react-router-dom';
import './Login.css';

export const Login = () => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
    };

    /*Datos del panel izquierdo*/
    return (
        <div className="login-wrapper">
            <div className="login-banner">
                <div className="banner-content">
                    <img src={logo} alt="ZigZag Logo" className="logo" />
                    <h1>Ciencia que se organiza, experiencias que conectan.</h1>
                    <p>
                        Plataforma de gestión del Centro Interactivo de Ciencia y Tecnología
                        ZigZag.
                    </p>
                </div>
            </div>

            {/*Panel derecho con el formulario de login*/}
            <div className="login-form-container">
                <form onSubmit={handleSubmit} className="login-card">
                    <span className="subtitle">SISTEMA INTEGRAL ZIGZAG</span>
                    <h2>Bienvenido</h2>
                    <p className="description">Ingresa tus credenciales para continuar.</p>

                    <div className="input-group">
                        <label htmlFor="identifier">Correo o usuario</label>
                        <input
                            id="identifier"
                            type="text"
                            placeholder="nombre@zigzag.gob.mx"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Contraseña</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="Ingresa tu contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {/*Botón de envío y enlace para registrarse*/}
                    <button type="submit" className="btn-submit">
                        Ingresar
                    </button>
                    <Link to="/register" className="register-link">
                        ¿No tienes usuario? Regístrate...
                    </Link>
                </form>
            </div>
        </div>
    );
};
