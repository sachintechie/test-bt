import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET!);

export const handler = async (event: any) => {
  try {
    const { limit } = event.arguments?.input;
    // Fetch all products from Stripe
    const products = await stripe.products.list({ limit }); // Adjust limit as needed

    // Array to hold structured product data
    const structuredProducts = [];

    for (const product of products.data) {
      // Fetch prices for each product
      const prices = await stripe.prices.list({ product: product.id });

      // Structure product data with prices and metadata
      const productData = {
        id: product.id,
        name: product.name,
        description: product.description,
        active: product.active,
        metadata: product.metadata, // Include product metadata
        prices: prices.data.map(price => ({
          id: price.id,
          unit_amount: price.unit_amount,
          currency: price.currency,
          recurring: price.recurring ? price.recurring.interval : 'one_time',
          metadata: price.metadata, // Include price metadata
        })),
      };

      // Add product data to the array
      structuredProducts.push(productData);
    }

    // Return or print structured product data
    return {
      status: 200,
      data: structuredProducts,
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
