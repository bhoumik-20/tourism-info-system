console.error('Automatic database setup is disabled. All DDL must be executed manually. Use npm run check:schema for SELECT-only verification.');
process.exitCode = 1;
