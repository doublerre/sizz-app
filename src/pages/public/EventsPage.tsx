import { Link } from "react-router-dom";
import "./EventsPage.css"
import { useState, useEffect } from "react";

// Datos temporales, mientras no existe el endpoint de eventos
const events = [
    {
        id: 1,
        category: "Astronomía",
        color: "var(--brand-blue)",
        title: "Noche de estrellas",
        date: "22 AGO",
        time: "19:00",
        audience: "Para todas las edades"
    },
    {
        id: 2,
        category: "Tecnología",
        color: "var(--brand-purple)",
        title: "Taller de robótica",
        date: "29 AGO",
        time: "11:00",
        audience: "Desde 10 años"
    },
    {
        id: 3,
        category: "Evento Especial",
        color: "var(--brand-green)",
        title: "Festival de ciencia",
        date: "12 SEP",
        time: "10:00",
        audience: "Familiar"
    },
    {
        id: 4,
        category: "Infantil",
        color: "var(--brand-yellow)",
        title: "Pequeños exploradores",
        date: "20 SEP",
        time: "12:00",
        audience: "De 4 a 7 años"
    },
    {
        id: 5,
        category: "Óptica",
        color: "var(--brand-red-light)",
        title: "Laboratorio de luz",
        date: "27 SEP",
        time: "16:00",
        audience: "Desde 8 años"
    },
    {
        id: 6,
        category: "Astronomía",
        color: "var(--brand-blue)",
        title: "Día del espacio",
        date: "4 OCT",
        time: "10:00",
        audience: "Familiar"
    }
];

export default function EventsPage() {
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    const filteredEvents = events.filter((event) => {
        const query = debouncedSearch.toLowerCase();
        return (
            event.title.toLowerCase().includes(query) ||
            event.category.toLowerCase().includes(query)
        );
    });

    return (
        <>
            <header className="events-header">
                <div className="container">
                    <p className="events-eyebrow">AGENDA ZIGZAG</p>
                    <h1>Eventos para descubrir juntos</h1>
                    <p className="events-subtitle">Actividades especiales, talleres y noches temáticas para toda la familia</p>
                </div>

            </header>
            <section className="events-intro">
                <div className="container">
                    <h2>Próximos eventos</h2>
                    <p className="events-intro-text">Consulta fechas, edades y requisitos de acceso.</p>
                </div>
            </section>
            <div className="events-filters-wrapper">
                <div className="container">
                    <div className="events-filters">
                        <input
                            type="text"
                            className="events-search"
                            placeholder="Buscar evento o tema..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>
            <div className="container">
                {filteredEvents.length > 0 ? (
                    <div className="events-grid">
                        {filteredEvents.map((event) => (
                            <article className="event-card" key={event.id}>
                                <div className="event-banner" style={{ backgroundColor: event.color }}>
                                    <div className="event-circle"></div>
                                    <span className="event-category" style={{ color: event.color }}>{event.category}</span>
                                </div>
                                <div className="event-body">
                                    <h3>{event.title}</h3>
                                    <p className="event-date" style={{ color: event.color }}>{event.date} · {event.time}</p>
                                    <p className="audience">{event.audience}</p>
                                    <Link className="event-link" to={"/eventos/" + event.id}>Consultar detalles</Link>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <p className="events-empty">No encontramos eventos que coincidan con tu búsqueda.</p>
                )}

            </div>

        </>


    )
}