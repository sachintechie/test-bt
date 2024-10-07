import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET!);

export const handler = async (event: any) => {
    // Destructure input from request body
    const { successLink, failedLink, items, walletAddress } = event.arguments?.input;

    try {
      // Construct line items from the provided JSON of price IDs and quantities
      const lineItems = Object.keys(items).map(priceId => ({
        price: priceId,
        quantity: items[priceId],
      }));

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: successLink, // Use dynamic success URL
        cancel_url: failedLink, // Use dynamic failed URL
        payment_intent_data: {
          metadata: {
            wallet_address: walletAddress, // Store wallet address in metadata
          },
        },
      });

      // Return session URL for the checkout process
      return {
        status: 200,
        url: session.url,
        error: null
      };
    } catch (error) {
      console.log(error);
      return {
        status: 500,
        data: null,
        error
      };
    }
};
