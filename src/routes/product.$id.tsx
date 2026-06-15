import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Minus, Plus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { notifyCartChanged } from "@/components/Navbar";

export const Route = createFileRoute("/product/$id")({
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const addToCart = async () => {
    setAdding(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        navigate({ to: "/auth", search: { redirect: `/product/${id}` } });
        return;
      }

      // Upsert: add to existing quantity if already in cart
      const { data: existing } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("user_id", userData.user.id)
        .eq("product_id", id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: existing.quantity + qty })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("cart_items")
          .insert({ user_id: userData.user.id, product_id: id, quantity: qty });
        if (error) throw error;
      }

      notifyCartChanged();
      toast.success(`Added ${qty} × ${product?.name} to cart`);
    } catch (e: any) {
      toast.error(e.message ?? "Couldn't add to cart");
    } finally {
      setAdding(false);
    }
  };

  if (isLoading) {
    return <div className="mx-auto max-w-6xl px-6 py-16 text-muted-foreground">Loading…</div>;
  }
  if (error || !product) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-muted-foreground">Product not found.</p>
        <Link to="/" className="mt-4 inline-block text-sm underline">Back to shop</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        <div className="aspect-[4/5] overflow-hidden rounded-xl bg-muted">
          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
        </div>

        <div className="lg:pt-8">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{product.category}</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold md:text-5xl">{product.name}</h1>
          <p className="mt-4 text-2xl">{formatPrice(product.price_cents)}</p>

          <p className="mt-8 leading-relaxed text-muted-foreground">{product.description}</p>

          <div className="mt-10 flex items-center gap-4">
            <div className="flex items-center rounded-full border border-border">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="p-3 hover:text-accent"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center text-sm font-medium">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="p-3 hover:text-accent"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <Button
              size="lg"
              onClick={addToCart}
              disabled={adding}
              className="flex-1 rounded-full"
            >
              {adding ? "Adding…" : "Add to cart"}
            </Button>
          </div>

          <div className="mt-10 space-y-2 border-t border-border pt-6 text-sm text-muted-foreground">
            <p>Free shipping on orders over $75.</p>
            <p>30-day returns. Lifetime craft guarantee.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
