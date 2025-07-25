import { config } from 'dotenv';
config();

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, amount } = body;

        if (!name || !email || !amount) {
            return new Response(JSON.stringify({ error: 'Invalid input' }), {
                status: 400,
            });
        }

        const secretKey = process.env.STRIPE_SECRET_KEY;
        console.log('Stripe secret key loaded?', Boolean(secretKey));
        if (!secretKey) {
            throw new Error('Missing STRIPE_SECRET_KEY environment variable');
        }

        // Create or retrieve customer by email:
        // Stripe REST API doesn't support list customers by email with query params directly,
        // so here we try creating a new customer for simplicity.
        // In production, consider storing customer IDs yourself.

        const customerResponse = await fetch('https://api.stripe.com/v1/customers', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${secretKey}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({ name, email }).toString(),
        });

        if (!customerResponse.ok) {
            const err = await customerResponse.json();
            throw new Error(err.error?.message || 'Failed to create customer');
        }
        const customer = await customerResponse.json();

        // Create ephemeral key (with Stripe API version header)
        const ephemeralKeyResponse = await fetch(
            'https://api.stripe.com/v1/ephemeral_keys',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${secretKey}`,
                    'Stripe-Version': '2022-11-15',
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({ customer: customer.id }).toString(),
            }
        );

        if (!ephemeralKeyResponse.ok) {
            const err = await ephemeralKeyResponse.json();
            throw new Error(err.error?.message || 'Failed to create ephemeral key');
        }
        const ephemeralKey = await ephemeralKeyResponse.json();

        // Create payment intent
        const paymentIntentResponse = await fetch(
            'https://api.stripe.com/v1/payment_intents',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${secretKey}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    amount: Math.round(Number(amount) * 100).toString(),
                    currency: 'gbp',
                    customer: customer.id,
                    'automatic_payment_methods[enabled]': 'true',
                }).toString(),
            }
        );

        if (!paymentIntentResponse.ok) {
            const err = await paymentIntentResponse.json();
            throw new Error(err.error?.message || 'Failed to create payment intent');
        }
        const paymentIntent = await paymentIntentResponse.json();

        return new Response(
            JSON.stringify({
                paymentIntent,
                ephemeralKey,
                customer: customer.id,
            }),
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Stripe API error:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Internal Server Error' }),
            { status: 500 }
        );
    }
}
