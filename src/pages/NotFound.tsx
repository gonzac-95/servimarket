import { Link } from "react-router-dom";
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
      <div className="text-8xl font-bold text-gray-200 mb-4">404</div>
      <h1 className="text-2xl font-bold mb-2">Pagina no encontrada</h1>
      <p className="text-gray-500 mb-8">La pagina que buscas no existe.</p>
      <Link to="/" className="bg-indigo-600 text-white px-6 py-2 rounded-lg">Volver al inicio</Link>
    </div>
  );
}
