import {
    BarChart3,
    Bell,
    BookBookmark,
    CalendarDays,
    ChevronDown,
    CircleAlert,
    MonitorCheck,
    Plus,
    Star,
    User,
} from "lucide-react";
import "./AdminDashboard.css";

const weeklyTraffic = [
    { day: "LUN", green: 28, blue: 32 },
    { day: "MAR", green: 34, blue: 46 },
    { day: "MIÉ", green: 22, blue: 30 },
    { day: "JUE", green: 42, blue: 52 },
    { day: "VIE", green: 48, blue: 64 },
    { day: "SÁB", green: 40, blue: 60 },
    { day: "DOM", green: 30, blue: 44 },
];

const recentActivity = [
    {
        activity: "Visita escolar · Secundaria 8",
        module: "Recepción",
        responsible: "María López",
        time: "10:42",
        status: "Completada",
        statusClass: "adm-dashboard-status--completed",
    },
    {
        activity: "Actualización · Sala de energía",
        module: "Contenido",
        responsible: "Carlos Pérez",
        time: "09:58",
        status: "Publicada",
        statusClass: "adm-dashboard-status--published",
    },
    {
        activity: "Reservación · Grupo 32 personas",
        module: "Agenda",
        responsible: "Ana Torres",
        time: "09:20",
        status: "Pendiente",
        statusClass: "adm-dashboard-status--pending",
    },
    {
        activity: "Reporte semanal de afluencia",
        module: "Reportes",
        responsible: "Sistema",
        time: "08:35",
        status: "Generado",
        statusClass: "adm-dashboard-status--generated",
    },
];

