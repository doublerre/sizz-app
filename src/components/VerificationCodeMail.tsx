import logoZigzag from "@/assets/logo_zigzag_main.svg";

interface VerificationCodeMailProps {
  firstName: string;
  code: string;
}

const VerificationCodeMail = ({ firstName, code }: VerificationCodeMailProps) => {
  const styles: Record<string, React.CSSProperties> = {
    wrapper: {
      backgroundColor: "#EDF0F4",
      padding: "40px 16px 60px",
      fontFamily: "'Segoe UI', Arial, sans-serif",
      minHeight: "100vh",
    },
    card: {
      backgroundColor: "#FFFFFF",
      borderRadius: "16px",
      maxWidth: "600px",
      margin: "0 auto",
      overflow: "hidden",
      boxShadow: "0 4px 24px rgba(0, 0, 0, 0.08)",
    },
    header: {
      backgroundColor: "#0D2137",
      padding: "32px 24px",
      textAlign: "center" as const,
    },
    logo: {
      height: "56px",
      marginBottom: "8px",
    },
    tagline: {
      color: "#5BA4CF",
      fontSize: "0.72rem",
      letterSpacing: "0.03em",
      margin: 0,
    },
    body: {
      padding: "36px 40px 32px",
    },
    greeting: {
      fontSize: "1.05rem",
      fontWeight: 600,
      color: "#1A2B3C",
      margin: "0 0 4px",
    },
    headline: {
      fontSize: "1.75rem",
      fontWeight: 700,
      color: "#0D2137",
      margin: "0 0 20px",
      lineHeight: 1.2,
    },
    subtext: {
      fontSize: "0.9rem",
      color: "#6B7A8D",
      lineHeight: 1.6,
      textAlign: "center" as const,
      margin: "0 0 28px",
    },
    codeBox: {
      backgroundColor: "#E8F2FB",
      borderRadius: "12px",
      padding: "28px 24px 20px",
      textAlign: "center" as const,
      marginBottom: "28px",
    },
    codeLabel: {
      fontSize: "0.72rem",
      fontWeight: 700,
      color: "#1668BE",
      letterSpacing: "0.1em",
      textTransform: "uppercase" as const,
      margin: "0 0 12px",
    },
    codeValue: {
      fontSize: "3rem",
      fontWeight: 800,
      color: "#0D2137",
      letterSpacing: "0.12em",
      lineHeight: 1,
      margin: "0 0 12px",
    },
    codeValidity: {
      fontSize: "0.82rem",
      color: "#D44B21",
      fontWeight: 600,
      margin: 0,
    },
    ctaButton: {
      display: "block",
      backgroundColor: "#1668BE",
      color: "#FFFFFF",
      textDecoration: "none",
      textAlign: "center" as const,
      padding: "16px 24px",
      borderRadius: "8px",
      fontSize: "0.95rem",
      fontWeight: 700,
      letterSpacing: "0.02em",
      marginBottom: "20px",
      cursor: "pointer",
    },
    fallbackText: {
      fontSize: "0.82rem",
      color: "#6B7A8D",
      lineHeight: 1.6,
      textAlign: "center" as const,
      margin: "0 0 32px",
    },
    divider: {
      borderColor: "#E2E8EF",
      borderStyle: "solid",
      borderWidth: "1px 0 0",
      margin: "0 0 24px",
    },
    noRequestTitle: {
      fontSize: "0.95rem",
      fontWeight: 700,
      color: "#1A2B3C",
      margin: "0 0 8px",
    },
    noRequestText: {
      fontSize: "0.82rem",
      color: "#6B7A8D",
      lineHeight: 1.6,
      margin: 0,
    },
    footer: {
      borderTop: "1px solid #E2E8EF",
      padding: "20px 40px",
      textAlign: "center" as const,
    },
    footerText: {
      fontSize: "0.78rem",
      color: "#9AAABB",
      margin: 0,
      letterSpacing: "0.02em",
    },
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <img src={logoZigzag} alt="Logo Zigzag" style={styles.logo} />
          <p style={styles.tagline}>Centro Interactivo de Ciencia y Tecnología · Zacatecas</p>
        </div>

        {/* Body */}
        <div style={styles.body}>
          <p style={styles.greeting}>Hola, {firstName}</p>
          <h1 style={styles.headline}>Confirma tu correo electrónico</h1>

          <p style={styles.subtext}>
            Gracias por crear una cuenta en el Sistema Integral Zigzag.
            <br />
            Usa el siguiente código para completar tu registro:
          </p>

          {/* Code Box */}
          <div style={styles.codeBox}>
            <p style={styles.codeLabel}>Código de Verificación</p>
            <p style={styles.codeValue}>{code}</p>
            <p style={styles.codeValidity}>Válido durante 10 minutos</p>
          </div>

          {/* CTA Button */}
          <a href="/register" style={styles.ctaButton}>
            Validar mi correo electrónico
          </a>

          {/* Fallback */}
          <p style={styles.fallbackText}>
            Si el botón no funciona, vuelve a la pantalla de registro e ingresa
            manualmente el código <strong>{code}</strong>.
          </p>

          <hr style={styles.divider} />

          {/* No request section */}
          <p style={styles.noRequestTitle}>¿No solicitaste esta cuenta?</p>
          <p style={styles.noRequestText}>
            Puedes ignorar este correo. Nadie podrá activar la cuenta sin el
            código de verificación.
          </p>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <p style={styles.footerText}>
            Centro Interactivo de Ciencia y Tecnología Zigzag · Zacatecas
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerificationCodeMail;
