import Stripe from 'stripe';
import {transferERC1155} from "./transferERC1155";
import {transferNFT} from "./transferNFT";
const stripe = new Stripe(process.env.STRIPE_SECRET!);
const STRIPE_PAYMENT_INTENT_WEBHOOK_SECRET = process.env.STRIPE_PAYMENT_INTENT_WEBHOOK_SECRET!;

export const handler = async (event: any) => {
  let stripeEvent;

  try {
    // Verify the Stripe webhook signature
    const signature = event.headers['Stripe-Signature'];
    console.log('Signature:', signature)
    console.log('Raw Body:', event.rawBody)
    console.log('Headers:', event.headers)
    console.log('Stripe Payment Intent Webhook Secret:', STRIPE_PAYMENT_INTENT_WEBHOOK_SECRET)
    stripeEvent = stripe.webhooks.constructEvent(
      event.rawBody,
      signature,
      STRIPE_PAYMENT_INTENT_WEBHOOK_SECRET
    );
    console.log('Stripe Event:', stripeEvent)
  } catch (err) {
    console.error('Webhook signature verification failed.', err);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Invalid signature' }),
    };
  }

  // Handle the event based on its type
  switch (stripeEvent.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('PaymentIntent was successful:', paymentIntent);
      const metadata = paymentIntent.metadata as any;
      console.log(metadata)
      const {address,cart,tenant_id} = metadata;
      for(let i=0;i<cart.length;i++){
        const {id,quantity,product_metadata} = cart[i];
        console.log('cart',cart[i])
        const {id:tokenId,chain,contract,type,metadata}=product_metadata;
        console.log('product_metadata',product_metadata)
        try{
          if(type==='NFT'){
            await transferNFT(address,quantity,chain,contract,tenant_id)
          }else{
            await transferERC1155(address,tokenId,quantity,chain,contract,tenant_id)
          }
        }catch (e) {
          return {
            statusCode: 500,
            body: JSON.stringify(e),
          };
        }
      }
      break;

    case 'payment_intent.payment_failed':
      console.log('PaymentIntent failed:', stripeEvent.data.object);
      break;

    default:
      console.log(`Unhandled event type ${stripeEvent.type}`);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ received: true }),
  };
};
