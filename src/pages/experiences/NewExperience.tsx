import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ExperienceForm, { type ExperienceFormValues } from "./ExperienceForm";
import { EXPERIENCE_ROUTES } from "./experience.data";
import { experiencesService } from "../../services/experiences.service";

function NewExperience() {
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (values: ExperienceFormValues) => {
        setError(null);
        try {
            await experiencesService.createActivity(values);
            navigate(EXPERIENCE_ROUTES.list);
        } catch (err: unknown) {
            console.error("Error al crear experiencia:", err);
            setError("No se pudo guardar la experiencia. Por favor revisa los campos e intenta nuevamente.");
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
                mode="create"
                onSubmit={handleSubmit}
                onCancel={() => navigate(EXPERIENCE_ROUTES.list)}
            />
        </>
    );
}

export default NewExperience;