function AdminDashboard() {
    return (
        <div className="adm-dashboard">
            <header className="adm-head">
                <div className="adm-head__text">
                    <h1 className="adm-head__title">Buenos días, Sahara</h1>
                    <p className="adm-head__subtitle">
                        Martes, 11 de agosto de 2026 · Resumen general
                    </p>
                </div>

                <button type="button" className="adm-head_notif" aria-label="Ver notificaciones">
                    <Bell size={18} fill="currentColor" />
                </button>
            </header>

            <main className="adm-dashboard__content">
                <section className="adm-stats" aria-label="Resumen general">
                    <article className="adm-stat">
                        <div className="adm-stat__icon adm-stat__icon--blue">
                            <MonitorCheck size={20} />
                        </div>
                        <div>
                            <span className="adm-stat__label">Experiencias activas</span>
                            <div className="adm-stat__value">
                                24
                                <span className="adm-stat__hint adm-stat__hint--green">+3 este mes</span>
                            </div>
                        </div>
                    </article>

                    <article className="adm-stat">
                        <div className="adm-stat__icon adm-stat__icon--green">
                            <User size={20} />
                        </div>
                        <div>
                            <span className="adm-stat__label">Visitantes hoy</span>
                            <div className="adm-stat__value">
                                386
                                <span className="adm-stat__hint adm-stat__hint--green">+12% vs. ayer</span>
                            </div>
                        </div>
                    </article>

                    <article className="adm-stat">
                        <div className="adm-stat__icon adm-stat__icon--yellow">
                            <BookBookmark size={20} />
                        </div>
                        <div>
                            <span className="adm-stat__label">Reservaciones</span>
                            <div className="adm-stat__value">
                                18
                                <span className="adm-stat__hint adm-stat__hint--yellow">6 grupos por recibir</span>
                            </div>
                        </div>
                    </article>

                    <article className="adm-stat">
                        <div className="adm-stat__icon adm-stat__icon--red">
                            <Star size={20} fill="currentColor" />
                        </div>
                        <div>
                            <span className="adm-stat__label">Satisfacción</span>
                            <div className="adm-stat__value">
                                94%
                                <span className="adm-stat__hint adm-stat__hint--green">+2% esta semana</span>
                            </div>
                        </div>
                    </article>
                </section>

                <section className="adm-dashboard__grid" aria-label="Panel de control">
                    <article className="adm-dashboard-card adm-dashboard-card--traffic">
                        <div className="adm-dashboard-card__header">
                            <div>
                                <h2 className="adm-dashboard-card__title">Afluencia semanal</h2>
                                <p className="adm-dashboard-card__subtitle">Visitantes registrados por día</p>
                            </div>

                            <button type="button" className="adm-dashboard-period">
                                <span>Esta semana</span>
                                <ChevronDown size={15} strokeWidth={2.6} aria-hidden="true" />
                            </button>
                        </div>

                        <div className="adm-dashboard-chart" aria-label="Gráfica de afluencia semanal">
                            <div className="adm-dashboard-chart__grid" aria-hidden="true" />
                            <div className="adm-dashboard-chart__bars">
                                {weeklyTraffic.map((item) => (
                                    <div className="adm-dashboard-chart__item" key={item.day}>
                                        <div className="adm-dashboard-chart__bar">
                                                <span
                                                    className="adm-dashboard-chart__segment adm-dashboard-chart__segment--blue"
                                                    style={{ height: `${item.blue}%` }}
                                                />
                                            <span
                                                className="adm-dashboard-chart__segment adm-dashboard-chart__segment--green"
                                                style={{ height: `${item.green}%` }}
                                            />
                                        </div>
                                        <span className="adm-dashboard-chart__label">{item.day}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="adm-dashboard-chart-legend" aria-label="Nomenclatura de la gráfica">
                                <span className="adm-dashboard-chart-legend__item">
                                    <span className="adm-dashboard-chart-legend__marker adm-dashboard-chart-legend__marker--blue" />
                                    Visitantes generales
                                </span>
                            <span className="adm-dashboard-chart-legend__item">
                                    <span className="adm-dashboard-chart-legend__marker adm-dashboard-chart-legend__marker--green" />
                                    Visitas escolares
                                </span>
                        </div>
                    </article>

                    <aside className="adm-dashboard-card adm-dashboard-card--actions">
                        <h2 className="adm-dashboard-card__title">Acciones rápidas</h2>
                        <p className="adm-dashboard-card__subtitle">Atajos de uso frecuente</p>

                        <div className="adm-dashboard-actions">
                            <button type="button" className="adm-dashboard-action adm-dashboard-action--blue">
                                <span className="adm-dashboard-action__icon">
                                    <Plus size={18} strokeWidth={3} />
                                </span>
                                Nueva experiencia
                            </button>

                            <button type="button" className="adm-dashboard-action adm-dashboard-action--green">
                                <span className="adm-dashboard-action__icon">
                                    <CalendarDays size={18} strokeWidth={2.6} />
                                </span>
                                Registrar visita
                            </button>

                            <button type="button" className="adm-dashboard-action adm-dashboard-action--yellow">
                                <span className="adm-dashboard-action__icon">
                                    <BarChart3 size={18} strokeWidth={2.8} />
                                </span>
                                Generar reporte
                            </button>

                            <button type="button" className="adm-dashboard-action adm-dashboard-action--red">
                                <span className="adm-dashboard-action__icon">
                                    <CircleAlert size={18} strokeWidth={2.8} />
                                </span>
                                Revisar alertas
                            </button>
                        </div>
                    </aside>
                </section>

                <section className="adm-dashboard-card adm-dashboard-activity" aria-labelledby="recent-activity-title">
                    <div className="adm-dashboard-card__header">
                        <div>
                            <h2 id="recent-activity-title" className="adm-dashboard-card__title">
                                Actividad reciente
                            </h2>
                            <p className="adm-dashboard-card__subtitle">Últimos movimientos del sistema</p>
                        </div>

                        <a href="#" className="adm-dashboard-see-all">
                            Ver todo +
                        </a>
                    </div>

                    <div className="adm-dashboard-table-wrap">
                        <table className="adm-dashboard-table">
                            <thead>
                            <tr>
                                <th>Actividad</th>
                                <th>Módulo</th>
                                <th>Responsable</th>
                                <th>Hora</th>
                                <th>Estado</th>
                            </tr>
                            </thead>
                            <tbody>
                            {recentActivity.map((item) => (
                                <tr key={`${item.activity}-${item.time}`}>
                                    <td>{item.activity}</td>
                                    <td>{item.module}</td>
                                    <td>{item.responsible}</td>
                                    <td>{item.time}</td>
                                    <td>
                                            <span className={`adm-dashboard-status ${item.statusClass}`}>
                                                {item.status}
                                            </span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default AdminDashboard;