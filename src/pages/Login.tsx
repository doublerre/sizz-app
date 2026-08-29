import {useState} from 'react';
import logo from '../assets/logo_zigzag.png';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';


//identifier para usuario o correo
export const Login = () => {
const [identifier, setIdentifier] = useState('');
const [password, setPassword] = useState('');
const [error, setError] = useState<string | null>(null);
const [loading, setLoading] = useState(false);

const navigate = useNavigate();

const handleSubmit = (e: React.FormEvent) => {
e.preventDefault();
setError(null);

if (!identifier || !password) {
    setError('No se puedo guardar');
    return;
}

setLoading(true);
try {
  //navigate('/dashboard');
}catch (error) {
    setError('Usuario o contraseña incorrectos');
}
setLoading(false);
};


//Bloque derecho
return (
    <div className="login-wrapper">
    <div className="login-banner">
    <div className="banner-content">
    <img src={logo} alt="ZigZag Logo" className="logo"/>
    <h1>Ciencia que se organiza, experencias que conectan.</h1>
    <p>Plataforma de gestión del Centro Interactivo de Ciencia y Tecnología ZigZag.</p>
    </div>
    </div>

{/*Bloque izquierdo - Formulario*/}
     <div className="login-form-container">
     <form onSubmit={handleSubmit} className="login-card">
        <span className="subtitle">SISTEMA INTEGRAL ZIGZAG</span>
        <h2>Bienvenido</h2>
        <p className="description">Ingresa tus credenciales para iniciar sesión</p>
        
        {error && <p className="login-error">{error}</p>}

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
 
    {/*Bloque de contraseña*/}
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

    <button type="submit" className="btn-submit">Ingresar</button>
    <Link to="/register" className="register-link">¿No tienes usuario? Regístrate...</Link>
    </form>
    </div>
    </div>
    );
};
