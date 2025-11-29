import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const query = async (text: string, params?: any[]) => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
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

export async function initialDB() {
  try {
    await query(
      `create table if not exists chat_session (
        id uuid primary key,
        seq_id integer not null,
        title varchar(255) not null,
        created_at timestamp default current_timestamp,
        updated_at timestamp default current_timestamp
      )`
    );

    await query(
      `create table if not exists chat_message (
        id integer,
        session_id uuid references chat_session(id) on delete cascade,
        role varchar(50) not null,
        content text not null,
        file_count integer default 0,
        accumulated_token_usage integer default 0,
        primary key (session_id, id)
      )
      `
    );
  } catch (error) {
    console.error("DB initialized failed!:", error);
    throw error;
  }
}

export default pool;
