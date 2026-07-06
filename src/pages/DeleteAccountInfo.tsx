import { Link } from "react-router-dom";
import LegalLayout, { LegalSection } from "../components/LegalLayout";

// Página pública de eliminación de cuenta.
// Google Play exige una URL accesible desde fuera de la app donde el
// usuario pueda eliminar su cuenta o pedir la eliminación.
export default function DeleteAccountInfo() {
  return (
    <LegalLayout title="Eliminar tu cuenta de ServiMarket" updatedAt="Julio 2026">
      <LegalSection title="Desde la app (recomendado)">
        <p>
          Podés eliminar tu cuenta en cualquier momento desde la app:
        </p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Abrí ServiMarket e iniciá sesión.</li>
          <li>Andá a <strong>Perfil</strong> (pestaña inferior derecha).</li>
          <li>Tocá <strong>"Eliminar mi cuenta"</strong> al final de la pantalla.</li>
          <li>Confirmá la eliminación.</li>
        </ol>
        <p>
          Si estás usando la versión web, podés hacerlo directamente desde{" "}
          <Link to="/settings" className="text-green-700 underline font-medium">tu perfil</Link>.
        </p>
      </LegalSection>

      <LegalSection title="Qué datos se eliminan">
        <p>
          Al eliminar tu cuenta se borran de forma permanente tus datos personales:
          nombre, correo electrónico, teléfono, foto de perfil, ubicación y credenciales
          de acceso. No vas a poder volver a ingresar con esa cuenta.
        </p>
      </LegalSection>

      <LegalSection title="Qué datos se conservan">
        <p>
          El historial de trabajos, pagos y reseñas se conserva <strong>de forma
          anonimizada</strong> (sin ningún dato que te identifique), porque forma parte
          del historial de la otra parte y de los registros de facturación que exige
          la normativa vigente.
        </p>
      </LegalSection>

      <LegalSection title="¿No podés acceder a la app?">
        <p>
          Si perdiste el acceso a tu cuenta, escribinos a{" "}
          <a href="mailto:soporte@servimarket.app" className="text-green-700 underline font-medium">
            soporte@servimarket.app
          </a>{" "}
          desde el correo con el que te registraste y procesamos la eliminación
          en un plazo máximo de 30 días.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
