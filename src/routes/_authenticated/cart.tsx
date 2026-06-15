import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { notifyCartChanged } from "@/components/Navbar";

export const Route = createFileRoute("/_authenticated/cart")({
  component: CartPage,
});

type CartRow = {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    image_url: string;
    price_cents: number;
    category: string;
  } | null;
};

function CartPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: items, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cart_items")
        .select("id, quantity, product:products(id, name, image_url, price_cents, category)")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data as unknown as CartRow[]).filter((r) => r.product);
    },
  });

  const updateQty = async (id: string, quantity: number) => {
    if (quantity < 1) return removeItem(id);
    const { error } = await supabase.from("cart_items").update({ quantity }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["cart"] });
    notifyCartChanged();
  };

  const removeItem = async (id: string) => {
    const { error } = await supabase.from("cart_items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["cart"] });
    notifyCartChanged();
    toast.success("Removed from cart");
  };

  const subtotal = items?.reduce((s, i) => s + (i.product?.price_cents ?? 0) * i.quantity, 0) ?? 0;
  const shipping = subtotal >= 7500 || subtotal === 0 ? 0 : 700;
  const total = subtotal + shipping;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="font-serif text-4xl font-semibold">Your cart</h1>

      {isLoading ? (
        <p className="mt-8 text-muted-foreground">Loading…</p>
      ) : !items || items.length === 0 ? (
        <div className="mt-12 rounded-xl border border-dashed border-border bg-surface p-12 text-center">
          <p className="text-muted-foreground">Your cart is empty.</p>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/">Browse the shop</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-3">
          <ul className="lg:col-span-2 divide-y divide-border">
            {items.map((item) => (
              <li key={item.id} className="flex gap-5 py-6">
                <Link
                  to="/product/$id"
                  params={{ id: item.product!.id }}
                  className="block h-28 w-24 shrink-0 overflow-hidden rounded-lg bg-muted"
                >
                  <img src={item.product!.image_url} alt={item.product!.name} className="h-full w-full object-cover" />
                </Link>
                <div className="flex flex-1 flex-col">
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        {item.product!.category}
                      </p>
                      <Link
                        to="/product/$id"
                        params={{ id: item.product!.id }}
                        className="mt-1 block font-serif text-lg hover:text-accent"
                      >
                        {item.product!.name}
                      </Link>
                    </div>
                    <p className="font-medium whitespace-nowrap">
                      {formatPrice(item.product!.price_cents * item.quantity)}
                    </p>
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center rounded-full border border-border">
                      <button onClick={() => updateQty(item.id, item.quantity - 1)} className="p-2"><Minus className="h-3.5 w-3.5" /></button>
                      <span className="w-7 text-center text-sm">{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, item.quantity + 1)} className="p-2"><Plus className="h-3.5 w-3.5" /></button>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside className="h-fit rounded-xl border border-border bg-surface p-6">
            <h2 className="font-serif text-xl font-semibold">Order summary</h2>
            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd>{shipping === 0 ? "Free" : formatPrice(shipping)}</dd>
              </div>
              <div className="border-t border-border pt-3 flex justify-between text-base font-medium">
                <dt>Total</dt><dd>{formatPrice(total)}</dd>
              </div>
            </dl>
            <Button
              size="lg"
              className="mt-6 w-full rounded-full"
              onClick={() => navigate({ to: "/checkout" })}
            >
              Checkout
            </Button>
          </aside>
        </div>
      )}
    </div>
  );
}
