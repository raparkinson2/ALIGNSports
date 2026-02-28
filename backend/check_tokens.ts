import { db } from './src/db';

const tokens = await db.token.findMany({ take: 20 });
console.log(JSON.stringify(tokens, null, 2));
console.log(`\nTotal count: ${tokens.length}`);
await db.$disconnect();
