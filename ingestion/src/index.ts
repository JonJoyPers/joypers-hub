import 'dotenv/config';
import { createDb } from './db';
import { ingestLocations } from './resources/locations';
import { ingestEmployees } from './resources/employees';
import { ingestShifts } from './resources/shifts';
import { ingestTimesheets } from './resources/timesheets';
import { ingestLeave } from './resources/leave';

const RESOURCES = ['locations', 'employees', 'shifts', 'timesheets', 'leave'] as const;
type Resource = (typeof RESOURCES)[number];

function parseArgs() {
  const args = process.argv.slice(2);
  let mode: 'full' | 'incremental' | 'single' = 'full';
  let since: string | undefined;
  let resource: Resource | undefined;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--full':
        mode = 'full';
        break;
      case '--since':
        mode = 'incremental';
        since = args[++i];
        break;
      case '--resource':
        mode = 'single';
        resource = args[++i] as Resource;
        if (!RESOURCES.includes(resource)) {
          console.error(`Unknown resource: ${resource}. Valid: ${RESOURCES.join(', ')}`);
          process.exit(1);
        }
        break;
      case '--help':
        console.log(`
Deputy → Supabase Data Ingestion

Usage:
  npx tsx ingestion/src/index.ts --full              # Full import of all resources
  npx tsx ingestion/src/index.ts --since 2024-01-01  # Incremental (modified after date)
  npx tsx ingestion/src/index.ts --resource employees # Single resource only
        `);
        process.exit(0);
    }
  }

  return { mode, since, resource };
}

const runners: Record<Resource, (db: any, since?: string) => Promise<void>> = {
  locations: ingestLocations,
  employees: ingestEmployees,
  shifts: ingestShifts,
  timesheets: ingestTimesheets,
  leave: ingestLeave,
};

async function main() {
  const { mode, since, resource } = parseArgs();
  const db = createDb();

  console.log(`\nDeputy Ingestion — mode: ${mode}${since ? ` (since ${since})` : ''}${resource ? ` (${resource} only)` : ''}\n`);

  try {
    if (resource) {
      await runners[resource](db, since);
    } else {
      // Run in dependency order: locations → employees → shifts/timesheets/leave
      for (const res of RESOURCES) {
        try {
          await runners[res](db, since);
        } catch (err) {
          console.error(`\nError ingesting ${res}:`, err);
        }
      }
    }

    console.log('\nIngestion complete.');
  } catch (err) {
    console.error('\nIngestion failed:', err);
    process.exit(1);
  } finally {
    await db.close();
  }
}

main();
