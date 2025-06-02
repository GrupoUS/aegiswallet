// import Link from 'next/link'; // Pode ser usado para navegação otimizada

export default function NotFound() {
  // O Next.js App Router lida com a renderização desta página automaticamente para rotas 404.
  // A lógica de log específica do pathname que existia com useLocation
  // não é diretamente transferível aqui, pois not-found.tsx pode ser um Server Component.
  // O Next.js já fornece logs no lado do servidor para 404s.

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-center p-4">
      <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
      <p className="text-2xl text-gray-600 mb-2">Oops! Página não encontrada.</p>
      <p className="text-md text-gray-500 mb-8">
        Não conseguimos encontrar a página que você está procurando.
      </p>
      <a
        href="/"
        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-150"
      >
        Retornar à Página Inicial
      </a>
    </div>
  );
}
