import { Stripe } from 'stripe';

console.log('Stripe Secret Key:', process.env.STRIPE_SECRET_KEY);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
    const body = await request.json();
    const { name, email, amount } = body;

    if (!name || !email || !amount) {
        return new Response(
            JSON.stringify({
                error: 'Please enter a valid email address',
                status: 400
            })
        );
    }

    let customer;

    const existingCustomer = await stripe.customers.list({ email });

    if (existingCustomer.data.length > 0) {
        customer = existingCustomer.data[0];
    } else {
        const newCustomer = await stripe.customers.create({
            name,
            email,
        });

        customer = newCustomer;
    }

    const ephemeralKey = await stripe.ephemeralKeys.create(
        {customer: customer.id},
    );
    const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(parseFloat(amount) * 100),
        currency: 'gbp',
        customer: customer.id,
        automatic_payment_methods: {
            enabled: true,
            allow_redirects: 'never',
        },
    });

    return new Response(
        JSON.stringify({
            paymentIntent: paymentIntent,
            ephemeralKey: ephemeralKey,
            customer: customer.id,
        }),
        { status: 200 }
    );
}