import Stripe from 'stripe';
import { tenant } from "../db/models";
const stripe = new Stripe(process.env.STRIPE_SECRET!);

export const handler = async (event: any) => {
  try {
    const {cart,address} = event.arguments?.input;
    const tenant = event.identity?.resolverContext as tenant;

    // Calculate total amount based on cart
    let totalAmount = 0;


    for(let i=0;i<cart.length;i++){
      // Fetch price details from Stripe (e.g., unit amount)
      const price = await stripe.prices.retrieve(cart[i].id);
      const product = await stripe.products.retrieve(price.product as string)
      // @ts-ignore
      totalAmount += price.unit_amount * cart[i].quantity; // Calculate total price
      cart[i].product_metadata=product.metadata
    }


    // Create payment intent with calculated total amount
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'usd',
      metadata: {cart:JSON.stringify(cart),address,tenant_id:tenant.id},
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
