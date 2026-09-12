import { Link } from "react-router-dom";

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
        color: "var(--brand-red)",
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
    return (

        <div className="events-grid">
            {events.map((event) => (
                <article className="event-card" key={event.id}>
                    <div className="event-banner" style={{ backgroundColor: event.color }}>
                        <span className="event-category">{event.category}</span>
                    </div>
                    <div className="event-body">
                        <h3>{event.title}</h3>
                        <p className="event-date" style={{ color: event.color }}>{event.date} · {event.time}</p>
                        <p className="audience">{event.audience}</p>
                        <Link to={"/eventos/" + event.id}>Consultar detalles </Link>

                    </div>
                </article>
            ))}
        </div>

    )
}