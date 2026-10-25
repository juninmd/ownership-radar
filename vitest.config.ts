import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    // Os `*.test.js` usam o runner nativo do Node (`node --test`) e nao tem
    // suite do vitest; incluir apenas os .ts evita "No test suite found" sem
    // deixar de rodar os testes nativos no script `test` do package.json.
    include: ['tests/**/*.test.ts'],
  },
});
