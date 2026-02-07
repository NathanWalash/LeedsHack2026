"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui";
import { listStories, type StoryCard } from "@/lib/api";
import { DEBUG_STORIES } from "@/lib/debugStories";
import {
  BarChart3,
  Briefcase,
  Bug,
  CalendarDays,
  CircleDollarSign,
  HeartPulse,
  Search,
  ShoppingCart,
  Tag,
  TrendingUp,
  UserRound,
  Zap,
} from "lucide-react";

const CATEGORY_ICON: Record<string, ComponentType<{ className?: string }>> = {
  business: Briefcase,
  retail: ShoppingCart,
  operations: UserRound,
  demand: TrendingUp,
  finance: CircleDollarSign,
  health: HeartPulse,
  energy: Zap,
  weekly: CalendarDays,
};

function CategoryPill({
  category,
  tone = "default",
}: {
  category: string;
  tone?: "default" | "selected";
}) {
  const Icon = CATEGORY_ICON[category] || Tag;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs ${
        tone === "selected"
          ? "border-teal-500 bg-teal-500/10 text-teal-300"
          : "border-slate-700 bg-slate-800 text-slate-400"
      }`}
    >
      <Icon className="w-3 h-3" />
      {category}
    </span>
  );
}

function includesTerm(story: StoryCard, term: string) {
  if (!term) return true;
  const haystack = `${story.title} ${story.description} ${story.author} ${story.categories.join(" ")}`.toLowerCase();
  return haystack.includes(term);
}

function formatDate(value: string | null) {
  if (!value) return "Draft date";
  const ts = Date.parse(value);
  if (!Number.isFinite(ts)) return value;
  return new Date(ts).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [liveStories, setLiveStories] = useState<StoryCard[]>([]);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const res = await listStories({
          search: query.trim() || undefined,
          category: category === "all" ? undefined : category,
        });
        if (!mounted) return;
        setLiveStories(res.stories || []);
      } catch {
        if (!mounted) return;
        setLoadError("Could not load live stories right now.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [query, category]);

  const debugStories = useMemo(() => {
    const term = query.trim().toLowerCase();
    return DEBUG_STORIES.filter((story) => {
      if (category !== "all" && !story.categories.includes(category)) return false;
      return includesTerm(story, term);
    });
  }, [query, category]);

  const categories = useMemo(() => {
    const bucket = new Set<string>();
    for (const story of liveStories) {
      for (const cat of story.categories) bucket.add(cat);
    }
    for (const story of DEBUG_STORIES) {
      for (const cat of story.categories) bucket.add(cat);
    }
    return ["all", ...Array.from(bucket).sort((a, b) => a.localeCompare(b))];
  }, [liveStories]);

  const allVisibleStories = useMemo(
    () => [...liveStories, ...debugStories],
    [liveStories, debugStories]
  );
  const contributorCount = useMemo(
    () => new Set(allVisibleStories.map((s) => s.author)).size,
    [allVisibleStories]
  );

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <section className="max-w-6xl mx-auto px-6 pt-14 pb-12 space-y-8">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8">
          <div className="flex flex-col gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-900/30 border border-blue-800 rounded-full text-blue-300 text-sm font-medium mb-4">
                <Search className="w-4 h-4" />
                Explore Stories
              </div>
              <h1 className="text-4xl font-bold text-white">Community Feed</h1>
              <p className="mt-3 text-slate-400 max-w-2xl">
                Browse published forecast stories, search by keyword, filter by category, and open full notebook-style posts.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
                <p className="text-xs text-slate-500">Visible stories</p>
                <p className="text-2xl font-bold text-white mt-1">{allVisibleStories.length}</p>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
                <p className="text-xs text-slate-500">Contributors</p>
                <p className="text-2xl font-bold text-white mt-1">{contributorCount}</p>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
                <p className="text-xs text-slate-500">Debug samples</p>
                <p className="text-2xl font-bold text-white mt-1">{debugStories.length}</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 space-y-3">
              <label className="text-xs font-semibold text-slate-300">Search</label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search title, author, description, or category..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/70 pl-9 pr-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className="transition cursor-pointer"
                  >
                    {cat === "all" ? (
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs ${
                          category === cat
                            ? "border-teal-500 bg-teal-500/10 text-teal-300"
                            : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:text-slate-300"
                        }`}
                      >
                        <Tag className="w-3 h-3" />
                        All categories
                      </span>
                    ) : (
                      <CategoryPill category={cat} tone={category === cat ? "selected" : "default"} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white inline-flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal-400" />
              Live Published Stories
            </h2>
            {loading ? <Badge variant="default">Loading...</Badge> : <Badge variant="success">{liveStories.length} live</Badge>}
          </div>

          {loadError && (
            <div className="rounded-xl border border-amber-800 bg-amber-950/20 px-4 py-3 text-sm text-amber-300">
              {loadError}
            </div>
          )}

          {!loading && liveStories.length === 0 && !loadError && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-8 text-sm text-slate-500 text-center">
              No live stories match this filter yet.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {liveStories.map((story) => (
              <Link
                href={`/explore/${story.story_id}`}
                key={story.story_id}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-slate-700 transition-all group"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-white group-hover:text-teal-300 transition">
                    {story.title}
                  </h3>
                  <Badge variant="success">Live</Badge>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  @{story.author} • {formatDate(story.published_at)}
                </p>
                <p className="text-sm text-slate-400 leading-relaxed mb-4">
                  {story.description || "No description provided."}
                </p>
                <div className="flex flex-wrap gap-2">
                  {story.categories.map((tag) => (
                    <CategoryPill key={`${story.story_id}-${tag}`} category={tag} />
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white inline-flex items-center gap-2">
              <Bug className="w-5 h-5 text-amber-400" />
              Debug Samples
            </h2>
            <Badge variant="warning">{debugStories.length} debug</Badge>
          </div>

          {debugStories.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-8 text-sm text-slate-500 text-center">
              No debug samples match this filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {debugStories.map((story) => (
                <Link
                  href={`/explore/${story.story_id}`}
                  key={story.story_id}
                  className="rounded-2xl border border-amber-800/50 bg-amber-950/10 p-5 hover:border-amber-700/70 transition-all group"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white group-hover:text-amber-300 transition">
                      {story.title}
                    </h3>
                    <Badge variant="warning">Debug</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">
                    @{story.author} • Sample content
                  </p>
                  <p className="text-sm text-slate-400 leading-relaxed mb-4">{story.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {story.categories.map((tag) => (
                      <CategoryPill key={`${story.story_id}-${tag}`} category={tag} />
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 text-sm text-slate-400">
          <p className="font-semibold text-slate-200 inline-flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-teal-300" />
            Publishing flow
          </p>
          <p className="mt-2">
            Posts published in Step 5 are tagged as <span className="text-emerald-300">Live</span> and appear in this feed.
            Debug cards are marked with a <span className="text-amber-300">Debug</span> badge so they are clearly distinguishable.
          </p>
        </div>
      </section>
    </div>
  );
}
