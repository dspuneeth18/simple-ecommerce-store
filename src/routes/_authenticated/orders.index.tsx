import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/orders/")({
  component: OrdersPage,
});

function OrdersPage() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, total_cents, status, created_at, order_items(quantity, product_name, product_image)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="font-serif text-4xl font-semibold">Your orders</h1>

      {isLoading ? (
        <p className="mt-8 text-muted-foreground">Loading…</p>
      ) : !orders || orders.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border bg-surface p-12 text-center">
          <p className="text-muted-foreground">You haven't placed any orders yet.</p>
          <Button asChild className="mt-6 rounded-full"><Link to="/">Start shopping</Link></Button>
        </div>
      ) : (
        <ul className="mt-10 space-y-4">
          {orders.map((o: any) => (
            <li key={o.id}>
              <Link
                to="/orders/$id"
                params={{ id: o.id }}
                className="block rounded-xl border border-border bg-card p-5 transition-colors hover:border-accent"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Order · {new Date(o.created_at).toLocaleDateString()}
                    </p>
                    <p className="mt-1 font-mono text-sm">#{o.id.slice(0, 8)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatPrice(o.total_cents)}</p>
                    <p className="text-xs uppercase tracking-wider text-accent">{o.status}</p>
                  </div>
                </div>
                <div className="mt-4 flex -space-x-2">
                  {o.order_items?.slice(0, 5).map((it: any, i: number) => (
                    <img
                      key={i} src={it.product_image} alt={it.product_name}
                      className="h-10 w-10 rounded-full border-2 border-card object-cover"
                    />
                  ))}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
