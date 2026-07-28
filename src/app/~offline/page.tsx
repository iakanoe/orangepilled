export const metadata = { title: "Sin conexión" };

export default function OfflinePage() {
  return (
    <main className="grid min-h-dvh place-items-center p-6 text-center">
      <div>
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gray-200 text-3xl">
          📡
        </div>
        <h1 className="text-xl font-bold">Sin conexión</h1>
        <p className="mt-2 max-w-xs text-sm text-gray-500">
          No pudimos cargar esta página. Los reportes que envíes se guardan y se
          mandan solos cuando vuelva internet.
        </p>
      </div>
    </main>
  );
}
