'use client';
export default function ModulePlaceholder({ title, features, moduleHint }: {
  title: string; features: string[]; moduleHint?: string;
}) {
  return (
    <div className="space-y-5">
      <div className="card">
        <h2 className="text-lg font-bold mb-1">{title}</h2>
        <p className="text-sm text-slate-500 mb-4">Módulo previsto en esta pantalla del CRM.</p>
        <div className="grid sm:grid-cols-2 gap-2 text-sm">
          {features.map((f) => (
            <div key={f} className="flex items-center gap-2 text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500" /> {f}
            </div>
          ))}
        </div>
        {moduleHint && <p className="text-xs text-slate-400 mt-4">{moduleHint}</p>}
      </div>
    </div>
  );
}
