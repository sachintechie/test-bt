import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET!);

export const handler = async (event: any) => {
  try {
    const {cart,address} = event.arguments?.input;

    // Calculate total amount based on cart
    let totalAmount = 0;

    for (const item of cart) {
      // Fetch price details from Stripe (e.g., unit amount)
      const price = await stripe.prices.retrieve(item.id);
      // @ts-ignore
      totalAmount += price.unit_amount * item.quantity; // Calculate total price
    }

    // Create payment intent with calculated total amount
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'usd',
      metadata: {cart,address},
    });

    return {
      status: 200,
      data: paymentIntent.client_secret,
      error: null
    };
  } catch (error) {
    return {
      status: 500,
      data: null,
      error
    };
  }
};
