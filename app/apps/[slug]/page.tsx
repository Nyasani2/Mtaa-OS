import { socialApps, commercialApps, civicApps } from "@/lib/apps";

const allApps = [...socialApps, ...commercialApps, ...civicApps];

export default function AppPage({ params }: any) {
  const app = allApps.find((a) =>
    a.title.toLowerCase().replace(/\s+/g, "-") === params.slug
  );

  if (!app) {
    return (
      <div className="text-white p-10">
        App not found
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white px-6 py-20">
      <div className="max-w-4xl mx-auto">

        <div className="text-6xl mb-6">{app.icon}</div>

        <h1 className="text-4xl font-bold mb-4">
          {app.title}
        </h1>

        <p className="text-zinc-400 text-lg mb-10">
          {app.description}
        </p>

        <div className="border border-white/10 rounded-3xl h-[300px] flex items-center justify-center text-zinc-500">
          Screenshot / Flow Diagram Space
        </div>

        <div className="mt-10">
          <span className="px-3 py-1 border border-white/10 rounded-full text-sm">
            Status: {app.status}
          </span>
        </div>

      </div>
    </main>
  );
}
