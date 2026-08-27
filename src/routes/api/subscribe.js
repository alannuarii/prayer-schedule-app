import { Client } from "pg";

export async function POST({ request }) {
  try {
    const { subscription, cityId } = await request.json();

    if (!subscription || !subscription.endpoint || !cityId) {
      return new Response(JSON.stringify({ error: "Invalid subscription data or missing cityId" }), { status: 400 });
    }

    const client = new Client({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    await client.connect();

    const query = `
      INSERT INTO subscriptions (endpoint, p256dh, auth, city_id)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (endpoint) 
      DO UPDATE SET city_id = EXCLUDED.city_id, p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth
    `;

    const values = [
      subscription.endpoint,
      subscription.keys.p256dh,
      subscription.keys.auth,
      cityId
    ];

    await client.query(query, values);
    await client.end();

    return new Response(JSON.stringify({ success: true }), { status: 201 });
  } catch (error) {
    console.error("Subscription error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
}
