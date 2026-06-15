import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Maison — Modern essentials for everyday life" },
      { name: "description", content: "A curated catalog of timeless audio, home, and everyday goods." },
    ],
  }),
  component: ShopPage,
});

type Product = {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  image_url: string;
  category: string;
};

function ShopPage() {
  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, description, price_cents, image_url, category")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Product[];
    },
  });

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-border/60 bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <p className="mb-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            New arrivals · Fall 2026
          </p>
          <h1 className="font-serif text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
            Essentials,<br />made to last.
          </h1>
          <p className="mt-6 max-w-xl text-base text-muted-foreground md:text-lg">
            A small collection of considered objects — for the desk, the commute,
            and the quiet moments in between.
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-10 flex items-end justify-between">
          <h2 className="font-serif text-3xl font-semibold">The catalog</h2>
          <p className="text-sm text-muted-foreground">{products?.length ?? 0} products</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/5] w-full rounded-lg bg-muted" />
                <div className="mt-4 h-4 w-2/3 rounded bg-muted" />
                <div className="mt-2 h-3 w-1/3 rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {products?.map((p) => (
              <Link
                key={p.id}
                to="/product/$id"
                params={{ id: p.id }}
                className="group block"
              >
                <div className="aspect-[4/5] w-full overflow-hidden rounded-lg bg-muted">
                  <img
                    src={p.image_url}
                    alt={p.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="mt-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      {p.category}
                    </p>
                    <h3 className="mt-1 font-serif text-lg font-medium">{p.name}</h3>
                  </div>
                  <p className="shrink-0 font-medium">{formatPrice(p.price_cents)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
