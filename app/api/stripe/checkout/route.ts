import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "TTS Reader Pro",
              description:
                "Reading queue, word highlight sync, auto-skip nav, save position, reading stats",
            },
            unit_amount: 200,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
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
