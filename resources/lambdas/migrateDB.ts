import { exec } from "child_process";
import {getDatabaseUrl} from "../db/PgClient";

export const handler = async (event: any, context: any): Promise<string> => {
  const {type}=event;
  console.log(`Migration type: ${type}`);
  const databaseUrl = await getDatabaseUrl();
  console.log(`Database URL: ${databaseUrl}`)
  let command = "";
  switch (type) {
    case "push":
      command="npx prisma db push";
      break;
    case "force-push":
      command="npx prisma db push --accept-data-loss";
      break;
    default:
      command=`npx prisma migrate diff --to-schema-datamodel ./prisma/schema.prisma --from-url '${databaseUrl}'`
  }
  return new Promise((resolve, reject) => {
    exec("npx prisma db push", (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing schema push: ${stderr}`);
        reject(`Migration failed: ${stderr}`);
      } else {
        console.log(`Migration successful: ${stdout}`);
        resolve(`Migration successful: ${stdout}`);
      }
    });
  });
};
