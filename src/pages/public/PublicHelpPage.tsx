import { useState } from "react";
import { Search, Calendar, Ticket, CalendarDays, Building2, ChevronDown, ChevronUp } from "lucide-react";
import "./PublicHelpPage.css";

const faqCategories = [
  {
    icon: Calendar,
    title: "Reservaciones",
    subtitle: "Cambios, cancelaciones y folios",
    color: "#0868b7",
    questions: [
      { q: "¿Cómo puedo reservar una visita para mi grupo?", a: "Crea una cuenta, inicia sesión y completa el formulario. Selecciona una actividad, consulta una fecha y horario disponibles y envía la solicitud; recibirás un folio para darle seguimiento." },
      { q: "¿Con cuánta anticipación debo solicitar una reservación?", a: "El sistema permite elegir una fecha actual o futura y muestra los horarios disponibles. No se publica aquí un plazo mínimo; el aforo se vuelve a validar al enviar la solicitud." },
      { q: "¿Cuánto cuesta una visita grupal?", a: "La solicitud de reservación no calcula ni incluye precios. El desglose de visitantes sólo sirve para indicar cantidades por tipo de visitante." },
      { q: "¿Puedo cancelar o modificar mi reservación?", a: "Desde tu cuenta puedes consultar la solicitud y su estado. La interfaz actual no ofrece una acción de autoservicio para cambiarla o cancelarla." },
      { q: "¿Cuál es el tamaño máximo de grupo?", a: "Depende del cupo libre de cada horario. El formulario muestra lugares disponibles y el servidor vuelve a validar el aforo al registrar la solicitud." }
    ]
  },
  {
    icon: Ticket,
    title: "Boletos y acceso",
    subtitle: "Costos, horarios y taquilla",
    color: "#55b82c",
    questions: [
      { q: "¿Qué métodos de pago aceptan?", a: "El flujo de reservaciones no gestiona pagos ni incluye un importe. Consulta la información de taquilla para conocer las opciones vigentes." },
      { q: "¿Ofrecen descuentos para grupos escolares?", a: "La API de reservaciones no calcula precios ni descuentos. Consulta la información oficial de taquilla para confirmar tarifas vigentes." },
      { q: "¿Puedo comprar entradas en línea?", a: "La solicitud de visita grupal no compra entradas ni registra pagos. Consulta las opciones de compra disponibles en la información de taquilla." }
    ]
  },
  {
    icon: CalendarDays,
    title: "Eventos",
    subtitle: "Registro y requisitos especiales",
    color: "#fbc400",
    questions: [
      { q: "¿Qué experiencias están disponibles?", a: "Ofrecemos talleres interactivos, recorridos guiados y exposiciones permanentes de ciencia y tecnología. Consulta la sección de Experiencias para más detalles." },
      { q: "¿Hay estacionamiento disponible?", a: "Sí, contamos con estacionamiento gratuito para visitantes. El área de estacionamiento se encuentra junto a la entrada principal." },
      { q: "¿Puedo llevar alimentos al centro?", a: "Contamos con área de comida donde puedes disfrutar tus alimentos. No se permite llevar comida a las áreas de exhibición." },
      { q: "¿El centro es accesible para personas con discapacidad?", a: "Sí, nuestras instalaciones cuentan con rampas, baños accesibles y señalización adaptada para garantizar una visita cómoda para todos." }
    ]
  },
  {
    icon: Building2,
    title: "Visita al museo",
    subtitle: "Servicios y recomendaciones",
    color: "#ef4050",
    questions: [
      { q: "¿Cómo creo una cuenta en SIZZ?", a: "Haz clic en 'Crear cuenta' en la parte superior derecha del sitio. Completa el formulario con tus datos y verifica tu correo electrónico." },
      { q: "¿Olvidé mi contraseña, ¿qué hago?", a: "En la página de inicio de sesión, haz clic en '¿Olvidaste tu contraseña?' y sigue las instrucciones para restablecerla." },
      { q: "¿Puedo consultar el historial de mis reservaciones?", a: "Sí, desde Mis reservaciones puedes consultar tus folios, fechas, estados y respuestas enviadas. El módulo no genera folios de pago." }
    ]
  }
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="help-faq-item">
      <button
        className="help-faq-question"
        onClick={() => setOpen(!open)}
        type="button"
        aria-expanded={open}
      >
        <span className="help-faq-question-text">{question}</span>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {open && (
        <div className="help-faq-answer">
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}

// function FolioForm() {
//   const [folio, setFolio] = useState("");
//   const [email, setEmail] = useState("");
//
//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     // TODO: conectar con API de consulta de folio
//     alert("Funcionalidad en desarrollo. Pronto podrás consultar tu reservación aquí.");
//   };
//
//   return (
//     <form className="help-folio-form" onSubmit={handleSubmit}>
//       <div className="help-folio-field">
//         <label className="help-folio-label" htmlFor="folio-input">Folio</label>
//         <input
//           id="folio-input"
//           type="text"
//           className="help-folio-input"
//           placeholder="R-20260814-0187"
//           value={folio}
//           onChange={(e) => setFolio(e.target.value)}
//         />
//       </div>
//       <div className="help-folio-field">
//         <label className="help-folio-label" htmlFor="email-input">Correo electrónico</label>
//         <input
//           id="email-input"
//           type="email"
//           className="help-folio-input"
//           placeholder="tu@correo.com"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//         />
//       </div>
//       <button type="submit" className="help-folio-btn">Consultar reservación</button>
//       <div className="help-folio-divider" />
//       <p className="help-folio-contact-title">¿Necesitas atención personal?</p>
//       <p className="help-folio-contact-text">Escríbenos a ayuda@zigzag.gob.mx</p>
//     </form>
//   );
// }

export default function PublicHelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState(0);

  const selectedCategory = faqCategories[selectedTopic];

  // Filtrar preguntas de la categoría seleccionada según la búsqueda
  const filteredQuestions = (() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return selectedCategory.questions;
    return selectedCategory.questions.filter(
      (item) => item.q.toLowerCase().includes(query) || item.a.toLowerCase().includes(query)
    );
  })();

  return (
    <div className="help-page">
      {/* Hero Banner */}
      <section className="help-hero">
        <div className="help-hero-decoration">
          <div className="help-hero-circle help-hero-circle--teal" />
        </div>
        <div className="help-hero-content">
          <h1 className="help-hero-title">¿Cómo podemos ayudarte?</h1>
          <p className="help-hero-subtitle">
            Encuentra respuestas o consulta el estado de tu reservación.
          </p>
          <div className="help-hero-search">
            <input
              type="text"
              className="help-hero-search-input"
              placeholder="Buscar una pregunta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="help-hero-search-icon" size={24} />
          </div>
        </div>
      </section>

      {/* Temas de ayuda — tarjetas clicables */}
      <section className="help-topics">
        <div className="container">
          <h2 className="help-section-title">Temas de ayuda</h2>
          <div className="help-topics-grid">
            {faqCategories.map((category, index) => (
              <button
                type="button"
                className={`help-topic-card${index === selectedTopic ? " help-topic-card--active" : ""}`}
                key={category.title}
                onClick={() => setSelectedTopic(index)}
                aria-pressed={index === selectedTopic}
              >
                <div className="help-topic-icon" style={{ backgroundColor: category.color }}>
                  <category.icon size={20} color="#fff" />
                </div>
                <div className="help-topic-text">
                  <h3 className="help-topic-title">{category.title}</h3>
                  <p className="help-topic-subtitle">{category.subtitle}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ + Consulta tu folio — dos columnas */}
      <section className="help-main">
        <div className="container">
          <div className="help-main-grid">
            {/* FAQ — Panel compartido, izquierda */}
            <div className="help-faq-panel">
              <h2 className="help-faq-panel-title">Preguntas frecuentes</h2>
              <div className="help-faq-list">
                {filteredQuestions.length > 0 ? (
                  filteredQuestions.map((item) => (
                    <FAQItem key={item.q} question={item.q} answer={item.a} />
                  ))
                ) : (
                  <p className="help-faq-empty">
                    {searchQuery
                      ? `No se encontraron preguntas para "${searchQuery}".`
                      : "No hay preguntas para esta categoría."}
                  </p>
                )}
              </div>
            </div>

            {/* Consulta tu folio — Panel derecho */}
            {/*<div className="help-folio-panel">*/}
            {/*  <h2 className="help-folio-panel-title">Consulta tu folio</h2>*/}
            {/*  <p className="help-folio-panel-subtitle">Revisa el estado de una reservación.</p>*/}
            {/*  <FolioForm />*/}
            {/*</div>*/}
          </div>
        </div>
      </section>
    </div>
  );
}
