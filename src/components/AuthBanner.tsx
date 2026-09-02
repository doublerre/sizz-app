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
                <p className="font-bold text-amber-400">Sistema Integral Zigzag</p>
                <p className="mb-8">Gestiona tu visita con una cuenta segura y verificada</p>

                <div className="mt-12 flex flex-col gap-6">
                    {steps.map((step) => {
                        const isActive = currentStep === step.id;
                        // Use partial opacity for inactive steps to make the active one stand out
                        return (
                            <div key={step.id} className="flex items-center gap-4">
                                <div
                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 font-bold transition-colors ${isActive
                                            ? "border-amber-400 bg-amber-400 text-blue-900"
                                            : "border-white/40 bg-transparent text-white/60"
                                        }`}
                                >
                                    {step.id}
                                </div>
                                <span className={`text-lg font-medium transition-colors ${isActive ? "text-amber-400" : "text-white/60"
                                    }`}>
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
