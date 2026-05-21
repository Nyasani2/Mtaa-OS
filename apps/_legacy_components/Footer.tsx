export default function Footer() {
  return (
    <footer className="border-t border-white/10 py-16 px-6">

      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10">

        <div>
          <h2 className="font-bold text-xl mb-3">
            MTAA AFRIQ
          </h2>

          <p className="text-sm text-zinc-500 leading-relaxed">
            Civilization-scale operating system for Africa’s economy,
            governance, infrastructure, and digital society.
          </p>
        </div>

        <div>
          <h3 className="font-semibold mb-4">
            Platform
          </h3>

          <div className="space-y-2 text-sm text-zinc-400">
            <p>Social Layer</p>
            <p>Economic Layer</p>
            <p>Civic Layer</p>
            <p>National Intelligence</p>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-4">
            Access
          </h3>

          <div className="space-y-2 text-sm text-zinc-400">
            <p>Simulation Demo</p>
            <p>Waitlist Access</p>
            <p>Developer Ecosystem</p>
            <p>Government Infrastructure</p>
          </div>
        </div>

      </div>

      <div className="text-center text-zinc-600 text-sm mt-16">
        © 2026 MTAA AFRIQ • Built for the African Century
      </div>

    </footer>
  );
}
