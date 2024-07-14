import {execSync} from 'child_process';
import {PrismaClient} from '@prisma/client';
import * as path from "path";

exports.handler = async (event:any) => {
  try {
    // Initialize Prisma client
    const prisma = new PrismaClient();

    // Your migration logic here
    execSync('npx prisma migrate deploy', {
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL,
      },
      stdio: 'inherit',
    });

    console.log('Migrations applied successfully');
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Migrations applied successfully' }),
    };
  } catch (error) {
    console.error('Error applying migrations:', error);
    throw error;
  }
};
