import { Lock } from "lucide-react";

export function WhopAccessRequired({ label }: { label: "admin" | "member" }) {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#f6f5ef] p-3 text-[#151515] sm:p-4">
      <section className="w-full max-w-xl rounded-lg border border-black/10 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Lock aria-hidden className="h-5 w-5 text-[#9a5b22]" />
          <h1 className="text-xl font-bold sm:text-2xl">Whop access required</h1>
        </div>
        <p className="text-sm leading-6 text-[#5f5f5f]">
          Open this {label === "admin" ? "dashboard" : "experience"} through Whop or the
          Whop localhost dev proxy. Records are only created after Whop verifies the signed
          iframe user token and confirms access.
        </p>
      </section>
    </main>
  );
}
