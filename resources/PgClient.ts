import { Client } from "pg";

const dbConfig = {
    host: process.env["DB_HOST"]!,
    user: process.env["DB_USER"]!,
    password: process.env["DB_PASSWORD"]!,
    database: process.env["DB_DATABASE"]!,
    port: parseInt(process.env["DB_PORT"]!)
};

export async function executeQuery(query: string) {
    
    const client = new Client(dbConfig);

    try {
        await client.connect();
        const result = await client.query(query);
        return result;
    } catch (e) {
        throw e;
    } finally {
        await client.end();
    }
}
