import { Link } from "react-router-dom";
import logo from "@/assets/logo_zigzag_main.svg";
import "./Footer.css";

type FooterLink = {
    label: string;
    to: string;
    available: boolean;
};

// Igual que en el menú lateral: los que aún no tienen página se muestran
// pero no navegan, para no mandar al usuario a un 404.
const exploreLinks: FooterLink[] = [
    { label: "Experiencias", to: "/experiencias", available: false },
    { label: "Eventos", to: "/eventos", available: true },
    { label: "Reservaciones", to: "/reservaciones", available: false },
];

const helpLinks: FooterLink[] = [
    { label: "Preguntas frecuentes", to: "/preguntas-frecuentes", available: false },
    { label: "Consulta tu folio", to: "/folio", available: false },
    { label: "Aviso de privacidad", to: "/aviso-de-privacidad", available: false },
];

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
    return (
        <div className="footer-column">
            <h3 className="footer-title">{title}</h3>
            <ul className="footer-list">
                {links.map((link) => (
                    <li key={link.label}>
                        {link.available ? (
                            <Link to={link.to} className="footer-link">
                                {link.label}
                            </Link>
                        ) : (
                            <span className="footer-link footer-link--disabled">{link.label}</span>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default function Footer() {
    return (
        <footer className="footer">
            <div className="container footer-top">
                <div className="footer-brand">
                    <img src={logo} alt="Zigzag Zacatecas" className="footer-logo" />
                    <p className="footer-brand-name">
                        Centro Interactivo de Ciencia y Tecnología Zigzag · Zacatecas
                    </p>
                    <p className="footer-brand-text">
                        Consulta experiencias, reservaciones y eventos desde SIZZ.
                    </p>
                </div>

                <FooterColumn title="EXPLORA" links={exploreLinks} />
                <FooterColumn title="AYUDA" links={helpLinks} />

                <div className="footer-cta-wrapper">
                    {/* Sin ruta todavía; cuando exista la de reservaciones se cambia*/}
                    <button type="button" className="footer-cta">
                        Planear mi visita
                    </button>
                </div>
            </div>

            <div className="footer-bottom">
                <div className="container">
                    © 2026 Zigzag Zacatecas · Sistema Integral Zigzag
                </div>
            </div>
        </footer>
    );
}