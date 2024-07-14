export const handler = async (): Promise<string> => {
  return new Promise((resolve, reject) => {
    console.log(`Migration successful`);
    resolve(`Migration successful`);
  });
};