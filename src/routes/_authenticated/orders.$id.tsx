import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/orders/$id")({
  component: OrderDetailPage,
});

function OrderDetailPage() {
  const { id } = Route.useParams();

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div className="mx-auto max-w-3xl px-6 py-16 text-muted-foreground">Loading…</div>;
  }
  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-muted-foreground">Order not found.</p>
        <Link to="/orders" className="mt-4 inline-block text-sm underline">Back to orders</Link>
      </div>
    );
  }

  const subtotal = order.order_items.reduce(
    (s: number, i: any) => s + i.price_cents * i.quantity, 0
  );
  const shipping = order.total_cents - subtotal;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center gap-3 text-accent">
        <CheckCircle2 className="h-6 w-6" />
        <span className="text-sm font-medium uppercase tracking-wider">Order confirmed</span>
      </div>
      <h1 className="mt-3 font-serif text-4xl font-semibold">Thank you.</h1>
      <p className="mt-2 text-muted-foreground">
        Order <span className="font-mono">#{order.id.slice(0, 8)}</span> placed on{" "}
        {new Date(order.created_at).toLocaleDateString()}.
      </p>

      <div className="mt-10 rounded-xl border border-border bg-card">
        <ul className="divide-y divide-border">
          {order.order_items.map((it: any) => (
            <li key={it.id} className="flex items-center gap-4 p-5">
              <img src={it.product_image} alt={it.product_name} className="h-16 w-16 rounded-lg object-cover" />
              <div className="flex-1">
                <p className="font-medium">{it.product_name}</p>
                <p className="text-sm text-muted-foreground">Qty {it.quantity}</p>
              </div>
              <p className="font-medium">{formatPrice(it.price_cents * it.quantity)}</p>
            </li>
          ))}
        </ul>
        <dl className="space-y-2 border-t border-border p-5 text-sm">
          <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Shipping</dt>
            <dd>{shipping === 0 ? "Free" : formatPrice(shipping)}</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-medium">
            <dt>Total</dt><dd>{formatPrice(order.total_cents)}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-8 rounded-xl border border-border bg-surface p-5 text-sm">
        <p className="font-medium">Shipping to</p>
        <p className="mt-2 text-muted-foreground">{order.shipping_name}</p>
        <p className="whitespace-pre-line text-muted-foreground">{order.shipping_address}</p>
      </div>

      <Link to="/" className="mt-10 inline-block text-sm underline-offset-4 hover:underline">
        Continue shopping →
      </Link>
    </div>
  );
}
