import LegalLayout, { LegalSection } from "../components/LegalLayout";
import { SUPPORT_EMAIL } from "../lib/support";

// Política de Privacidad — versión de lanzamiento web (Ley 25.326).
// Si se suma un proveedor nuevo que reciba datos (pagos, mapas, etc.), agregarlo en la sección 5.
const mail = <a href={`mailto:${SUPPORT_EMAIL}`} className="text-green-600 hover:underline">{SUPPORT_EMAIL}</a>;

export default function PrivacyPolicy() {
  return (
    <LegalLayout title="Política de Privacidad" updatedAt="27 de septiembre de 2026">
      <p>
        En ServiMarket cuidamos tus datos. Esta política explica qué datos personales recopilamos, para qué los
        usamos, con quién los compartimos y qué derechos tenés, de acuerdo con la Ley 25.326 de Protección de
        los Datos Personales de la República Argentina.
      </p>

      <LegalSection title="1. Responsable">
        <p>
          El responsable de los datos es ServiMarket (servimarket.app). Para cualquier consulta sobre tus datos
          escribinos a {mail}.
        </p>
      </LegalSection>

      <LegalSection title="2. Qué datos recopilamos">
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Cuenta:</strong> nombre, email, contraseña (guardada cifrada), teléfono si lo cargás, ciudad y tipo de cuenta (cliente o prestador). Si entrás con Google, recibimos tu nombre, email y foto.</li>
          <li><strong>Perfil de prestador:</strong> rubros, descripción, zonas de trabajo, precios de referencia, fotos de trabajos y, si lo cargás, CUIT/CUIL (no se muestra a otros usuarios).</li>
          <li>
            <strong>Documentos de verificación (prestadores):</strong> foto de tu DNI y, si los enviás, certificado de
            antecedentes y matrícula. Se guardan en un almacenamiento privado, sólo los ve el equipo de ServiMarket
            para verificar tu identidad y nunca se muestran a otros usuarios.
          </li>
          <li><strong>Uso del servicio:</strong> pedidos, presupuestos, mensajes del chat, reseñas, y la dirección y fotos que cargás en un pedido.</li>
          <li><strong>Avisos:</strong> tu preferencia de avisos por email y, si activás las notificaciones, el identificador de tu navegador o dispositivo para enviártelas.</li>
          <li>
            <strong>Datos de uso y técnicos:</strong> páginas que visitás y acciones dentro de la web (por ejemplo, búsquedas o
            pedidos enviados), tipo de dispositivo y navegador, y ubicación aproximada según la IP. Los asociamos a un
            identificador interno, no a tu nombre ni a tu email.
          </li>
        </ul>
        <p>Hoy ServiMarket no procesa pagos, así que no recibimos datos de tarjetas ni cuentas bancarias.</p>
      </LegalSection>

      <LegalSection title="3. Para qué los usamos">
        <ul className="list-disc pl-5 space-y-1">
          <li>Crear y administrar tu cuenta.</li>
          <li>Conectar clientes con prestadores y permitir pedir presupuestos, chatear y coordinar trabajos.</li>
          <li>Verificar la identidad de los prestadores.</li>
          <li>Enviarte avisos sobre tus trabajos (por email y, si las activás, notificaciones).</li>
          <li>Entender cómo se usa la web para mejorarla.</li>
          <li>Prevenir fraudes, abusos y cuidar la seguridad de la plataforma.</li>
        </ul>
        <p>No usamos tus datos para publicidad de terceros ni los vendemos.</p>
      </LegalSection>

      <LegalSection title="4. Qué ven otros usuarios">
        <ul className="list-disc pl-5 space-y-1">
          <li>Del prestador: nombre, foto, ciudad, rubros, descripción, fotos de trabajos, precios de referencia, calificación, reseñas y si está verificado.</li>
          <li>Del cliente: nombre y foto, y las reseñas que publica.</li>
          <li>Los datos de un pedido (descripción, dirección, fotos, mensajes) sólo los ven el cliente y el prestador de ese pedido.</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Con quién los compartimos">
        <p>Usamos proveedores que tratan datos por cuenta nuestra, sólo para prestar el servicio:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Supabase:</strong> base de datos, inicio de sesión y almacenamiento de archivos.</li>
          <li><strong>Vercel:</strong> alojamiento de la web.</li>
          <li><strong>Resend:</strong> envío de emails.</li>
          <li><strong>PostHog:</strong> estadísticas de uso de la web.</li>
          <li><strong>Google Firebase:</strong> notificaciones de la app para celulares.</li>
          <li><strong>Google:</strong> sólo si elegís iniciar sesión con tu cuenta de Google.</li>
        </ul>
        <p>
          Algunos de estos proveedores guardan los datos en servidores fuera de Argentina (principalmente en Estados
          Unidos). Al usar ServiMarket prestás tu consentimiento para esa transferencia, que se hace con proveedores que
          aplican medidas de seguridad adecuadas. También podemos compartir datos si lo exige una autoridad competente.
        </p>
      </LegalSection>

      <LegalSection title="6. Cookies y almacenamiento del navegador">
        <p>
          Usamos el almacenamiento del navegador para mantener tu sesión iniciada y recordar preferencias, y cookies
          de PostHog para las estadísticas de uso. No usamos cookies de publicidad. Podés borrarlas o bloquearlas desde
          la configuración de tu navegador; si tu navegador envía la señal "No rastrear" (Do Not Track), no registramos
          estadísticas de tu visita.
        </p>
      </LegalSection>

      <LegalSection title="7. Tus derechos">
        <p>
          Podés acceder a tus datos, pedir que los corrijamos o actualicemos, y pedir que los eliminemos. El acceso es
          gratuito cada seis meses; respondemos los pedidos de acceso en un plazo de 10 días corridos y los de
          corrección o eliminación en 5 días hábiles. Podés editar tu perfil desde la web, eliminar tu cuenta desde
          Perfil → "Eliminar mi cuenta" (ver <a href="/eliminar-cuenta" className="text-green-600 hover:underline">servimarket.app/eliminar-cuenta</a>)
          o escribirnos a {mail}.
        </p>
        <p className="text-xs text-gray-500">
          La Agencia de Acceso a la Información Pública (AAIP), órgano de control de la Ley 25.326, tiene la atribución
          de atender las denuncias y reclamos de quienes resulten afectados en sus derechos por incumplimiento de las
          normas vigentes en materia de protección de datos personales.
        </p>
      </LegalSection>

      <LegalSection title="8. Cuánto tiempo los guardamos">
        <p>
          Guardamos tus datos mientras tengas la cuenta activa. Si la eliminás, borramos tus datos personales, tus fotos
          y tus documentos de verificación. El historial de trabajos y reseñas queda anonimizado (sin datos que te
          identifiquen) porque también forma parte del historial de la otra persona. Las estadísticas de uso se guardan
          por un tiempo limitado y no incluyen tu nombre ni tu email.
        </p>
      </LegalSection>

      <LegalSection title="9. Seguridad">
        <p>
          La información viaja cifrada (HTTPS) y el acceso a la base de datos está restringido por reglas de seguridad:
          cada usuario sólo puede ver lo que le corresponde. Ningún sistema es infalible, pero aplicamos medidas
          razonables para proteger tus datos.
        </p>
      </LegalSection>

      <LegalSection title="10. Menores de edad">
        <p>ServiMarket es para mayores de 18 años. No recopilamos a sabiendas datos de menores.</p>
      </LegalSection>

      <LegalSection title="11. Cambios en esta política">
        <p>
          Podemos actualizar esta política. La versión vigente, con su fecha, está siempre en esta página. Si el cambio
          es importante, te lo vamos a avisar por email o dentro de la web.
        </p>
      </LegalSection>

      <LegalSection title="12. Contacto">
        <p>Ante cualquier duda sobre esta política o tus datos, escribinos a {mail}.</p>
      </LegalSection>
    </LegalLayout>
  );
}
