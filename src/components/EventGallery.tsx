import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { eventImageUrl } from "@/services/eventsApi";
import "./EventGallery.css";

export default function EventGallery({
    eventId,
    imageIds,
    title,
}: {
    eventId: string;
    imageIds: string[];
    title: string;
}) {
    const trackRef = useRef<HTMLDivElement>(null);
    const [current, setCurrent] = useState(0);

    if (imageIds.length === 0) return null;

    const goTo = (index: number) => {
        const track = trackRef.current;
        if (!track) return;
        track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
    };

    const handleScroll = () => {
        const track = trackRef.current;
        if (track) setCurrent(Math.round(track.scrollLeft / track.clientWidth));
    };

    return (
        <div className="event-gallery">
            <div className="event-gallery-track" ref={trackRef} onScroll={handleScroll}>
                {imageIds.map((imageId, index) => (
                    <img
                        key={imageId}
                        src={eventImageUrl(eventId, imageId)}
                        alt={`${title}, imagen ${index + 1} de ${imageIds.length}`}
                        loading={index === 0 ? "eager" : "lazy"}
                    />
                ))}
            </div>

            {imageIds.length > 1 && (
                <>
                    <button
                        type="button"
                        className="event-gallery-arrow event-gallery-arrow--prev"
                        aria-label="Imagen anterior"
                        disabled={current === 0}
                        onClick={() => goTo(current - 1)}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        type="button"
                        className="event-gallery-arrow event-gallery-arrow--next"
                        aria-label="Imagen siguiente"
                        disabled={current === imageIds.length - 1}
                        onClick={() => goTo(current + 1)}
                    >
                        <ChevronRight size={20} />
                    </button>
                    <div className="event-gallery-dots" aria-hidden="true">
                        {imageIds.map((imageId, index) => (
                            <span key={imageId} className={index === current ? "is-active" : ""} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}