import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/lib/format";
import { placeOrder } from "@/lib/shop.functions";
import { notifyCartChanged } from "@/components/Navbar";

export const Route = createFileRoute("/_authenticated/checkout")({
  component: CheckoutPage,
});

function CheckoutPage() {
  const navigate = useNavigate();
  const placeOrderFn = useServerFn(placeOrder);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: items } = useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cart_items")
        .select("id, quantity, product:products(id, name, price_cents, image_url)");
      if (error) throw error;
      return (data as any[]).filter((r) => r.product);
    },
  });

  const subtotal = items?.reduce((s, i: any) => s + i.product.price_cents * i.quantity, 0) ?? 0;
  const shipping = subtotal >= 7500 || subtotal === 0 ? 0 : 700;
  const total = subtotal + shipping;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!items || items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    setBusy(true);
    try {
      const result = await placeOrderFn({
        data: { shipping_name: name, shipping_address: address },
      });
      notifyCartChanged();
      toast.success("Order placed!");
      navigate({ to: "/orders/$id", params: { id: result.orderId } });
    } catch (e: any) {
      toast.error(e.message ?? "Order failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="font-serif text-4xl font-semibold">Checkout</h1>

      <form onSubmit={submit} className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <div>
            <h2 className="font-serif text-xl font-semibold">Shipping details</h2>
            <p className="mt-1 text-sm text-muted-foreground">Where should we send your order?</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Shipping address</Label>
            <Textarea
              id="address" required rows={4}
              placeholder="Street, City, State, ZIP, Country"
              value={address} onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div className="rounded-lg border border-dashed border-border bg-surface p-4 text-sm text-muted-foreground">
            Payment is mocked for this demo — your order will be placed immediately on submit.
          </div>
        </div>

        <aside className="h-fit rounded-xl border border-border bg-surface p-6 lg:col-span-2">
          <h2 className="font-serif text-xl font-semibold">Your order</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {items?.map((i: any) => (
              <li key={i.id} className="flex justify-between gap-3">
                <span className="truncate">{i.product.name} × {i.quantity}</span>
                <span>{formatPrice(i.product.price_cents * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd>{shipping === 0 ? "Free" : formatPrice(shipping)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-medium">
              <dt>Total</dt><dd>{formatPrice(total)}</dd>
            </div>
          </dl>
          <Button type="submit" size="lg" disabled={busy} className="mt-6 w-full rounded-full">
            {busy ? "Placing order…" : "Place order"}
          </Button>
          <Link to="/cart" className="mt-3 block text-center text-xs text-muted-foreground hover:text-foreground">
            ← Back to cart
          </Link>
        </aside>
      </form>
    </div>
  );
}
