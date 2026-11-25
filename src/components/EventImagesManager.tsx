import { useEffect, useMemo, useRef, useState } from "react";
import { isAxiosError } from "axios";
import { ImagePlus, Star, Trash2 } from "lucide-react";
import {
    deleteEventImage,
    eventImageUrl,
    makeEventCover,
    uploadEventImage,
    type ApiEvent,
} from "@/services/eventsApi";
import { resizeImage } from "@/utils/resizeImage";
import "./EventImagesManager.css";

// Mismo límite que el backend
const MAX_IMAGES = 8;

function errorMessage(err: unknown): string {
    if (isAxiosError(err)) return err.response?.data?.message ?? "No se pudo completar. Intenta de nuevo.";
    return "No se pudo leer la imagen.";
}

// Con evento guardado sube al momento; sin evento (al crear) solo guarda la lista y la página las sube al guardar
export default function EventImagesManager({
    event,
    onChange,
    pending,
    onPendingChange,
}: {
    event: ApiEvent | null;
    onChange: (updated: ApiEvent) => void;
    pending: File[];
    onPendingChange: (files: File[]) => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState("");
    const [error, setError] = useState("");

    // Vista previa local de las imágenes que aún no se suben
    const pendingUrls = useMemo(() => pending.map((file) => URL.createObjectURL(file)), [pending]);
    useEffect(() => () => pendingUrls.forEach((url) => URL.revokeObjectURL(url)), [pendingUrls]);

    const images = event
        ? event.imageIds.map((id) => ({ key: id, src: eventImageUrl(event.id, id) }))
        : pending.map((file, i) => ({ key: `${file.name}-${file.lastModified}-${i}`, src: pendingUrls[i] }));
    const remaining = MAX_IMAGES - images.length;

    const handleFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setError("");
        const selected = Array.from(files).slice(0, remaining);
        if (files.length > selected.length) setError(`Solo se agregaron ${selected.length}: el máximo es ${MAX_IMAGES}.`);

        if (!event) {
            onPendingChange([...pending, ...selected]);
            if (inputRef.current) inputRef.current.value = "";
            return;
        }

        try {
            // De una en una: el backend cuenta el límite con cada subida
            for (const [i, file] of selected.entries()) {
                setBusy(`Subiendo ${i + 1} de ${selected.length}...`);
                onChange(await uploadEventImage(event.id, await resizeImage(file)));
            }
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy("");
            if (inputRef.current) inputRef.current.value = "";
        }
    };

    const run = async (label: string, action: () => Promise<ApiEvent>) => {
        setError("");
        setBusy(label);
        try {
            onChange(await action());
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy("");
        }
    };

    const makeCover = (index: number) => {
        if (event) return run("Cambiando portada...", () => makeEventCover(event.id, event.imageIds[index]));
        onPendingChange([pending[index], ...pending.filter((_, i) => i !== index)]);
    };

    const remove = (index: number) => {
        if (!event) return onPendingChange(pending.filter((_, i) => i !== index));
        if (window.confirm("¿Quitar esta imagen?")) {
            run("Quitando...", () => deleteEventImage(event.id, event.imageIds[index]));
        }
    };

    return (
        <div className="event-images">
            <p className="event-images-hint">
                JPG, PNG o WebP, hasta {MAX_IMAGES} imágenes. La primera es la portada de la tarjeta.
                {!event && pending.length > 0 && " Se suben al guardar el evento."}
            </p>

            {images.length > 0 && (
                <ul className="event-images-grid">
                    {images.map((image, index) => (
                        <li key={image.key} className="event-images-item">
                            <img src={image.src} alt={`Imagen ${index + 1}`} loading="lazy" />
                            {index === 0 && <span className="event-images-cover">Portada</span>}
                            <div className="event-images-actions">
                                {index > 0 && (
                                    <button
                                        type="button"
                                        title="Usar como portada"
                                        aria-label="Usar como portada"
                                        disabled={!!busy}
                                        onClick={() => makeCover(index)}
                                    >
                                        <Star size={16} />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    title="Quitar imagen"
                                    aria-label="Quitar imagen"
                                    disabled={!!busy}
                                    onClick={() => remove(index)}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                hidden
                onChange={(e) => handleFiles(e.target.files)}
            />
            <button
                type="button"
                className="admin-event-btn admin-event-btn--ghost admin-event-btn--small"
                disabled={!!busy || remaining <= 0}
                onClick={() => inputRef.current?.click()}
            >
                <ImagePlus size={16} /> {busy || (remaining > 0 ? "Agregar imágenes" : "Límite alcanzado")}
            </button>

            {error && <p className="event-images-error" role="alert">{error}</p>}
        </div>
    );
}