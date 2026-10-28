import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import ExperienceForm, { type ExperienceFormValues } from "./ExperienceForm";
import { EXPERIENCE_ROUTES, type AdminExperience } from "./experience.data";
import { experiencesService, toFormValues } from "../../services/experiences.service";

function EditExperience() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [experience, setExperience] = useState<AdminExperience | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) {
            setNotFound(true);
            setLoading(false);
            return;
        }

        const fetchExperience = async () => {
            setLoading(true);
            setNotFound(false);
            try {
                const data = await experiencesService.getActivityById(id);
                setExperience(data);
            } catch (err: unknown) {
                console.error("Error al consultar la experiencia:", err);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };

        fetchExperience();
    }, [id]);

    if (loading) {
        return (
            <div className="exf-page" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh", gap: "0.75rem", color: "#64748B" }}>
                <Loader2 className="animate-spin" size={24} />
                <span>Cargando datos de la experiencia...</span>
            </div>
        );
    }

    if (notFound || !experience) {
        return (
            <div className="exf-page exf-not-found">
                <h1 className="exf-head__title">No encontramos esta experiencia</h1>
                <p className="exf-head__subtitle">Puede que se haya eliminado o que el enlace sea incorrecto.</p>
                <Link to={EXPERIENCE_ROUTES.list} className="exf-btn exf-btn--blue">
                    Volver al catálogo
                </Link>
            </div>
        );
    }

    const handleSubmit = async (values: ExperienceFormValues) => {
        setError(null);
        try {
            await experiencesService.updateActivity(String(experience.id), values);
            navigate(EXPERIENCE_ROUTES.list);
        } catch (err: unknown) {
            console.error("Error al actualizar experiencia:", err);
            setError("No se pudieron guardar los cambios. Intenta nuevamente.");
            throw err;
        }
    };

    return (
        <>
            {error && (
                <div style={{ maxWidth: "800px", margin: "1rem auto 0", padding: "0.75rem 1rem", backgroundColor: "#FEE2E2", color: "#991B1B", borderRadius: "8px" }}>
                    {error}
                </div>
            )}
            <ExperienceForm
                key={experience.id}
                mode="edit"
                initialValues={toFormValues(experience)}
                lastModified={`${experience.updatedAt} · ${experience.updatedBy}`}
                onSubmit={handleSubmit}
                onCancel={() => navigate(EXPERIENCE_ROUTES.list)}
            />
        </>
    );
}

export default EditExperience;