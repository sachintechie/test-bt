import { exec } from 'child_process';

export const handler = async (): Promise<string> => {
  return new Promise((resolve, reject) => {
    exec('ls -laR', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing migration: ${stderr}`);
        reject(`Migration failed: ${stderr}`);
      } else {
        console.log(`Migration successful: ${stdout}`);
        resolve(`Migration successful: ${stdout}`);
      }
    });
  });
};