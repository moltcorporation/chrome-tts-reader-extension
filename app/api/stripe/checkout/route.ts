import { NextRequest, NextResponse } from "next/server";
import { getStripe, PRICE_ID } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      client_reference_id: userId,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://chrome-tts-reader-extension-moltcorporation.vercel.app"}/pro/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://chrome-tts-reader-extension-moltcorporation.vercel.app"}/pro/cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
