import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CheckCircle2 } from "lucide-react";
import { registerToEvent, type RegistrationResult } from "@/services/eventsApi";
import "./EventRegistrationForm.css";

// Mismas reglas que RegistrationRequest en el backend
const formSchema = z.object({
    name: z.string().trim().min(1, "Escribe tu nombre").max(300, "Máximo 300 caracteres"),
    email: z
        .string()
        .trim()
        .min(1, "Escribe tu correo")
        .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Correo no válido"),
    phone: z.string().refine((v) => v === "" || /^\d{10}$/.test(v), "Escribe 10 dígitos"),
    privacyAccepted: z.boolean().refine((v) => v, "Debes aceptar el aviso de privacidad"),
});

type FormValues = z.infer<typeof formSchema>;

function errorMessage(err: unknown): string {
    return err instanceof Error ? err.message : "No pudimos completar tu inscripción. Intenta de nuevo.";
}

export default function EventRegistrationForm({
    eventId,
    onDirtyChange,
}: {
    eventId: string;
    onDirtyChange?: (dirty: boolean) => void;
}) {
    const [result, setResult] = useState<RegistrationResult | null>(null);
    const [apiError, setApiError] = useState("");

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting, isDirty },
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { name: "", email: "", phone: "", privacyAccepted: false },
    });
    useEffect(() => {
        onDirtyChange?.(isDirty && !result);
    }, [isDirty, result, onDirtyChange]);

    const onSubmit = async (values: FormValues) => {
        setApiError("");
        try {
            setResult(
                await registerToEvent(eventId, {
                    name: values.name.trim(),
                    email: values.email.trim(),
                    phone: values.phone === "" ? null : values.phone,
                    privacyAccepted: values.privacyAccepted,
                }),
            );
        } catch (err) {
            setApiError(errorMessage(err));
        }
    };

    if (result) {
        return (
            <div className="event-register-done" role="status">
                <CheckCircle2 size={40} />
                <h3>¡Quedaste inscrito!</h3>
                <p className="event-register-folio">{result.folio}</p>
                <p>
                    {result.emailSent
                        ? `Te enviamos la confirmación a ${result.email}.`
                        : "Guarda tu folio: lo vas a necesitar el día del evento."}
                </p>
            </div>
        );
    }

    return (
        <form className="event-register" onSubmit={handleSubmit(onSubmit)} noValidate>
            <h3>Inscríbete</h3>

            <label htmlFor="reg-name">Nombre completo</label>
            <input id="reg-name" type="text" {...register("name")} className={errors.name ? "event-register-input--error" : ""} />
            {errors.name && <span className="event-register-error">{errors.name.message}</span>}

            <label htmlFor="reg-email">Correo electrónico</label>
            <input id="reg-email" type="email" placeholder="correo@ejemplo.com" {...register("email")} className={errors.email ? "event-register-input--error" : ""} />
            {errors.email && <span className="event-register-error">{errors.email.message}</span>}

            <label htmlFor="reg-phone">Teléfono (opcional)</label>
            <input id="reg-phone" type="text" inputMode="numeric" placeholder="10 dígitos" {...register("phone")} className={errors.phone ? "event-register-input--error" : ""} />
            {errors.phone && <span className="event-register-error">{errors.phone.message}</span>}

            <label className="event-register-check">
                <input type="checkbox" {...register("privacyAccepted")} />
                <span>Acepto el aviso de privacidad</span>
            </label>
            {errors.privacyAccepted && <span className="event-register-error">{errors.privacyAccepted.message}</span>}

            {apiError && (
                <p className="event-register-alert" role="alert">
                    {apiError}
                </p>
            )}

            <button type="submit" className="event-register-submit" disabled={isSubmitting}>
                {isSubmitting ? "Enviando..." : "Inscribirme"}
            </button>
        </form>
    );
}