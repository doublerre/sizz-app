import logo from "../assets/logo_zigzag.png";

type AuthBannerProps = {
    currentStep: 1 | 2 | 3;
};

export function AuthBanner({ currentStep }: AuthBannerProps) {
    const steps = [
        { id: 1, label: "Registra tus datos" },
        { id: 2, label: "Verifica tu correo" },
        { id: 3, label: "Cuenta lista" },
    ];

    return (
        <div className="login-banner">
            <div className="banner-content">
                <img src={logo} alt="ZigZag Logo" className="logo" />

                <h1>Ciencia que se organiza, visitas que se conectan.</h1>
                <p className="banner-system-name">Sistema Integral Zigzag</p>
                <p className="banner-system-desc">
                    Gestiona tu visita con una cuenta segura y verificada
                </p>
                <div className="banner-steps">
                    {steps.map((step) => {
                        const isActive = currentStep === step.id;
                        return (
                            <div key={step.id} style={{ display: "flex", alignItems: "center", gap: "1.1rem" }}>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        width: "2.6rem",
                                        height: "2.6rem",
                                        borderRadius: "50%",
                                        border: `2px solid ${isActive ? "#F5A623" : "rgba(255,255,255,0.4)"}`,
                                        backgroundColor: isActive ? "#F5A623" : "transparent",
                                        color: isActive ? "#004F8F" : "rgba(255,255,255,0.6)",
                                        fontWeight: 700,
                                        fontSize: "1rem",
                                        flexShrink: 0,
                                        transition: "all 0.2s",
                                        fontFamily: "'Montserrat', system-ui, sans-serif",
                                    }}
                                >
                                    {step.id}
                                </div>
                                <span
                                    style={{
                                        fontSize: "1rem",
                                        fontWeight: 600,
                                        color: isActive ? "#F5A623" : "rgba(255,255,255,0.6)",
                                        transition: "color 0.2s",
                                        fontFamily: "'Montserrat', system-ui, sans-serif",
                                    }}
                                >
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
