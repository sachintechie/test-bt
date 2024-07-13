import { execSync } from 'child_process';

export const handler = async () => {
  try {
    execSync(`DATABASE_URL="${process.env.DATABASE_URL}" npx prisma migrate deploy`, {
      stdio: 'inherit',
    });

    console.log('Migrations applied successfully');
  } catch (error) {
    console.error('Error applying migrations:', error);
    throw error;
  }
};
