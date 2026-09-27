import LegalLayout, { LegalSection } from "../components/LegalLayout";
import { SUPPORT_EMAIL } from "../lib/support";

// Términos y Condiciones — versión de lanzamiento web (sin cobro in-app).
// Si se activan los pagos dentro de la app, actualizar la sección 5.
// Conviene que un abogado lo revise cuando exista la figura legal (monotributo/sociedad).
const mail = <a href={`mailto:${SUPPORT_EMAIL}`} className="text-green-600 hover:underline">{SUPPORT_EMAIL}</a>;

export default function Terms() {
  return (
    <LegalLayout title="Términos y Condiciones" updatedAt="27 de septiembre de 2026">
      <p>
        Estos Términos y Condiciones regulan el uso de ServiMarket (la "Plataforma"), disponible en
        servimarket.app y en sus aplicaciones. Al registrarte o usar la Plataforma aceptás estos
        términos. Si no estás de acuerdo, no la utilices.
      </p>

      <LegalSection title="1. Qué es ServiMarket">
        <p>
          ServiMarket es una plataforma que conecta a personas que necesitan servicios para el hogar
          ("Clientes") con prestadores independientes ("Prestadores"), como gasistas, electricistas o
          plomeros. ServiMarket <strong>no presta los servicios</strong> ni emplea a los Prestadores:
          ofrece la herramienta para encontrarlos, pedir presupuestos, chatear y coordinar el trabajo.
        </p>
      </LegalSection>

      <LegalSection title="2. Registro y cuenta">
        <ul className="list-disc pl-5 space-y-1">
          <li>Tenés que ser mayor de 18 años y brindar datos veraces y actualizados.</li>
          <li>Sos responsable de cuidar tu contraseña y de la actividad que se realice desde tu cuenta.</li>
          <li>Podemos suspender o dar de baja cuentas que incumplan estos términos, brinden datos falsos o actúen de forma fraudulenta.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Prestadores y verificación">
        <ul className="list-disc pl-5 space-y-1">
          <li>Los Prestadores trabajan de forma independiente y son los únicos responsables por la calidad, seguridad y legalidad de sus servicios.</li>
          <li>Cada Prestador debe cumplir sus obligaciones impositivas, previsionales y de habilitación (por ejemplo, matrícula de gasista cuando corresponda).</li>
          <li>
            Para aparecer en las búsquedas, el Prestador debe enviar su DNI y ServiMarket lo revisa. También puede
            presentar certificado de antecedentes y, si corresponde, matrícula. Estas verificaciones confirman la
            identidad y la documentación presentada, pero <strong>no garantizan</strong> la idoneidad ni el resultado
            de un trabajo.
          </li>
          <li>El Prestador declara que la documentación que envía es auténtica y le pertenece.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Presupuestos y trabajos">
        <ul className="list-disc pl-5 space-y-1">
          <li>El Cliente describe lo que necesita y el Prestador envía un presupuesto. El trabajo se acuerda cuando el Cliente lo acepta.</li>
          <li>Precio, fecha, materiales y condiciones se pactan directamente entre Cliente y Prestador.</li>
          <li>El Prestador marca el trabajo como terminado y el Cliente lo confirma. Ante un desacuerdo, las partes deben intentar resolverlo de buena fe por el chat; ServiMarket puede colaborar, pero no está obligado a resolverlo.</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Pagos">
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Por ahora <strong>ServiMarket no procesa pagos</strong>: el Cliente le paga directamente al Prestador por
            el medio que acuerden (efectivo, transferencia, etc.).
          </li>
          <li>Usar ServiMarket es gratis para Clientes y Prestadores. No cobramos comisiones.</li>
          <li>ServiMarket no interviene en el cobro, la facturación ni los reembolsos entre las partes.</li>
          <li>Si en el futuro incorporamos pagos dentro de la Plataforma o algún costo, lo avisaremos con anticipación y actualizaremos estos términos antes de aplicarlo.</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Reseñas">
        <p>
          Los Clientes pueden dejar una reseña cuando un trabajo fue marcado como terminado por el Prestador y
          confirmado por el Cliente. Las reseñas deben reflejar experiencias reales. ServiMarket puede moderar o
          quitar reseñas falsas, ofensivas o que violen estos términos. El contenido que publicás sigue siendo tuyo,
          pero nos das permiso para mostrarlo dentro de la Plataforma.
        </p>
      </LegalSection>

      <LegalSection title="7. Conducta">
        <p>Al usar ServiMarket te comprometés a no:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Publicar información falsa, ofensiva o que infrinja derechos de terceros.</li>
          <li>Usar la Plataforma con fines ilícitos, fraudulentos o para enviar publicidad no solicitada.</li>
          <li>Acosar, discriminar o poner en riesgo a otros usuarios.</li>
          <li>Suplantar la identidad de otra persona o presentar documentación ajena.</li>
        </ul>
      </LegalSection>

      <LegalSection title="8. Responsabilidad">
        <p>
          ServiMarket actúa como intermediario y no es parte del acuerdo entre Cliente y Prestador. En la medida
          permitida por la ley, no respondemos por daños derivados de la ejecución (o falta de ejecución) de los
          servicios acordados entre usuarios. Nada de esto limita los derechos que te reconoce la Ley 24.240 de
          Defensa del Consumidor.
        </p>
      </LegalSection>

      <LegalSection title="9. Cambios">
        <p>
          Podemos modificar, suspender o discontinuar funciones de la Plataforma, y actualizar estos términos. La
          versión vigente, con su fecha, está siempre en esta página. Si el cambio es importante, te lo vamos a
          avisar por email o dentro de la Plataforma.
        </p>
      </LegalSection>

      <LegalSection title="10. Ley aplicable y jurisdicción">
        <p>
          Estos términos se rigen por las leyes de la República Argentina. Cualquier controversia se someterá a los
          tribunales ordinarios competentes según el domicilio del usuario, sin perjuicio de su derecho a acudir a
          los organismos de defensa del consumidor.
        </p>
      </LegalSection>

      <LegalSection title="11. Contacto">
        <p>Para consultas sobre estos términos escribinos a {mail}.</p>
      </LegalSection>
    </LegalLayout>
  );
}
