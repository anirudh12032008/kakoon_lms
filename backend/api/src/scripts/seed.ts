/**
 * Idempotent seed script. Upserts the four robot courses.
 * Run with: pnpm --filter api seed   (or: tsx src/scripts/seed.ts)
 */
import { connectDB, disconnectDB } from "../config/db";
import { Course } from "../models/Course";
import { COURSE_SEED } from "../data/courseSeed";
import { logger } from "../utils/logger";

async function run() {
  await connectDB();

  for (const seed of COURSE_SEED) {
    await Course.findOneAndUpdate(
      { slug: seed.slug },
      { $set: seed },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    logger.info(`Seeded course: ${seed.slug}`);
  }

  logger.info(`✅ Seeded ${COURSE_SEED.length} courses`);
  await disconnectDB();
  process.exit(0);
}

run().catch((err) => {
  logger.error("Seed failed", { err: (err as Error).message });
  process.exit(1);
});
