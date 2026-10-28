/** Gráficos SVG propios, sin dependencias: los datos provienen EXCLUSIVAMENTE
 *  de data/datos-semilla.json. Nada de cifras inventadas. */

export function Dona({
  datos,
  tamano = 148,
}: {
  datos: { rotulo: string; valor: number; color: string }[];
  tamano?: number;
}) {
  const total = datos.reduce((s, d) => s + d.valor, 0);
  const radio = tamano / 2 - 12;
  const circunferencia = 2 * Math.PI * radio;
  let acumulado = 0;

  return (
    <svg width={tamano} height={tamano} viewBox={`0 0 ${tamano} ${tamano}`} role="img" aria-label={`Distribución de ${total} registros por estado del semáforo`}>
      <circle cx={tamano / 2} cy={tamano / 2} r={radio} fill="none" stroke="rgba(94,64,33,0.12)" strokeWidth="16" />
      {total > 0 &&
        datos.map((d) => {
          if (d.valor <= 0) return null;
          const largo = (d.valor / total) * circunferencia;
          const elemento = (
            <circle
              key={d.rotulo}
              cx={tamano / 2}
              cy={tamano / 2}
              r={radio}
              fill="none"
              stroke={d.color}
              strokeWidth="16"
              strokeDasharray={`${largo} ${circunferencia - largo}`}
              strokeDashoffset={-acumulado}
              transform={`rotate(-90 ${tamano / 2} ${tamano / 2})`}
              strokeLinecap="butt"
            />
          );
          acumulado += largo;
          return elemento;
        })}
      <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" fontSize={tamano * 0.22} fontWeight="650" fill="currentColor" fontFamily="var(--mono)">
        {total}
      </text>
      <text x="50%" y="61%" textAnchor="middle" fontSize={tamano * 0.085} fill="var(--texto-3)" fontFamily="var(--mono)" letterSpacing="1.5">
        REGISTROS
      </text>
    </svg>
  );
}

export function Barras({ datos }: { datos: { rotulo: string; valor: number; maximo: number }[] }) {
  return (
    <div className="barras">
      {datos.map((d) => (
        <div key={d.rotulo} className="barra-fila">
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.rotulo}</span>
          <span className="barra-pista">
            <span className="barra-valor" style={{ width: `${d.maximo > 0 ? Math.max(6, (d.valor / d.maximo) * 100) : 6}%` }} />
          </span>
          <span className="barra-cifra">{d.valor}</span>
        </div>
      ))}
    </div>
  );
}
