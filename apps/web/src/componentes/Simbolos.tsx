/** Símbolos de los pueblos originarios, dibujados por el proyecto (SVG propio).
 *  - Chakana (cruz andina escalonada): se traza al entrar, como un sello.
 *  - Cinta textil: banda geométrica inspirada en telares andinos.
 *  Animaciones decorativas: respetan prefers-reduced-motion y nunca ocultan contenido. */

export function Chakana({ tamano = 56, trazar = true, className = '' }: { tamano?: number; trazar?: boolean; className?: string }) {
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 100 100"
      className={`chakana ${trazar ? 'chakana-trazada' : ''} ${className}`}
      role="img"
      aria-label="Chakana, cruz andina escalonada"
    >
      <path
        pathLength={100}
        d="M40 4h20v16h16v20h20v20H76v20H60v16H40V76H24V56H4V36h20V16h16z"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx="50" cy="50" r="7" fill="none" stroke="currentColor" strokeWidth="3" pathLength={100} />
      <circle cx="50" cy="50" r="2.2" fill="currentColor" />
    </svg>
  );
}

export function CintaTextil({ className = '' }: { className?: string }) {
  return <div className={`cinta-textil ${className}`} role="presentation" aria-hidden="true" />;
}
