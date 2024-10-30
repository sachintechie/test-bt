import Stripe from 'stripe';
import {getPrismaClient} from "../db/dbFunctions";
const stripe = new Stripe(process.env.STRIPE_SECRET!);

export const handler = async (event: any) => {
  const toAddress=event.arguments?.input?.toAddress
  const result=[]
  try {
    const prisma = await getPrismaClient();
    const paymentTransactions=await prisma.paymenttransaction.findMany({
      where:{
        toaddress:toAddress
      }
    })
    for(const paymentTransaction of paymentTransactions){
      let transaction={...paymentTransaction} as any
      const {txhash,provider,providerid}=paymentTransaction
      const contractTransaction=await prisma.contracttransaction.findFirst({
        where:{
          txhash:txhash
        }
      });
      transaction={...transaction,...contractTransaction}
      if(provider==='stripe'){
        const paymentIntent = await stripe.paymentIntents.retrieve(providerid);
        const metadata = paymentIntent.metadata as any;
        console.log(metadata)
        let {address,cart,tenant_id} = metadata;
        cart=JSON.parse(cart)
        const products=[]
        for(let i=0;i<cart.length;i++) {
          const {id, quantity, product_metadata} = cart[i];
          console.log('cart', cart[i])
          const {id: tokenId, chain, contract, type, metadata, tenant_id} = product_metadata;
          console.log('product_metadata', product_metadata)
          // from product id to the product details
          const product = await stripe.products.retrieve(id);
          products.push({product,quantity,tokenId,chain,contract,type,metadata,tenantId:tenant_id})
        }
        transaction={...transaction,products}
      }
      result.push(transaction)
    }
    return {
      status: 200,
      data: result,
      error: null
    };
  } catch (err) {
    console.error('error.', err);
    return {
      status: 500,
      data: null,
      error: err
    };
  }
};
