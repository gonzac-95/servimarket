import LegalLayout, { LegalSection } from "../components/LegalLayout";

// NOTA: Borrador estándar. Revisar con un profesional legal antes de publicar.
// Completar los campos entre [corchetes] con los datos reales del titular.
const CONTACT_EMAIL = "contacto@servimarket.app";

export default function Terms() {
  return (
    <LegalLayout title="Términos y Condiciones" updatedAt="22 de mayo de 2026">
      <p>
        Estos Términos y Condiciones regulan el uso de ServiMarket (la "Plataforma"). Al registrarte
        o utilizar el servicio, aceptás estos términos en su totalidad. Si no estás de acuerdo, no
        utilices la Plataforma.
      </p>

      <LegalSection title="1. Qué es ServiMarket">
        <p>
          ServiMarket es un marketplace que conecta a personas que necesitan servicios del hogar
          ("Clientes") con prestadores independientes ("Prestadores"). ServiMarket{" "}
          <strong>no presta directamente los servicios</strong> publicados ni emplea a los Prestadores:
          actúa únicamente como intermediario tecnológico que facilita el contacto, la coordinación
          y el pago.
        </p>
      </LegalSection>

      <LegalSection title="2. Registro y cuenta">
        <ul className="list-disc pl-5 space-y-1">
          <li>Debés ser mayor de 18 años y brindar información veraz y actualizada.</li>
          <li>Sos responsable de mantener la confidencialidad de tu contraseña y de toda actividad realizada desde tu cuenta.</li>
          <li>Podemos suspender o cancelar cuentas que incumplan estos términos o realicen conductas fraudulentas.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Rol de los Prestadores">
        <ul className="list-disc pl-5 space-y-1">
          <li>Los Prestadores son trabajadores independientes y los únicos responsables por la calidad, legalidad y ejecución de los servicios que ofrecen.</li>
          <li>Cada Prestador es responsable de cumplir con sus obligaciones impositivas, previsionales y de habilitación profesional (matrículas, seguros, etc.) según la normativa vigente.</li>
          <li>ServiMarket no garantiza la idoneidad de un Prestador más allá de los procesos de verificación que pueda aplicar.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Pagos y comisiones">
        <ul className="list-disc pl-5 space-y-1">
          <li>Los pagos se procesan a través de MercadoPago. Al pagar, aceptás también los términos de ese proveedor.</li>
          <li>ServiMarket cobra una comisión fija por cada trabajo, calculada según el tramo de precio. El monto de la comisión se muestra de forma clara antes de confirmar.</li>
          <li>El precio de cada servicio es acordado entre Cliente y Prestador a través de las cotizaciones de la Plataforma.</li>
          <li>Las solicitudes de reembolso se evalúan caso por caso conforme a la normativa de defensa del consumidor aplicable.</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Finalización de trabajos">
        <p>
          Un trabajo se considera completado cuando el Cliente confirma su finalización. El Prestador
          marca el trabajo como terminado y el Cliente debe confirmarlo. Ante desacuerdos, las partes
          deben intentar resolverlos de buena fe a través del chat de la Plataforma.
        </p>
      </LegalSection>

      <LegalSection title="6. Conducta del usuario">
        <p>Al usar ServiMarket te comprometés a no:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Publicar información falsa, ofensiva o que infrinja derechos de terceros.</li>
          <li>Usar la Plataforma para fines ilícitos o fraudulentos.</li>
          <li>Evadir las comisiones coordinando pagos por fuera de la Plataforma de manera que perjudique el funcionamiento del servicio.</li>
          <li>Acosar, discriminar o dañar a otros usuarios.</li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Reseñas y contenido">
        <p>
          Los usuarios pueden dejar reseñas basadas en experiencias reales. ServiMarket puede moderar
          o eliminar contenido que viole estos términos. El contenido que publicás sigue siendo tuyo,
          pero nos otorgás una licencia para mostrarlo dentro de la Plataforma.
        </p>
      </LegalSection>

      <LegalSection title="8. Limitación de responsabilidad">
        <p>
          ServiMarket actúa como intermediario y no es parte de la relación contractual entre Cliente
          y Prestador. En la máxima medida permitida por la ley, no nos responsabilizamos por daños
          derivados de la ejecución (o falta de ejecución) de los servicios contratados entre usuarios.
          Esto no limita los derechos que la normativa de defensa del consumidor te reconoce.
        </p>
      </LegalSection>

      <LegalSection title="9. Modificaciones del servicio">
        <p>
          Podemos modificar, suspender o discontinuar funciones de la Plataforma en cualquier momento.
          También podemos actualizar estos términos; la versión vigente estará siempre disponible en
          esta página.
        </p>
      </LegalSection>

      <LegalSection title="10. Ley aplicable y jurisdicción">
        <p>
          Estos términos se rigen por las leyes de la República Argentina. Ante cualquier controversia,
          las partes se someten a los tribunales ordinarios competentes de [CIUDAD/JURISDICCIÓN],
          sin perjuicio de los derechos del consumidor de acudir a los organismos de defensa del consumidor.
        </p>
      </LegalSection>

      <LegalSection title="11. Contacto">
        <p>
          Para consultas sobre estos términos escribinos a{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-green-600 hover:underline">{CONTACT_EMAIL}</a>.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
