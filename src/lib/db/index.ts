import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const query = async (text: string) => {
  const client = await pool.connect();
  try {
    const result = await client.query(text);
    console.log("query result:", result);
    return result;
  } finally {
    client.release();
  }
};

export const getClient = async () => {
  const client = await pool.connect();
  return client;
};
