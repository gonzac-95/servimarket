import LegalLayout, { LegalSection } from "../components/LegalLayout";

// NOTA: Borrador estándar. Revisar con un profesional legal antes de publicar.
// Completar los campos entre [corchetes] con los datos reales del titular.
const CONTACT_EMAIL = "contacto@servimarket.com"; // TODO: reemplazar por el email real

export default function PrivacyPolicy() {
  return (
    <LegalLayout title="Política de Privacidad" updatedAt="4 de julio de 2026">
      <p>
        En ServiMarket valoramos tu privacidad. Esta política explica qué datos personales
        recopilamos, con qué fin, con quién los compartimos y qué derechos tenés sobre ellos,
        en cumplimiento de la Ley 25.326 de Protección de Datos Personales de la República Argentina.
      </p>

      <LegalSection title="1. Responsable del tratamiento">
        <p>
          El responsable de la base de datos es [RAZÓN SOCIAL / NOMBRE DEL TITULAR], CUIT [CUIT],
          con domicilio en [DOMICILIO], Argentina. Para cualquier consulta sobre tus datos podés
          escribir a <a href={`mailto:${CONTACT_EMAIL}`} className="text-green-600 hover:underline">{CONTACT_EMAIL}</a>.
        </p>
      </LegalSection>

      <LegalSection title="2. Qué datos recopilamos">
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Datos de registro:</strong> nombre, email, teléfono y rol (cliente o prestador).</li>
          <li><strong>Datos de perfil (prestadores):</strong> descripción, categorías, zonas de servicio, fotos de trabajos, CUIT/CUIL.</li>
          <li><strong>Datos de uso:</strong> solicitudes de servicio, mensajes, reseñas y calificaciones.</li>
          <li><strong>Datos de ubicación:</strong> ciudad y dirección del trabajo que ingresás al crear una solicitud.</li>
          <li><strong>Datos de pago:</strong> los pagos se procesan a través de MercadoPago. No almacenamos números de tarjeta ni datos financieros sensibles en nuestros servidores.</li>
          <li><strong>Datos técnicos:</strong> información básica del dispositivo y token de notificaciones cuando usás la app móvil.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Cómo usamos tus datos">
        <ul className="list-disc pl-5 space-y-1">
          <li>Crear y administrar tu cuenta.</li>
          <li>Conectar clientes con prestadores y permitir la coordinación de trabajos.</li>
          <li>Procesar pagos y calcular comisiones.</li>
          <li>Enviar notificaciones relacionadas con tus trabajos.</li>
          <li>Prevenir fraudes y garantizar la seguridad de la plataforma.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Con quién compartimos tus datos">
        <p>Compartimos datos únicamente con los proveedores necesarios para operar el servicio:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Supabase:</strong> alojamiento de la base de datos y autenticación.</li>
          <li><strong>MercadoPago:</strong> procesamiento de pagos.</li>
          <li><strong>Google Firebase:</strong> envío de notificaciones push a la app móvil.</li>
        </ul>
        <p>
          No vendemos tus datos personales a terceros. Los datos visibles para otros usuarios
          (como tu nombre, perfil de prestador y reseñas) se comparten dentro de la plataforma
          para el funcionamiento del marketplace.
        </p>
      </LegalSection>

      <LegalSection title="5. Tus derechos">
        <p>
          Como titular de los datos, tenés derecho a acceder, rectificar, actualizar y solicitar
          la supresión de tus datos personales. Podés eliminar tu cuenta directamente desde la
          app (Perfil → Eliminar mi cuenta) o siguiendo las instrucciones en{" "}
          <a href="/eliminar-cuenta" className="text-green-600 hover:underline">servimarket.com/eliminar-cuenta</a>.
          También podés escribirnos a{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-green-600 hover:underline">{CONTACT_EMAIL}</a>.
        </p>
        <p className="text-xs text-gray-500">
          La Agencia de Acceso a la Información Pública (AAIP), órgano de control de la Ley 25.326,
          tiene la atribución de atender denuncias y reclamos respecto del incumplimiento de las
          normas sobre protección de datos personales.
        </p>
      </LegalSection>

      <LegalSection title="7. Seguridad">
        <p>
          Aplicamos medidas técnicas y organizativas razonables para proteger tus datos. La
          información se transmite cifrada (HTTPS) y el acceso a la base de datos está restringido
          mediante políticas de seguridad. Ningún sistema es 100% infalible, por lo que no podemos
          garantizar seguridad absoluta.
        </p>
      </LegalSection>

      <LegalSection title="8. Conservación de datos">
        <p>
          Conservamos tus datos mientras tu cuenta esté activa o sea necesario para prestar el
          servicio y cumplir obligaciones legales (por ejemplo, registros fiscales). Si solicitás
          la baja, eliminaremos o anonimizaremos tus datos salvo aquellos que debamos conservar por ley.
        </p>
      </LegalSection>

      <LegalSection title="9. Menores de edad">
        <p>
          ServiMarket está dirigido a personas mayores de 18 años. No recopilamos intencionalmente
          datos de menores de edad.
        </p>
      </LegalSection>

      <LegalSection title="10. Cambios en esta política">
        <p>
          Podemos actualizar esta política. Publicaremos la versión vigente en esta página con su
          fecha de última actualización. El uso continuado del servicio implica la aceptación de
          los cambios.
        </p>
      </LegalSection>

      <LegalSection title="11. Contacto">
        <p>
          Ante cualquier duda sobre esta política o el tratamiento de tus datos, escribinos a{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-green-600 hover:underline">{CONTACT_EMAIL}</a>.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
