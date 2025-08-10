import React, { useState } from "react";
import axios from "axios";
import clsx from "clsx";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
});

const allowed = /^[A-Za-z0-9]{0,6}$/;

function ShortCard({ shortUrl, originalUrl, code, visits }) {
  const [copied, setCopied] = useState(false);
  const devRedirect = `${import.meta.env.VITE_API_BASE}/${code}`;
  const canonical = `${(
    import.meta.env.VITE_FRONT_BASE || window.location.origin
  ).replace(/\/$/, "")}/${code}`;

  const copy = async (text) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="mt-8 rounded-2xl bg-white/70 backdrop-blur shadow-glass p-6 border border-white">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-slate-500">Short URL</div>
          <div className="flex items-center gap-2">
            <a
              href={devRedirect}
              target="_blank"
              rel="noreferrer"
              className="text-brand-600 hover:underline"
            >
              {canonical}
            </a>
            <button
              onClick={() => copy(canonical)}
              className={clsx(
                "px-3 py-1.5 rounded-md text-sm border transition",
                copied
                  ? "bg-emerald-500 text-white border-emerald-500"
                  : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
              )}
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
        <div className="text-sm text-slate-500">Original</div>
        <div className="text-slate-800 break-all">{originalUrl}</div>
        <div className="text-sm text-slate-500">Visits</div>
        <div className="text-slate-800">{visits}</div>
      </div>
    </div>
  );
}

export default function App() {
  const [url, setUrl] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!url) {
      setError("Please enter a URL to shorten.");
      return;
    }
    if (customCode && !allowed.test(customCode)) {
      setError("Custom code must be up to 6 characters: A-Z, a-z, 0-9.");
      return;
    }

    setLoading(true);
    try {
      const payload = { original_url: url };
      if (customCode) payload.short_code = customCode;
      const { data } = await api.post("/api/links", payload);
      setResult({
        code: data.short_code,
        shortUrl: data.short_url,
        originalUrl: data.original_url,
        visits: data.visits_count ?? 0,
      });
      setUrl("");
      setCustomCode("");
    } catch (err) {
      if (err.response?.status === 409) {
        setError(err.response.data?.message || "Short code already exists.");
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative isolate overflow-hidden px-6 py-16 sm:py-24 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-50 to-white" />
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900">
              URL shortener
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              Create sleek short links like{" "}
              <span className="font-mono bg-white/60 px-1 rounded">
                https://website.com/abc123
              </span>{" "}
              and track visits.
            </p>
          </div>

          {/* Card */}
          <div className="mt-10 rounded-3xl bg-white/80 backdrop-blur shadow-glass ring-1 ring-white/60 p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Destination URL
                </label>
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  type="url"
                  placeholder="https://example.com/your-page"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none focus:ring-4 focus:ring-brand-200 focus:border-brand-400"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-700">
                    Custom short code (optional)
                  </label>
                  <span className="text-xs text-slate-500">
                    A-Z, a-z, 0-9, up to 6
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="text-slate-600 bg-slate-50 border border-slate-200 px-3 py-3 rounded-xl font-mono">
                    {import.meta.env.VITE_API_BASE}
                  </div>
                  <input
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value)}
                    type="text"
                    placeholder="e.g. my123"
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none focus:ring-4 focus:ring-brand-200 focus:border-brand-400 font-mono"
                    maxLength={6}
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 text-rose-700 px-3 py-2">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={clsx(
                  "w-full rounded-xl bg-brand-600 text-zinc py-3 font-medium shadow hover:bg-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-300 transition",
                  loading && "opacity-60 cursor-not-allowed"
                )}
              >
                {loading ? "Shortening..." : "Shorten URL"}
              </button>
            </form>

            {result && (
              <ShortCard
                shortUrl={result.shortUrl}
                originalUrl={result.originalUrl}
                code={result.code}
                visits={result.visits}
              />
            )}
          </div>

          {/* Footer */}
          <div className="mt-10 text-center text-sm text-slate-500">
            Built with React, Vite, Tailwind & Laravel
          </div>
        </div>
      </div>
    </div>
  );
}
