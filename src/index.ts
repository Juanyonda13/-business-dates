import { buildServer } from './infrastructure/http/server.js';

const PORT: number = Number(process.env.PORT ?? 3000);
const HOST: string = '0.0.0.0';

async function main(): Promise<void> {
  const app = await buildServer();
  await app.listen({ port: PORT, host: HOST });
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://${HOST}:${PORT}`);
}

void main();


