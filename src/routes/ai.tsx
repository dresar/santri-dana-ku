import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import {
  useGeminiKeys,
  useAddGeminiKey,
  useDeleteGeminiKey,
  useToggleGeminiKey,
  useAIChat,
  useAnalyzeAjuan,
  type GeminiKey,
} from "@/lib/queries";
import { useAuth } from "@/lib/auth-context";
import { Bot, Key, Plus, Trash2, Power, Send, Loader2, RefreshCw, Cpu, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/ai")({
  head: () => ({ meta: [{ title: "AI Assistant — E-Budgeting Pesantren" }] }),
  component: AIPage,
});

type ChatMessage = { role: "user" | "model"; content: string };

function AIPage() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const [tab, setTab] = useState<"chat" | "keys">(isAdmin ? "chat" : "chat");

  return (
    <>
      <PageHeader
        title="AI Assistant"
        description="Asisten AI untuk analisis ajuan dan manajemen API Key Gemini"
      />
      <div className="mb-4 flex items-center gap-1 rounded-xl border border-border bg-card p-1 shadow-soft">
        <button
          onClick={() => setTab("chat")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${tab === "chat" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
        >
          <MessageSquare className="h-4 w-4" /> Chat AI
        </button>
        {isAdmin && (
          <button
            onClick={() => setTab("keys")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${tab === "keys" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
          >
            <Key className="h-4 w-4" /> Manajemen API Key
          </button>
        )}
      </div>

      {tab === "chat" ? <ChatPanel /> : <KeyPanel />}
    </>
  );
}

function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "model", content: "Assalamu'alaikum! Saya asisten AI SantriDanaKu. Saya siap membantu Anda menganalisis ajuan anggaran, menjawab pertanyaan tentang keuangan pesantren, atau membuat rangkuman dokumen. Apa yang bisa saya bantu?" },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const chat = useAIChat();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const msg = input.trim();
    if (!msg || chat.isPending) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: msg }]);

    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.content }],
    }));

    try {
      const res = await chat.mutateAsync({ message: msg, history });
      const reply = (res as any)?.reply ?? String(res);
      setMessages(prev => [...prev, { role: "model", content: reply }]);
    } catch (err: any) {
      toast.error("AI tidak tersedia", { description: err.message });
      setMessages(prev => [...prev, { role: "model", content: "Maaf, terjadi kesalahan. Silakan coba lagi." }]);
    }
  };

  return (
    <div className="flex h-[calc(100vh-280px)] min-h-[400px] flex-col rounded-2xl border border-border bg-card shadow-soft">
      <div className="flex items-center gap-3 border-b border-border px-5 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold">SantriDanaKu AI</p>
          <p className="text-xs text-muted-foreground">Gemini 2.5 Flash · Auto Key Rotation</p>
        </div>
        <span className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Online
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 p-5">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${m.role === "model" ? "bg-primary text-primary-foreground" : "bg-secondary border border-border"}`}>
              {m.role === "model" ? <Bot className="h-4 w-4" /> : "U"}
            </div>
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${m.role === "model" ? "rounded-tl-sm bg-secondary" : "rounded-tr-sm bg-primary text-primary-foreground"}`}>
              {m.content}
            </div>
          </div>
        ))}
        {chat.isPending && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-secondary px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Sedang menyusun jawaban...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border p-4">
        <div className="flex gap-3">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Ketik pesan... (Enter untuk kirim)"
            className="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-ring"
          />
          <button
            onClick={send}
            disabled={!input.trim() || chat.isPending}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft transition-all hover:bg-primary/90 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">Tekan Enter untuk mengirim · Shift+Enter untuk baris baru</p>
      </div>
    </div>
  );
}

function KeyPanel() {
  const { data, isLoading } = useGeminiKeys();
  const keys: GeminiKey[] = Array.isArray(data?.keys) ? data!.keys : [];
  const summary = data?.summary;
  const addKey = useAddGeminiKey();
  const deleteKey = useDeleteGeminiKey();
  const toggleKey = useToggleGeminiKey();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ alias: "", key_value: "", daily_limit: 1500 });

  const handleAdd = async () => {
    if (!form.alias || !form.key_value) return;
    try {
      await addKey.mutateAsync(form);
      toast.success("API Key berhasil ditambahkan");
      setForm({ alias: "", key_value: "", daily_limit: 1500 });
      setShowForm(false);
    } catch (err: any) {
      toast.error("Gagal", { description: err.message });
    }
  };

  const handleDelete = async (id: string, alias: string) => {
    if (!confirm(`Hapus key "${alias}"?`)) return;
    try {
      await deleteKey.mutateAsync(id);
      toast.success("Key berhasil dihapus");
    } catch (err: any) {
      toast.error("Gagal", { description: err.message });
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const res = await toggleKey.mutateAsync(id) as any;
      toast.success(`Key di-${res?.status === "active" ? "aktifkan" : "nonaktifkan"}`);
    } catch (err: any) {
      toast.error("Gagal", { description: err.message });
    }
  };

  const statusColor: Record<string, string> = {
    active: "text-emerald-600 bg-emerald-500/10",
    exhausted: "text-amber-600 bg-amber-500/10",
    disabled: "text-slate-500 bg-slate-500/10",
    error: "text-rose-600 bg-rose-500/10",
  };

  return (
    <div className="space-y-4">
      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total Key", value: summary.total, color: "text-indigo-600" },
            { label: "Aktif", value: summary.active, color: "text-emerald-600" },
            { label: "Exhausted", value: summary.exhausted, color: "text-amber-600" },
            { label: "Sisa Kuota Hari Ini", value: summary.remaining_quota_today?.toLocaleString("id-ID"), color: "text-blue-600" },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{s.label}</p>
              <p className={`mt-1 text-2xl font-black ${s.color}`}>{s.value ?? 0}</p>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card shadow-soft">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Daftar API Key</h3>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold">{keys.length}</span>
          </div>
          <button
            onClick={() => setShowForm(v => !v)}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Tambah Key
          </button>
        </div>

        {showForm && (
          <div className="border-b border-border bg-secondary/30 p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                value={form.alias}
                onChange={e => setForm(p => ({ ...p, alias: e.target.value }))}
                placeholder="Nama / Alias key"
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring"
              />
              <input
                value={form.key_value}
                onChange={e => setForm(p => ({ ...p, key_value: e.target.value }))}
                placeholder="AIza... (Gemini API Key)"
                type="password"
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring"
              />
              <input
                value={form.daily_limit}
                onChange={e => setForm(p => ({ ...p, daily_limit: Number(e.target.value) }))}
                placeholder="Limit harian (default 1500)"
                type="number"
                min={1}
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring"
              />
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleAdd}
                disabled={addKey.isPending}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {addKey.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Simpan Key
              </button>
              <button onClick={() => setShowForm(false)} className="h-9 rounded-lg border border-border px-4 text-sm font-semibold hover:bg-secondary">
                Batal
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="py-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /></div>
        ) : keys.length === 0 ? (
          <div className="py-12 text-center">
            <Key className="mx-auto h-10 w-10 text-muted-foreground/30" />
            <p className="mt-3 text-sm text-muted-foreground">Belum ada API Key. Tambahkan key Gemini untuk mengaktifkan fitur AI.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Alias</th>
                  <th className="px-4 py-3 font-semibold">Preview</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Hari Ini</th>
                  <th className="px-4 py-3 font-semibold">Total Calls</th>
                  <th className="px-4 py-3 font-semibold">Error</th>
                  <th className="px-4 py-3 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {keys.map(k => (
                  <tr key={k.id} className="border-b border-border last:border-0 hover:bg-secondary/40">
                    <td className="px-4 py-3 font-semibold">{k.alias}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{k.key_preview}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusColor[k.status] ?? ""}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${k.status === "active" ? "bg-emerald-500" : "bg-current"}`} />
                        {k.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-secondary">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (k.usage_today / k.daily_limit) * 100)}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{k.usage_today}/{k.daily_limit}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{Number(k.total_calls).toLocaleString("id-ID")}</td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{k.error_count}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggle(k.id)}
                          title={k.status === "disabled" ? "Aktifkan" : "Nonaktifkan"}
                          className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${k.status === "disabled" ? "border-emerald-300 text-emerald-600 hover:bg-emerald-50" : "border-amber-300 text-amber-600 hover:bg-amber-50"}`}
                        >
                          <Power className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(k.id, k.alias)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 text-rose-500 transition-colors hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
        <strong>🔑 Smart Rotation Engine:</strong> Sistem otomatis memilih key dengan penggunaan paling sedikit (<em>least-used-first</em>). Jika key kena error 429/403, otomatis beralih ke key berikutnya. Kuota direset setiap tengah malam WIB via Cron Job.
      </div>
    </div>
  );
}
