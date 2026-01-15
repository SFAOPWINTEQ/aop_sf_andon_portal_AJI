import { Prisma } from "@prisma/client";

// Configuration for Timezone (UTC+7)
// Changes "Real UTC" to "Fake UTC" (Wall Clock Time) for DB storage
// And reverses it for reading back to app.

const TIMEZONE_OFFSET_HOURS = 7;
const TIMEZONE_OFFSET_MS = TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000;

/**
 * Recursively shifts all Date objects in the arguments or results
 * @param obj The object (args or result) to traverse
 * @param offsetMs The milliseconds to add (positive) or subtract (negative)
 */
function shiftDates(obj: any, offsetMs: number): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime() + offsetMs);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => shiftDates(item, offsetMs));
  }

  if (typeof obj === "object") {
    // Avoid cyclic references or special objects if necessary, 
    // but for Prisma DTOs simple recursion is usually fine.
    // Optimization: check constructor to be Object or Array
    if (obj.constructor !== Object && obj.constructor !== Array) {
      return obj;
    }

    const newObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = shiftDates(obj[key], offsetMs);
      }
    }
    return newObj;
  }

  return obj;
}

export const timezoneExtension = {
  name: "timezone-middleware",
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }: any) {
        // Force timestamp generation in App instead of DB
        // This ensures our timezone shifting logic always applies to created/updated times

        if (operation === 'create' || operation === 'createMany') {
          const data = args.data;
          if (Array.isArray(data)) {
            data.forEach((item: any) => {
              if (!item.createdAt) item.createdAt = new Date();
              if (!item.updatedAt) item.updatedAt = new Date();
            });
          } else if (data) {
            if (!data.createdAt) data.createdAt = new Date();
            if (!data.updatedAt) data.updatedAt = new Date();
          }
        }

        if (operation === 'update' || operation === 'updateMany' || operation === 'upsert') {
          // For upsert, we need to handle create and update sections
          if (operation === 'upsert') {
            if (args.create && !args.create.createdAt) args.create.createdAt = new Date();
            if (args.create && !args.create.updatedAt) args.create.updatedAt = new Date();
            if (args.update && !args.update.updatedAt) args.update.updatedAt = new Date();
          } else {
            const data = args.data;
            if (data && !data.updatedAt) data.updatedAt = new Date();
          }
        }

        // 1. Shift Dates in ARGS (Write / Where) -> Add Offset (Make it look like Wall Clock)
        // e.g. App has 11:00 UTC (18:00 Local). We want DB to store 18:00.
        // We shift 11:00 UTC -> 18:00 UTC. Prisma stores "18:00". Perfect.
        const shiftedArgs = shiftDates(args, TIMEZONE_OFFSET_MS);

        // 2. Execute Query
        const result = await query(shiftedArgs);

        // 3. Shift Dates in RESULT (Read) -> Subtract Offset (Restore to Real UTC)
        // e.g. DB returns "18:00". Prisma sees 18:00 UTC.
        // We shift 18:00 UTC -> 11:00 UTC.
        // App sees 11:00 UTC. Browser converts 11:00 UTC -> 18:00 Local. Perfect.
        return shiftDates(result, -TIMEZONE_OFFSET_MS);
      },
    },
  },
};
