import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const placeOrderSchema = z.object({
  shipping_name: z.string().min(1).max(120),
  shipping_address: z.string().min(1).max(500),
});

export const placeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => placeOrderSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Load cart with product details
    const { data: cart, error: cartErr } = await supabase
      .from("cart_items")
      .select("quantity, product:products(id, name, image_url, price_cents)")
      .eq("user_id", userId);

    if (cartErr) throw new Error(cartErr.message);
    if (!cart || cart.length === 0) throw new Error("Your cart is empty.");

    const items = cart
      .map((c: any) => ({ ...c, product: c.product }))
      .filter((c: any) => c.product);

    const total = items.reduce(
      (sum: number, i: any) => sum + i.product.price_cents * i.quantity,
      0,
    );

    // Insert order
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        total_cents: total,
        status: "paid",
        shipping_name: data.shipping_name,
        shipping_address: data.shipping_address,
      })
      .select("id")
      .single();

    if (orderErr || !order) throw new Error(orderErr?.message ?? "Order failed");

    // Insert order items
    const rows = items.map((i: any) => ({
      order_id: order.id,
      product_id: i.product.id,
      product_name: i.product.name,
      product_image: i.product.image_url,
      price_cents: i.product.price_cents,
      quantity: i.quantity,
    }));

    const { error: itemsErr } = await supabase.from("order_items").insert(rows);
    if (itemsErr) {
      // Best-effort rollback
      await supabase.from("orders").delete().eq("id", order.id);
      throw new Error(itemsErr.message);
    }

    // Clear cart
    await supabase.from("cart_items").delete().eq("user_id", userId);

    return { orderId: order.id, total };
  });
