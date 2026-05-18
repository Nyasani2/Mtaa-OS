import Navbar from "@/components/Navbar";

export default function DownloadPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 text-center">
        <p className="mb-6 text-sm uppercase tracking-[0.3em] text-zinc-500">
          MTAA OS
        </p>

        <h1 className="text-5xl font-black md:text-7xl">
          Download MTAA AFRIQ
        </h1>

        <p className="mt-8 max-w-2xl text-lg text-zinc-400">
          Install the MTAA AFRIQ Android build directly from the official
          platform.
        </p>

        <div className="mt-12 rounded-3xl border border-zinc-800 bg-zinc-950 p-10">
          <h2 className="text-3xl font-bold">Android APK</h2>

          <p className="mt-4 text-zinc-400">
            Latest developer preview build.
          </p>

          <button className="mt-8 rounded-2xl bg-white px-8 py-4 font-bold text-black transition hover:scale-105">
            Download APK
          </button>
        </div>
      </section>
    </main>
  );
}
