import Navbar from "@/components/navbar";

export default function DownloadPage() {
  return (
    <main className="min-h-screen bg-[#050816] text-white overflow-hidden">

      <Navbar />

      <section className="relative flex min-h-screen items-center justify-center px-6 py-24">

        {/* BACKGROUND GLOW */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute left-[-120px] top-[-120px] h-[320px] w-[320px] rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="absolute bottom-[-120px] right-[-120px] h-[320px] w-[320px] rounded-full bg-blue-500/20 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl text-center">

          <p className="mb-6 text-xs uppercase tracking-[0.4em] text-cyan-400">
            MTAA AFRIQ MOBILE
          </p>

          <h1 className="text-5xl font-black leading-tight md:text-7xl">
            Download MTAA AFRIQ
          </h1>

          <p className="mx-auto mt-8 max-w-3xl text-lg leading-relaxed text-zinc-400">
            Install the next-generation African operating system directly
            on your Android device.
            <br />
            Communication, commerce, governance, identity, and infrastructure —
            unified into one platform.
          </p>

          {/* DOWNLOAD CARD */}
          <div className="mx-auto mt-16 max-w-2xl rounded-[32px] border border-white/10 bg-white/5 p-10 backdrop-blur-2xl">

            <div className="mb-6 flex items-center justify-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/20 text-2xl">
                📲
              </div>

              <div className="text-left">
                <h2 className="text-2xl font-bold">
                  Android APK
                </h2>

                <p className="text-sm text-zinc-500">
                  MTAA AFRIQ Developer Preview
                </p>
              </div>
            </div>

            <div className="grid gap-4 text-left md:grid-cols-3">

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  VERSION
                </p>

                <h3 className="mt-2 text-lg font-bold">
                  v10
                </h3>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  PLATFORM
                </p>

                <h3 className="mt-2 text-lg font-bold">
                  Android
                </h3>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  STATUS
                </p>

                <h3 className="mt-2 text-lg font-bold text-green-400">
                  Active
                </h3>
              </div>

            </div>

            <button className="mt-10 w-full rounded-2xl bg-white px-8 py-5 text-lg font-black text-black transition duration-300 hover:scale-[1.02]">
              Download APK
            </button>

            <p className="mt-6 text-sm text-zinc-500">
              iOS version coming later.
            </p>

          </div>

        </div>

      </section>

    </main>
  );
}
