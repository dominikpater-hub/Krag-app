import { buildApp } from './app.ts';
import { makePool } from './db.ts';

const pool = makePool();
const app = buildApp(pool);
const port = Number(process.env.PORT ?? 8080);
const host = process.env.HOST ?? '0.0.0.0';

app.listen({ port, host })
  .then((addr) => console.log(`krag-server słucha na ${addr}`))
  .catch((err) => { console.error(err); process.exit(1); });
