// src/config/bootstrap-migrate.ts
// Ejecuta las migraciones (transaccionales) contra la BD usando el DataSource
// de la aplicación compilado en dist. Pensado para el arranque Docker.
import 'dotenv/config';
import { AppDataSource } from './data-source';

async function main() {
  const ds = await AppDataSource.initialize();
  // Muestra migraciones pendientes
  const pending = ds.migrations
    .filter((m) => m)
    .filter((m) => {
      // Filtro "ya no aplica" lo resuelve typeORM por su propia tabla; aquí
      // se delega al ejecutor interno para evitar duplicados.
      return m;
    });
  process.stdout.write(`Migraciones pendientes en proyecto: ${pending.length}\n`);
  await ds.runMigrations();
  // eslint-disable-next-line no-console
  process.stdout.write('Migraciones aplicadas correctamente.\n');
  await ds.destroy();
}

main().catch((err) => {
  process.stderr.write('Error ejecutando migraciones:\n' + String(err) + '\n');
  process.exit(1);
});
