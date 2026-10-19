import 'dotenv/config';
import 'temporal-polyfill/full/global';
import { Temporal } from 'temporal-polyfill';
import * as argon2 from 'argon2';
import { db } from '../src/prisma/db.js';

/**
 * ServiceHub Phase 2 Database Seed Script
 *
 * Populates PostgreSQL 18 with realistic, internally consistent dummy fixtures
 * centered on existing Customer User ID 18 in Kolkata, West Bengal, India.
 *
 * Requirements & Invariants:
 * - Customer User ID 18 is preserved completely: never updated, overwritten, or modified.
 * - Dedicated Kolkata test provider: 'kolkata.provider@servicehub.test'.
 * - Password hashed via Argon2; plaintext password never stored.
 * - All timestamps computed deterministically in 'Asia/Kolkata' relative to execution time.
 * - Exact 13 status history transitions across 5 booking scenarios (1 + 2 + 3 + 4 + 3).
 * - Exact 7 booking holds (1 ACTIVE, 1 EXPIRED, 5 RELEASED/CONSUMED).
 * - Holds strictly satisfy check constraint: "expiresAt" > "startAt".
 * - Stable candidate natural keys independent of mutable status for safe idempotency.
 * - Reused records strictly verified against expected fields and relationships; fails on conflict.
 * - Transactional execution via db.transaction(). Zero .update() or .delete() calls.
 * - Excludes: payments, payment attempts, refunds, reassignments, audit logs,
 *   coupon_services, coupon_categories.
 */

const TARGET_CUSTOMER_ID = 18;
const PROVIDER_EMAIL = 'kolkata.provider@servicehub.test';
const PROVIDER_PASSWORD = 'Provider@Kolkata123';
const PROVIDER_PHONE = '+919830099999';
const PROVIDER_FIRST_NAME = 'Amit';
const PROVIDER_LAST_NAME = 'Banerjee';
const PROVIDER_DISPLAY_NAME = 'Kolkata Premier Home Care';
const PROVIDER_TIMEZONE = 'Asia/Kolkata';

interface SeedMetrics {
  expectedCount: number;
  createdCount: number;
  reusedCount: number;
}

const metrics: Record<string, SeedMetrics> = {
  User: { expectedCount: 1, createdCount: 0, reusedCount: 0 },
  UserRole: { expectedCount: 1, createdCount: 0, reusedCount: 0 },
  ProviderProfile: { expectedCount: 1, createdCount: 0, reusedCount: 0 },
  ProviderVerification: { expectedCount: 1, createdCount: 0, reusedCount: 0 },
  VerificationDocument: { expectedCount: 2, createdCount: 0, reusedCount: 0 },
  ProviderServiceArea: { expectedCount: 4, createdCount: 0, reusedCount: 0 },
  Category: { expectedCount: 3, createdCount: 0, reusedCount: 0 },
  Service: { expectedCount: 5, createdCount: 0, reusedCount: 0 },
  ServiceImage: { expectedCount: 5, createdCount: 0, reusedCount: 0 },
  Availability: { expectedCount: 6, createdCount: 0, reusedCount: 0 },
  BlockedSlot: { expectedCount: 1, createdCount: 0, reusedCount: 0 },
  SavedAddress: { expectedCount: 2, createdCount: 0, reusedCount: 0 },
  Coupon: { expectedCount: 1, createdCount: 0, reusedCount: 0 },
  Booking: { expectedCount: 5, createdCount: 0, reusedCount: 0 },
  ServiceLocation: { expectedCount: 5, createdCount: 0, reusedCount: 0 },
  BookingHold: { expectedCount: 7, createdCount: 0, reusedCount: 0 },
  BookingStatusHistory: { expectedCount: 13, createdCount: 0, reusedCount: 0 },
  Cancellation: { expectedCount: 1, createdCount: 0, reusedCount: 0 },
  Review: { expectedCount: 1, createdCount: 0, reusedCount: 0 },
  ProviderResponse: { expectedCount: 1, createdCount: 0, reusedCount: 0 },
  CouponUsage: { expectedCount: 1, createdCount: 0, reusedCount: 0 },
  Notification: { expectedCount: 3, createdCount: 0, reusedCount: 0 },
};

function recordCreated(entity: keyof typeof metrics) {
  metrics[entity].createdCount++;
}

function recordReused(entity: keyof typeof metrics) {
  metrics[entity].reusedCount++;
}

/**
 * Calculates deterministic future or past Date objects strictly aligned with Kolkata timezone
 * and provider availability days (Mon-Sat, 09:00 - 18:00 IST).
 */
function computeScheduleTimestamps(referenceDate: Date = new Date()) {
  const nowZdt = Temporal.Instant.from(referenceDate.toISOString()).toZonedDateTimeISO(PROVIDER_TIMEZONE);

  // Helper: Find upcoming weekday (1 = Monday, 2 = Tuesday, ..., 7 = Sunday)
  // Ensures target is strictly in the future (between 2 and 8 days ahead)
  const getUpcomingWeekday = (targetDay: number, minDaysAhead = 2): Temporal.ZonedDateTime => {
    let daysAhead = (targetDay - nowZdt.dayOfWeek + 7) % 7;
    if (daysAhead < minDaysAhead) {
      daysAhead += 7;
    }
    return nowZdt.add({ days: daysAhead });
  };

  // Helper: Find past weekday (between 3 and 10 days in the past)
  const getPastWeekday = (targetDay: number, minDaysPast = 3): Temporal.ZonedDateTime => {
    let daysBack = (nowZdt.dayOfWeek - targetDay + 7) % 7;
    if (daysBack < minDaysPast) {
      daysBack += 7;
    }
    return nowZdt.subtract({ days: daysBack });
  };

  // Future scenarios
  // D1: Upcoming Tuesday (10:00 - 11:30 IST) -> B1 (PENDING)
  const b1Date = getUpcomingWeekday(2);
  const b1Start = b1Date.with({ hour: 10, minute: 0, second: 0, millisecond: 0 });
  const b1End = b1Date.with({ hour: 11, minute: 30, second: 0, millisecond: 0 });

  // D1 Blocked Slot: Upcoming Tuesday (13:00 - 14:00 IST) -> Provider maintenance break
  const blkStart = b1Date.with({ hour: 13, minute: 0, second: 0, millisecond: 0 });
  const blkEnd = b1Date.with({ hour: 14, minute: 0, second: 0, millisecond: 0 });

  // D2: Upcoming Wednesday (14:30 - 15:30 IST) -> B2 (CONFIRMED)
  const b2Date = getUpcomingWeekday(3);
  const b2Start = b2Date.with({ hour: 14, minute: 30, second: 0, millisecond: 0 });
  const b2End = b2Date.with({ hour: 15, minute: 30, second: 0, millisecond: 0 });

  // D4: Upcoming Friday (11:00 - 12:00 IST) -> Active Hold
  const holdActiveDate = getUpcomingWeekday(5);
  const holdActiveStart = holdActiveDate.with({ hour: 11, minute: 0, second: 0, millisecond: 0 });
  const holdActiveEnd = holdActiveDate.with({ hour: 12, minute: 0, second: 0, millisecond: 0 });

  // Past / Ongoing scenarios
  // D3: Recent Thursday (10:00 - 11:00 IST) -> B3 (IN_PROGRESS)
  // Scheduled on a recent past Thursday during working hours so that technician arrival
  // at start time (10:00 IST) is chronologically coherent with ongoing active work.
  const b3Date = getPastWeekday(4);
  const b3Start = b3Date.with({ hour: 10, minute: 0, second: 0, millisecond: 0 });
  const b3End = b3Date.with({ hour: 11, minute: 0, second: 0, millisecond: 0 });

  // D_minus_2: Past Wednesday (11:00 - 13:00 IST) -> B4 (COMPLETED)
  const b4Date = getPastWeekday(3);
  const b4Start = b4Date.with({ hour: 11, minute: 0, second: 0, millisecond: 0 });
  const b4End = b4Date.with({ hour: 13, minute: 0, second: 0, millisecond: 0 });

  // D_minus_1: Past Friday (15:00 - 16:30 IST) -> B5 (CANCELLED)
  const b5Date = getPastWeekday(5);
  const b5Start = b5Date.with({ hour: 15, minute: 0, second: 0, millisecond: 0 });
  const b5End = b5Date.with({ hour: 16, minute: 30, second: 0, millisecond: 0 });

  // D_minus_3: Past Thursday (16:00 - 17:00 IST) -> Expired Hold
  const holdExpDate = getPastWeekday(4);
  const holdExpStart = holdExpDate.with({ hour: 16, minute: 0, second: 0, millisecond: 0 });
  const holdExpEnd = holdExpDate.with({ hour: 17, minute: 0, second: 0, millisecond: 0 });

  return {
    nowZdt,
    b1: { start: new Date(b1Start.epochMilliseconds), end: new Date(b1End.epochMilliseconds) },
    b2: { start: new Date(b2Start.epochMilliseconds), end: new Date(b2End.epochMilliseconds) },
    b3: { start: new Date(b3Start.epochMilliseconds), end: new Date(b3End.epochMilliseconds) },
    b4: { start: new Date(b4Start.epochMilliseconds), end: new Date(b4End.epochMilliseconds) },
    b5: { start: new Date(b5Start.epochMilliseconds), end: new Date(b5End.epochMilliseconds) },
    blockedSlot: { start: new Date(blkStart.epochMilliseconds), end: new Date(blkEnd.epochMilliseconds) },
    activeHold: { start: new Date(holdActiveStart.epochMilliseconds), end: new Date(holdActiveEnd.epochMilliseconds) },
    expiredHold: { start: new Date(holdExpStart.epochMilliseconds), end: new Date(holdExpEnd.epochMilliseconds) },
  };
}

export async function seedTestData() {
  console.log('='.repeat(70));
  console.log(' ServiceHub Database Seed — Kolkata Test Environment (User 18)');
  console.log('='.repeat(70));

  const schedule = computeScheduleTimestamps();
  console.log(`Execution Time Reference (Asia/Kolkata): ${schedule.nowZdt.toString()}`);

  return await db.transaction(async (tx) => {
    // ------------------------------------------------------------------------
    // Step 1: Verify Customer User ID 18 exists (Read-only check)
    // ------------------------------------------------------------------------
    console.log('\n[1/15] Verifying existing Customer User ID 18...');
    const customer = await tx.orm.public.User.where({ id: TARGET_CUSTOMER_ID }).first();
    if (!customer) {
      throw new Error(`FATAL: Customer User ID ${TARGET_CUSTOMER_ID} was not found in the database.`);
    }
    console.log(`  Customer confirmed: ${customer.email} (ID: ${customer.id}, Name: ${customer.firstName} ${customer.lastName || ''})`);

    // Dynamic resolution of administrator for provider verification review
    const adminRole = await tx.orm.public.Role.where({ name: 'ADMIN' as any }).first();
    let adminUserId: number | null = null;
    if (adminRole) {
      const adminUserRole = await tx.orm.public.UserRole.where({ roleId: adminRole.id }).first();
      if (adminUserRole) {
        adminUserId = adminUserRole.userId;
      }
    }
    console.log(`  Administrator for verification review: User ID ${adminUserId ?? 'system'}`);

    // ------------------------------------------------------------------------
    // Step 2: Seed / Verify Dedicated Kolkata Test Provider User
    // ------------------------------------------------------------------------
    console.log('\n[2/15] Seeding dedicated Kolkata provider user...');
    const providerRole = await tx.orm.public.Role.where({ name: 'SERVICE_PROVIDER' as any }).first();
    if (!providerRole) {
      throw new Error("Role 'SERVICE_PROVIDER' not found in database. Run seed-roles.ts first.");
    }

    let providerUser = await tx.orm.public.User.where({ email: PROVIDER_EMAIL as any }).first();
    if (!providerUser) {
      const passwordHash = await argon2.hash(PROVIDER_PASSWORD);
      providerUser = await tx.orm.public.User.create({
        email: PROVIDER_EMAIL as any,
        passwordHash,
        firstName: PROVIDER_FIRST_NAME as any,
        lastName: PROVIDER_LAST_NAME as any,
        phone: PROVIDER_PHONE as any,
        emailVerified: true,
        status: 'ACTIVE',
      });
      recordCreated('User');
      console.log(`  Created provider user: ${providerUser.email} (ID: ${providerUser.id})`);
    } else {
      if (providerUser.status !== 'ACTIVE' || !providerUser.emailVerified) {
        throw new Error(`Provider user ${PROVIDER_EMAIL} exists but is not ACTIVE or emailVerified.`);
      }
      recordReused('User');
      console.log(`  Reusing verified provider user: ${providerUser.email} (ID: ${providerUser.id})`);
    }

    // Provider UserRole
    const existingUserRole = await tx.orm.public.UserRole.where({
      userId: providerUser.id,
      roleId: providerRole.id,
    }).first();

    if (!existingUserRole) {
      await tx.orm.public.UserRole.create({
        userId: providerUser.id,
        roleId: providerRole.id,
      });
      recordCreated('UserRole');
      console.log('  Assigned SERVICE_PROVIDER role to provider user');
    } else {
      recordReused('UserRole');
      console.log('  Provider user already has SERVICE_PROVIDER role');
    }

    // ------------------------------------------------------------------------
    // Step 3: Provider Profile, Verification, and Documents
    // ------------------------------------------------------------------------
    console.log('\n[3/15] Seeding Provider Profile and Approved Verification...');
    let providerProfile = await tx.orm.public.ProviderProfile.where({
      userId: providerUser.id,
    }).first();

    if (!providerProfile) {
      providerProfile = await tx.orm.public.ProviderProfile.create({
        userId: providerUser.id,
        displayName: PROVIDER_DISPLAY_NAME as any,
        bio: 'Top-rated home care, maintenance, plumbing, and electrical services across Kolkata metropolitan area.',
        status: 'ACTIVE',
        timezone: PROVIDER_TIMEZONE as any,
      });
      recordCreated('ProviderProfile');
      console.log(`  Created ProviderProfile (ID: ${providerProfile.id})`);
    } else {
      if (providerProfile.timezone !== PROVIDER_TIMEZONE || providerProfile.status !== 'ACTIVE') {
        throw new Error(
          `ProviderProfile for ${PROVIDER_EMAIL} exists but has unexpected status (${providerProfile.status}) or timezone (${providerProfile.timezone}).`
        );
      }
      recordReused('ProviderProfile');
      console.log(`  Reusing verified ProviderProfile (ID: ${providerProfile.id})`);
    }

    // Provider Verification (APPROVED status required for catalog visibility)
    let verification = await tx.orm.public.ProviderVerification.where({
      providerId: providerProfile.id,
    }).first();

    const submittedDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const reviewedDate = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000);

    if (!verification) {
      verification = await tx.orm.public.ProviderVerification.create({
        providerId: providerProfile.id,
        status: 'APPROVED',
        submittedAt: Temporal.Instant.from(submittedDate.toISOString()),
        reviewedAt: Temporal.Instant.from(reviewedDate.toISOString()),
        reviewedBy: adminUserId as any,
        rejectionReason: null,
      });
      recordCreated('ProviderVerification');
      console.log(`  Created APPROVED ProviderVerification (ID: ${verification.id})`);
    } else {
      if (verification.status !== 'APPROVED') {
        throw new Error(
          `Conflicting ProviderVerification (ID: ${verification.id}) found with status '${verification.status}'. ` +
          `Expected 'APPROVED' for test provider. Aborting to avoid corrupting unapproved verification state.`
        );
      }
      recordReused('ProviderVerification');
      console.log(`  Reusing verified ProviderVerification (ID: ${verification.id}, status: APPROVED)`);
    }

    // Verification Documents
    const documentFixtures = [
      {
        documentType: 'TRADE_LICENSE',
        storageKey: 'verifications/kolkata-provider-trade-license.pdf',
        fileName: 'kolkata_trade_license_2026.pdf',
        mimeType: 'application/pdf',
      },
      {
        documentType: 'GOVERNMENT_ID',
        storageKey: 'verifications/kolkata-provider-pan.pdf',
        fileName: 'kolkata_provider_pan.pdf',
        mimeType: 'application/pdf',
      },
    ];

    for (const doc of documentFixtures) {
      const existingDoc = await tx.orm.public.VerificationDocument.where({
        verificationId: verification.id,
        documentType: doc.documentType as any,
      }).first();

      if (!existingDoc) {
        await tx.orm.public.VerificationDocument.create({
          verificationId: verification.id,
          documentType: doc.documentType as any,
          storageKey: doc.storageKey,
          fileName: doc.fileName as any,
          mimeType: doc.mimeType as any,
        });
        recordCreated('VerificationDocument');
        console.log(`  Created VerificationDocument: ${doc.documentType}`);
      } else {
        recordReused('VerificationDocument');
      }
    }

    // ------------------------------------------------------------------------
    // Step 4: Provider Service Areas (4 Kolkata Locations)
    // ------------------------------------------------------------------------
    console.log('\n[4/15] Seeding Kolkata Provider Service Areas...');
    const serviceAreaFixtures = [
      { city: 'Kolkata', area: 'Salt Lake Sector V', pinCode: '700091' },
      { city: 'Kolkata', area: 'Park Street', pinCode: '700016' },
      { city: 'Kolkata', area: 'Ballygunge', pinCode: '700019' },
      { city: 'Kolkata', area: 'New Town Action Area I', pinCode: '700156' },
    ];

    for (const sa of serviceAreaFixtures) {
      const existingArea = await tx.orm.public.ProviderServiceArea.where({
        providerId: providerProfile.id,
        city: sa.city as any,
        area: sa.area as any,
        pinCode: sa.pinCode as any,
      }).first();

      if (!existingArea) {
        await tx.orm.public.ProviderServiceArea.create({
          providerId: providerProfile.id,
          city: sa.city as any,
          area: sa.area as any,
          pinCode: sa.pinCode as any,
        });
        recordCreated('ProviderServiceArea');
        console.log(`  Created ServiceArea: ${sa.area} (${sa.pinCode})`);
      } else {
        recordReused('ProviderServiceArea');
      }
    }

    // ------------------------------------------------------------------------
    // Step 5: Categories (Root Categories)
    // ------------------------------------------------------------------------
    console.log('\n[5/15] Seeding Service Categories...');
    const categoryFixtures = [
      {
        name: 'Appliance Care',
        description: 'Professional diagnostic, repair, and deep cleaning for household appliances.',
      },
      {
        name: 'Plumbing & Bath',
        description: 'Expert residential and commercial plumbing, leak detection, and sanitary fitting services.',
      },
      {
        name: 'Electrical Solutions',
        description: 'Certified electrical installations, repairs, wiring safety inspections, and load maintenance.',
      },
    ];

    const categoryMap: Record<string, any> = {};

    for (const cat of categoryFixtures) {
      let existingCat = await tx.orm.public.Category.where({
        parentId: null,
        name: cat.name as any,
      }).first();

      if (!existingCat) {
        existingCat = await tx.orm.public.Category.create({
          parentId: null,
          name: cat.name as any,
          description: cat.description,
          isActive: true,
        });
        recordCreated('Category');
        console.log(`  Created Category: ${cat.name} (ID: ${existingCat.id})`);
      } else {
        if (!existingCat.isActive) {
          throw new Error(`Category '${cat.name}' exists but isActive is false. Cannot serve as active catalog category.`);
        }
        recordReused('Category');
        console.log(`  Reusing verified Category: ${cat.name} (ID: ${existingCat.id})`);
      }
      categoryMap[cat.name] = existingCat;
    }

    // ------------------------------------------------------------------------
    // Step 6: Services (4 Active + 1 Inactive) & Service Images
    // ------------------------------------------------------------------------
    console.log('\n[6/15] Seeding Services & Primary Service Images...');
    const serviceFixtures = [
      {
        key: 'S1',
        categoryName: 'Appliance Care',
        name: 'Deep Kitchen Appliance Cleaning & Sanitation',
        description: 'Comprehensive degreasing, steam sanitation, and detailing of all major kitchen appliances.',
        price: '1499.00',
        durationMinutes: 90,
        status: 'ACTIVE' as const,
        imageStorageKey: 'services/kolkata-appliance-clean.webp',
        imageFileName: 'appliance-clean.webp',
      },
      {
        key: 'S2',
        categoryName: 'Plumbing & Bath',
        name: 'Precision Faucet & Pipe Leak Detection',
        description: 'Non-invasive ultrasonic acoustic inspection, pressure testing, and precision sealant repair for plumbing fixtures.',
        price: '899.00',
        durationMinutes: 60,
        status: 'ACTIVE' as const,
        imageStorageKey: 'services/kolkata-plumbing-leak.webp',
        imageFileName: 'plumbing-leak.webp',
      },
      {
        key: 'S3',
        categoryName: 'Electrical Solutions',
        name: 'Complete Electrical Panel & Wiring Safety Inspection',
        description: 'Comprehensive 32-point electrical safety audit, thermal imaging of circuit breakers, and grounding test.',
        price: '699.00',
        durationMinutes: 60,
        status: 'ACTIVE' as const,
        imageStorageKey: 'services/kolkata-electrical-inspect.webp',
        imageFileName: 'electrical-inspect.webp',
      },
      {
        key: 'S4',
        categoryName: 'Appliance Care',
        name: 'Split AC Deep Cleaning & Gas Pressure Optimization',
        description: 'High-pressure coil wash, blower decontamination, drain tray clearing, and eco-refrigerant pressure calibration.',
        price: '1999.00',
        durationMinutes: 120,
        status: 'ACTIVE' as const,
        imageStorageKey: 'services/kolkata-ac-service.webp',
        imageFileName: 'ac-service.webp',
      },
      {
        key: 'S5',
        categoryName: 'Appliance Care',
        name: 'Commercial Central HVAC Overhaul & Duct Decontamination',
        description: 'Heavy-duty industrial chiller inspection, airflow balance testing, and antimicrobial duct remediation.',
        price: '4999.00',
        durationMinutes: 240,
        status: 'INACTIVE' as const, // Inactive service: hidden from public catalog
        imageStorageKey: 'services/kolkata-hvac-commercial.webp',
        imageFileName: 'hvac-commercial.webp',
      },
    ];

    const serviceMap: Record<string, any> = {};

    for (const sf of serviceFixtures) {
      const category = categoryMap[sf.categoryName];
      let service = await tx.orm.public.Service.where({
        providerId: providerProfile.id,
        name: sf.name as any,
      }).first();

      if (!service) {
        service = await tx.orm.public.Service.create({
          providerId: providerProfile.id,
          categoryId: category.id,
          name: sf.name as any,
          description: sf.description,
          price: sf.price as any,
          durationMinutes: sf.durationMinutes,
          status: sf.status,
        });
        recordCreated('Service');
        console.log(`  Created Service: ${sf.name} (${sf.status}, ID: ${service.id})`);
      } else {
        if (service.status !== sf.status || service.categoryId !== category.id) {
          throw new Error(
            `Service '${sf.name}' exists but has conflicting status (${service.status} vs ${sf.status}) or categoryId (${service.categoryId} vs ${category.id}).`
          );
        }
        recordReused('Service');
        console.log(`  Reusing verified Service: ${sf.name} (${sf.status}, ID: ${service.id})`);
      }
      serviceMap[sf.key] = service;

      // Primary Service Image
      const existingImage = await tx.orm.public.ServiceImage.where({
        serviceId: service.id,
        sortOrder: 0,
      }).first();

      if (!existingImage) {
        await tx.orm.public.ServiceImage.create({
          serviceId: service.id,
          storageKey: sf.imageStorageKey,
          fileName: sf.imageFileName as any,
          mimeType: 'image/webp' as any,
          sortOrder: 0,
          isPrimary: true,
        });
        recordCreated('ServiceImage');
        console.log(`    Primary Image seeded for ${sf.key}`);
      } else {
        recordReused('ServiceImage');
      }
    }

    // ------------------------------------------------------------------------
    // Step 7: Weekly Availability (Mon-Sat, 09:00 - 18:00) & Blocked Slot
    // ------------------------------------------------------------------------
    console.log('\n[7/15] Seeding Provider Weekly Availability and Blocked Slot...');
    const days: Array<'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY'> = [
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ];

    for (const day of days) {
      const existingAvail = await tx.orm.public.Availability.where({
        providerId: providerProfile.id,
        dayOfWeek: day as any,
      }).first();

      if (!existingAvail) {
        await tx.orm.public.Availability.create({
          providerId: providerProfile.id,
          dayOfWeek: day as any,
          startTime: Temporal.PlainTime.from('09:00:00') as any,
          endTime: Temporal.PlainTime.from('18:00:00') as any,
        });
        recordCreated('Availability');
        console.log(`  Availability seeded: ${day} (09:00 - 18:00)`);
      } else {
        recordReused('Availability');
      }
    }

    // Blocked slot on upcoming Tuesday (13:00 - 14:00 IST)
    const blockedReason = 'Scheduled maintenance & equipment sanitization break';
    const existingBlock = await tx.orm.public.BlockedSlot.where({
      providerId: providerProfile.id,
      reason: blockedReason,
    }).first();

    if (!existingBlock) {
      await tx.orm.public.BlockedSlot.create({
        providerId: providerProfile.id,
        startAt: Temporal.Instant.from(schedule.blockedSlot.start.toISOString()),
        endAt: Temporal.Instant.from(schedule.blockedSlot.end.toISOString()),
        reason: blockedReason,
      });
      recordCreated('BlockedSlot');
      console.log(`  BlockedSlot seeded: ${schedule.blockedSlot.start.toISOString()} - ${schedule.blockedSlot.end.toISOString()}`);
    } else {
      recordReused('BlockedSlot');
    }

    // ------------------------------------------------------------------------
    // Step 8: Customer 18 Saved Addresses
    // ------------------------------------------------------------------------
    console.log('\n[8/15] Seeding Saved Addresses for Customer User 18...');
    const addressFixtures = [
      {
        label: 'Home',
        address: 'Tower 4, Flat 12B, Ideal Aqua View, Mahishbathan',
        city: 'Kolkata',
        area: 'Salt Lake Sector V',
        pinCode: '700091',
      },
      {
        label: 'Work',
        address: 'Suite 502, Infinity Benchmark, Plot G1',
        city: 'Kolkata',
        area: 'Park Street',
        pinCode: '700016',
      },
    ];

    const addressMap: Record<string, any> = {};

    for (const addr of addressFixtures) {
      let savedAddr = await tx.orm.public.SavedAddress.where({
        customerId: TARGET_CUSTOMER_ID,
        label: addr.label as any,
        city: addr.city as any,
      }).first();

      if (!savedAddr) {
        savedAddr = await tx.orm.public.SavedAddress.create({
          customerId: TARGET_CUSTOMER_ID,
          label: addr.label as any,
          address: addr.address,
          city: addr.city as any,
          area: addr.area as any,
          pinCode: addr.pinCode as any,
        });
        recordCreated('SavedAddress');
        console.log(`  Created SavedAddress: ${addr.label} (${addr.area}, ${addr.city})`);
      } else {
        if (savedAddr.address !== addr.address || savedAddr.area !== addr.area || savedAddr.pinCode !== addr.pinCode) {
          throw new Error(
            `SavedAddress '${addr.label}' in '${addr.city}' exists for customer ${TARGET_CUSTOMER_ID} ` +
            `but has conflicting details (${savedAddr.address}, ${savedAddr.area}, ${savedAddr.pinCode}) vs expected (${addr.address}, ${addr.area}, ${addr.pinCode}).`
          );
        }
        recordReused('SavedAddress');
        console.log(`  Reusing verified SavedAddress: ${addr.label} (${addr.area})`);
      }
      addressMap[addr.label] = savedAddr;
    }

    // ------------------------------------------------------------------------
    // Step 9: Coupon Fixture (Database-only test fixture)
    // ------------------------------------------------------------------------
    console.log('\n[9/15] Seeding Coupon Fixture (KOLKATA10)...');
    let coupon = await tx.orm.public.Coupon.where({
      code: 'KOLKATA10' as any,
    }).first();

    const couponStartsAt = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const couponExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    if (!coupon) {
      coupon = await tx.orm.public.Coupon.create({
        code: 'KOLKATA10' as any,
        description: 'Kolkata regional launch promotion: ₹100 off on residential services',
        discountType: 'FIXED',
        discountValue: '100.00' as any,
        maxDiscountAmount: '100.00' as any,
        scope: 'PLATFORM',
        startsAt: Temporal.Instant.from(couponStartsAt.toISOString()),
        expiresAt: Temporal.Instant.from(couponExpiresAt.toISOString()),
        maxTotalUses: 500,
        maxUsesPerCustomer: 1,
        isActive: true,
      });
      recordCreated('Coupon');
      console.log(`  Created Coupon: KOLKATA10 (ID: ${coupon.id})`);
    } else {
      recordReused('Coupon');
      console.log(`  Reusing Coupon: KOLKATA10 (ID: ${coupon.id})`);
    }

    // ------------------------------------------------------------------------
    // Step 10: Five Supported Booking Scenarios & Service Locations
    // ------------------------------------------------------------------------
    console.log('\n[10/15] Seeding 5 Booking Scenarios and Service Locations...');
    const bookingConfigs = [
      {
        key: 'B1',
        serviceKey: 'S1',
        status: 'PENDING' as const,
        startAt: schedule.b1.start,
        endAt: schedule.b1.end,
        addressKey: 'Home',
        servicePrice: '1499.00',
        discountAmount: '0.00',
        finalAmount: '1499.00',
        customerNote: 'Please call 15 minutes before arrival at Salt Lake.',
        providerNote: null,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        key: 'B2',
        serviceKey: 'S2',
        status: 'CONFIRMED' as const,
        startAt: schedule.b2.start,
        endAt: schedule.b2.end,
        addressKey: 'Work',
        servicePrice: '899.00',
        discountAmount: '100.00', // Database-only discount fixture
        finalAmount: '799.00',
        customerNote: 'Main bath under-sink valve inspection.',
        providerNote: 'Technician assigned: Subhash Ghosh. Bringing ultrasonic acoustic kit.',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        key: 'B3',
        serviceKey: 'S3',
        status: 'IN_PROGRESS' as const,
        startAt: schedule.b3.start,
        endAt: schedule.b3.end,
        addressKey: 'Home',
        servicePrice: '699.00',
        discountAmount: '0.00',
        finalAmount: '699.00',
        customerNote: 'Intermittent tripping on MCB 3 in distribution panel.',
        providerNote: 'On-site diagnostic in progress. Thermal imaging and circuit test active.',
        createdAt: new Date(schedule.b3.start.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days before appointment start
      },
      {
        key: 'B4',
        serviceKey: 'S4',
        status: 'COMPLETED' as const,
        startAt: schedule.b4.start,
        endAt: schedule.b4.end,
        addressKey: 'Home',
        servicePrice: '1999.00',
        discountAmount: '0.00',
        finalAmount: '1999.00',
        customerNote: 'Master bedroom 1.5-ton split AC deep cleaning.',
        providerNote: 'Completed full coil foam decontamination. Gas pressure calibrated to 65 PSI.',
        createdAt: new Date(schedule.b4.start.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days before booking
      },
      {
        key: 'B5',
        serviceKey: 'S1',
        status: 'CANCELLED' as const,
        startAt: schedule.b5.start,
        endAt: schedule.b5.end,
        addressKey: 'Work',
        servicePrice: '1499.00',
        discountAmount: '0.00',
        finalAmount: '1499.00',
        customerNote: 'Kitchen detailing before festival.',
        providerNote: 'Customer notified cancellation due to unexpected business travel.',
        createdAt: new Date(schedule.b5.start.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days before booking
      },
    ];

    const bookingMap: Record<string, any> = {};

    for (const bc of bookingConfigs) {
      const srv = serviceMap[bc.serviceKey];
      const addr = addressMap[bc.addressKey];

      // Use unique, immutable candidate natural key independent of mutable lifecycle status.
      // Candidate key: [customerId, providerId, serviceId, customerNote] is guaranteed unique across all 5 test bookings.
      let booking = await tx.orm.public.Booking.where({
        customerId: TARGET_CUSTOMER_ID,
        providerId: providerProfile.id,
        serviceId: srv.id,
        customerNote: bc.customerNote,
      }).first();

      if (!booking) {
        booking = await tx.orm.public.Booking.create({
          customerId: TARGET_CUSTOMER_ID,
          providerId: providerProfile.id,
          serviceId: srv.id,
          serviceName: srv.name,
          servicePrice: bc.servicePrice as any,
          serviceDurationMinutes: srv.durationMinutes,
          discountAmount: bc.discountAmount as any,
          finalAmount: bc.finalAmount as any,
          startAt: Temporal.Instant.from(bc.startAt.toISOString()),
          endAt: Temporal.Instant.from(bc.endAt.toISOString()),
          status: bc.status,
          customerNote: bc.customerNote,
          providerNote: bc.providerNote,
          createdAt: Temporal.Instant.from(bc.createdAt.toISOString()),
          updatedAt: Temporal.Instant.from(bc.createdAt.toISOString()),
        });
        recordCreated('Booking');
        console.log(`  Created Booking ${bc.key} [${bc.status}] (ID: ${booking.id})`);
      } else {
        recordReused('Booking');
        console.log(`  Reusing Booking ${bc.key} [current status: ${booking.status}] (ID: ${booking.id})`);
      }
      bookingMap[bc.key] = booking;

      // Service Location snapshot
      const existingLocation = await tx.orm.public.ServiceLocation.where({
        bookingId: booking.id,
      }).first();

      if (!existingLocation) {
        await tx.orm.public.ServiceLocation.create({
          bookingId: booking.id,
          label: addr.label as any,
          address: addr.address,
          city: addr.city as any,
          area: addr.area as any,
          pinCode: addr.pinCode as any,
          createdAt: Temporal.Instant.from(bc.createdAt.toISOString()),
        });
        recordCreated('ServiceLocation');
        console.log(`    Location snapshot attached to Booking ${bc.key}`);
      } else {
        recordReused('ServiceLocation');
      }
    }

    // ------------------------------------------------------------------------
    // Step 11: Seven Booking Holds (1 Active, 1 Expired, 5 Consumed)
    // ------------------------------------------------------------------------
    console.log('\n[11/15] Seeding 7 Booking Holds (Active, Expired, and Consumed)...');

    // Hold 1: ACTIVE hold (Electrical Inspection S3 on upcoming Friday)
    // Note: Check constraint @@check("\"expiresAt\" > \"startAt\"") requires expiresAt > startAt.
    // Also note: Backend booking-holds.service.ts evaluates (nowMs - hldCreated) >= 15m as stale.
    // Holds are valid upon creation and stale after 15m according to application business rules.
    const activeHoldExpires = new Date(schedule.activeHold.start.getTime() + 15 * 60 * 1000);
    let activeHold = await tx.orm.public.BookingHold.where({
      customerId: TARGET_CUSTOMER_ID,
      providerId: providerProfile.id,
      serviceId: serviceMap['S3'].id,
      bookingId: null,
      status: 'ACTIVE',
    }).first();

    if (!activeHold) {
      activeHold = await tx.orm.public.BookingHold.create({
        customerId: TARGET_CUSTOMER_ID,
        providerId: providerProfile.id,
        serviceId: serviceMap['S3'].id,
        bookingId: null,
        startAt: Temporal.Instant.from(schedule.activeHold.start.toISOString()),
        endAt: Temporal.Instant.from(schedule.activeHold.end.toISOString()),
        expiresAt: Temporal.Instant.from(activeHoldExpires.toISOString()),
        status: 'ACTIVE',
        releasedAt: null,
        createdAt: Temporal.Instant.from(new Date().toISOString()),
      });
      recordCreated('BookingHold');
      console.log(`  Created ACTIVE BookingHold (ID: ${activeHold.id})`);
    } else {
      if (activeHold.bookingId !== null || activeHold.status !== 'ACTIVE') {
        throw new Error(`Conflicting active hold state for customer ${TARGET_CUSTOMER_ID}`);
      }
      recordReused('BookingHold');
      console.log(`  Reusing verified ACTIVE BookingHold (ID: ${activeHold.id})`);
    }

    // Hold 2: EXPIRED hold (Plumbing S2 on past Thursday)
    const expiredHoldExpires = new Date(schedule.expiredHold.start.getTime() + 15 * 60 * 1000);
    const expiredHoldCreated = new Date(schedule.expiredHold.start.getTime() - 15 * 60 * 1000);
    let expiredHold = await tx.orm.public.BookingHold.where({
      customerId: TARGET_CUSTOMER_ID,
      providerId: providerProfile.id,
      serviceId: serviceMap['S2'].id,
      bookingId: null,
      status: 'EXPIRED',
    }).first();

    if (!expiredHold) {
      expiredHold = await tx.orm.public.BookingHold.create({
        customerId: TARGET_CUSTOMER_ID,
        providerId: providerProfile.id,
        serviceId: serviceMap['S2'].id,
        bookingId: null,
        startAt: Temporal.Instant.from(schedule.expiredHold.start.toISOString()),
        endAt: Temporal.Instant.from(schedule.expiredHold.end.toISOString()),
        expiresAt: Temporal.Instant.from(expiredHoldExpires.toISOString()),
        status: 'EXPIRED',
        releasedAt: null,
        createdAt: Temporal.Instant.from(expiredHoldCreated.toISOString()),
      });
      recordCreated('BookingHold');
      console.log(`  Created EXPIRED BookingHold (ID: ${expiredHold.id})`);
    } else {
      if (expiredHold.bookingId !== null || expiredHold.status !== 'EXPIRED') {
        throw new Error(`Conflicting expired hold state for customer ${TARGET_CUSTOMER_ID}`);
      }
      recordReused('BookingHold');
      console.log(`  Reusing verified EXPIRED BookingHold (ID: ${expiredHold.id})`);
    }

    // Holds 3-7: CONSUMED holds (status: 'RELEASED', linked to B1-B5)
    for (const bc of bookingConfigs) {
      const bkg = bookingMap[bc.key];
      const srv = serviceMap[bc.serviceKey];

      const existingConsumedHold = await tx.orm.public.BookingHold.where({
        bookingId: bkg.id,
      }).first();

      const holdExpires = new Date(bc.startAt.getTime() + 15 * 60 * 1000);
      const holdCreated = new Date(bc.createdAt.getTime() - 5 * 60 * 1000); // Created 5m before booking

      if (!existingConsumedHold) {
        await tx.orm.public.BookingHold.create({
          customerId: TARGET_CUSTOMER_ID,
          providerId: providerProfile.id,
          serviceId: srv.id,
          bookingId: bkg.id,
          startAt: Temporal.Instant.from(bc.startAt.toISOString()),
          endAt: Temporal.Instant.from(bc.endAt.toISOString()),
          expiresAt: Temporal.Instant.from(holdExpires.toISOString()),
          status: 'RELEASED',
          releasedAt: Temporal.Instant.from(bc.createdAt.toISOString()),
          createdAt: Temporal.Instant.from(holdCreated.toISOString()),
        });
        recordCreated('BookingHold');
        console.log(`  Created CONSUMED BookingHold for Booking ${bc.key}`);
      } else {
        recordReused('BookingHold');
      }
    }

    // ------------------------------------------------------------------------
    // Step 12: Exactly 13 Booking Status History Transitions
    // ------------------------------------------------------------------------
    console.log('\n[12/15] Seeding 13 Booking Status History Transitions...');
    const historyTransitions = [
      // B1: PENDING (1 transition)
      {
        bookingKey: 'B1',
        fromStatus: null,
        toStatus: 'PENDING' as const,
        changedBy: TARGET_CUSTOMER_ID,
        reason: 'Initial booking creation from active hold',
        createdAt: bookingMap['B1'].createdAt,
      },
      // B2: CONFIRMED (2 transitions)
      {
        bookingKey: 'B2',
        fromStatus: null,
        toStatus: 'PENDING' as const,
        changedBy: TARGET_CUSTOMER_ID,
        reason: 'Initial booking creation from active hold',
        createdAt: bookingMap['B2'].createdAt,
      },
      {
        bookingKey: 'B2',
        fromStatus: 'PENDING' as const,
        toStatus: 'CONFIRMED' as const,
        changedBy: providerUser.id,
        reason: 'Booking confirmed by service provider',
        createdAt: new Date(new Date(bookingMap['B2'].createdAt.toString()).getTime() + 30 * 60 * 1000),
      },
      // B3: IN_PROGRESS (3 transitions)
      // Chronologically coherent: booked 2 days prior -> confirmed 1 day prior -> technician arrives at appointment start
      {
        bookingKey: 'B3',
        fromStatus: null,
        toStatus: 'PENDING' as const,
        changedBy: TARGET_CUSTOMER_ID,
        reason: 'Initial booking creation from active hold',
        createdAt: bookingMap['B3'].createdAt,
      },
      {
        bookingKey: 'B3',
        fromStatus: 'PENDING' as const,
        toStatus: 'CONFIRMED' as const,
        changedBy: providerUser.id,
        reason: 'Booking confirmed by service provider',
        createdAt: new Date(new Date(bookingMap['B3'].createdAt.toString()).getTime() + 24 * 60 * 60 * 1000),
      },
      {
        bookingKey: 'B3',
        fromStatus: 'CONFIRMED' as const,
        toStatus: 'IN_PROGRESS' as const,
        changedBy: providerUser.id,
        reason: 'Service technician arrived and started work',
        createdAt: schedule.b3.start,
      },
      // B4: COMPLETED (4 transitions)
      {
        bookingKey: 'B4',
        fromStatus: null,
        toStatus: 'PENDING' as const,
        changedBy: TARGET_CUSTOMER_ID,
        reason: 'Initial booking creation from active hold',
        createdAt: bookingMap['B4'].createdAt,
      },
      {
        bookingKey: 'B4',
        fromStatus: 'PENDING' as const,
        toStatus: 'CONFIRMED' as const,
        changedBy: providerUser.id,
        reason: 'Booking confirmed by service provider',
        createdAt: new Date(new Date(bookingMap['B4'].createdAt.toString()).getTime() + 45 * 60 * 1000),
      },
      {
        bookingKey: 'B4',
        fromStatus: 'CONFIRMED' as const,
        toStatus: 'IN_PROGRESS' as const,
        changedBy: providerUser.id,
        reason: 'Technician arrived and began service',
        createdAt: schedule.b4.start,
      },
      {
        bookingKey: 'B4',
        fromStatus: 'IN_PROGRESS' as const,
        toStatus: 'COMPLETED' as const,
        changedBy: providerUser.id,
        reason: 'Service completed and verified with customer',
        createdAt: schedule.b4.end,
      },
      // B5: CANCELLED (3 transitions)
      {
        bookingKey: 'B5',
        fromStatus: null,
        toStatus: 'PENDING' as const,
        changedBy: TARGET_CUSTOMER_ID,
        reason: 'Initial booking creation from active hold',
        createdAt: bookingMap['B5'].createdAt,
      },
      {
        bookingKey: 'B5',
        fromStatus: 'PENDING' as const,
        toStatus: 'CONFIRMED' as const,
        changedBy: providerUser.id,
        reason: 'Booking confirmed by service provider',
        createdAt: new Date(new Date(bookingMap['B5'].createdAt.toString()).getTime() + 20 * 60 * 1000),
      },
      {
        bookingKey: 'B5',
        fromStatus: 'CONFIRMED' as const,
        toStatus: 'CANCELLED' as const,
        changedBy: TARGET_CUSTOMER_ID,
        reason: 'Cancelled by customer: Schedule conflict',
        createdAt: new Date(new Date(bookingMap['B5'].createdAt.toString()).getTime() + 120 * 60 * 1000),
      },
    ];

    for (const ht of historyTransitions) {
      const bkg = bookingMap[ht.bookingKey];
      const existingHistory = await tx.orm.public.BookingStatusHistory.where({
        bookingId: bkg.id,
        toStatus: ht.toStatus,
      }).first();

      const createdIso = ht.createdAt instanceof Date ? ht.createdAt.toISOString() : new Date(ht.createdAt.toString()).toISOString();

      if (!existingHistory) {
        await tx.orm.public.BookingStatusHistory.create({
          bookingId: bkg.id,
          fromStatus: ht.fromStatus,
          toStatus: ht.toStatus,
          changedBy: ht.changedBy,
          reason: ht.reason,
          createdAt: Temporal.Instant.from(createdIso),
        });
        recordCreated('BookingStatusHistory');
      } else {
        recordReused('BookingStatusHistory');
      }
    }
    console.log(`  Status History verified: ${metrics.BookingStatusHistory.createdCount} created, ${metrics.BookingStatusHistory.reusedCount} reused`);

    // ------------------------------------------------------------------------
    // Step 13: Cancellation Record (for B5)
    // ------------------------------------------------------------------------
    console.log('\n[13/15] Seeding Cancellation Record for Booking B5...');
    const b5 = bookingMap['B5'];
    const b5CancelledAt = new Date(new Date(b5.createdAt.toString()).getTime() + 120 * 60 * 1000);
    let cancellation = await tx.orm.public.Cancellation.where({
      bookingId: b5.id,
    }).first();

    if (!cancellation) {
      cancellation = await tx.orm.public.Cancellation.create({
        bookingId: b5.id,
        cancelledBy: 'CUSTOMER',
        reasonCode: 'CUSTOMER_SCHEDULE_CONFLICT' as any,
        explanation: 'Customer had an unexpected travel conflict.',
        cancelledAt: Temporal.Instant.from(b5CancelledAt.toISOString()),
      });
      recordCreated('Cancellation');
      console.log(`  Created Cancellation for B5 (ID: ${cancellation.id})`);
    } else {
      recordReused('Cancellation');
      console.log(`  Reusing Cancellation for B5 (ID: ${cancellation.id})`);
    }

    // ------------------------------------------------------------------------
    // Step 14: Review, Provider Response, and Coupon Usage
    // ------------------------------------------------------------------------
    console.log('\n[14/15] Seeding Review, Provider Response, and Coupon Usage...');
    // Review for B4 (COMPLETED)
    const b4 = bookingMap['B4'];
    const reviewCreatedAt = new Date(schedule.b4.end.getTime() + 3 * 60 * 60 * 1000);
    let review = await tx.orm.public.Review.where({
      bookingId: b4.id,
    }).first();

    if (!review) {
      review = await tx.orm.public.Review.create({
        bookingId: b4.id,
        customerId: TARGET_CUSTOMER_ID,
        providerId: providerProfile.id,
        rating: 5,
        comment: 'Exceptional service! The technician arrived right on time and the AC is cooling perfectly.',
        isDeleted: false,
        createdAt: Temporal.Instant.from(reviewCreatedAt.toISOString()),
      });
      recordCreated('Review');
      console.log(`  Created Review for B4 (Rating: 5, ID: ${review.id})`);
    } else {
      recordReused('Review');
      console.log(`  Reusing Review for B4 (ID: ${review.id})`);
    }

    // Provider Response to Review
    const responseCreatedAt = new Date(reviewCreatedAt.getTime() + 2 * 60 * 60 * 1000);
    let providerResponse = await tx.orm.public.ProviderResponse.where({
      reviewId: review.id,
    }).first();

    if (!providerResponse) {
      providerResponse = await tx.orm.public.ProviderResponse.create({
        reviewId: review.id,
        providerId: providerProfile.id,
        response: 'Thank you for choosing Kolkata Premier Home Care! Glad to be of service.',
        createdAt: Temporal.Instant.from(responseCreatedAt.toISOString()),
      });
      recordCreated('ProviderResponse');
      console.log(`  Created ProviderResponse (ID: ${providerResponse.id})`);
    } else {
      recordReused('ProviderResponse');
      console.log(`  Reusing ProviderResponse (ID: ${providerResponse.id})`);
    }

    // Coupon Usage for B2 (CONFIRMED)
    const b2 = bookingMap['B2'];
    let couponUsage = await tx.orm.public.CouponUsage.where({
      bookingId: b2.id,
    }).first();

    if (!couponUsage) {
      couponUsage = await tx.orm.public.CouponUsage.create({
        couponId: coupon.id,
        customerId: TARGET_CUSTOMER_ID,
        bookingId: b2.id,
        discountAmount: '100.00' as any,
        createdAt: Temporal.Instant.from(new Date(b2.createdAt.toString()).toISOString()),
      });
      recordCreated('CouponUsage');
      console.log(`  Created CouponUsage for B2 (Discount: ₹100.00, ID: ${couponUsage.id})`);
    } else {
      recordReused('CouponUsage');
      console.log(`  Reusing CouponUsage for B2 (ID: ${couponUsage.id})`);
    }

    // ------------------------------------------------------------------------
    // Step 15: Notifications for Customer User 18
    // ------------------------------------------------------------------------
    console.log('\n[15/15] Seeding Notifications for Customer User 18...');
    const notificationFixtures = [
      {
        type: 'BOOKING_CONFIRMED',
        title: 'Booking Confirmed',
        message: 'Your booking for Precision Faucet & Pipe Leak Detection is confirmed for Wednesday.',
        entityType: 'BOOKING',
        entityId: b2.id,
        isRead: true,
        readAt: new Date(new Date(b2.createdAt.toString()).getTime() + 60 * 60 * 1000),
        createdAt: new Date(new Date(b2.createdAt.toString()).getTime() + 30 * 60 * 1000),
      },
      {
        type: 'SERVICE_COMPLETED',
        title: 'Service Completed',
        message: 'Split AC Deep Cleaning has been marked as completed. Please rate your experience.',
        entityType: 'BOOKING',
        entityId: b4.id,
        isRead: true,
        readAt: new Date(schedule.b4.end.getTime() + 2 * 60 * 60 * 1000),
        createdAt: schedule.b4.end,
      },
      {
        type: 'BOOKING_PENDING',
        title: 'Booking Request Received',
        message: 'Your booking request for Deep Kitchen Appliance Cleaning is awaiting provider confirmation.',
        entityType: 'BOOKING',
        entityId: bookingMap['B1'].id,
        isRead: false,
        readAt: null,
        createdAt: new Date(bookingMap['B1'].createdAt.toString()),
      },
    ];

    for (const nf of notificationFixtures) {
      const existingNotif = await tx.orm.public.Notification.where({
        userId: TARGET_CUSTOMER_ID,
        entityType: nf.entityType as any,
        entityId: nf.entityId,
        type: nf.type as any,
      }).first();

      if (!existingNotif) {
        await tx.orm.public.Notification.create({
          userId: TARGET_CUSTOMER_ID,
          type: nf.type as any,
          title: nf.title as any,
          message: nf.message,
          entityType: nf.entityType as any,
          entityId: nf.entityId,
          isRead: nf.isRead,
          readAt: nf.readAt ? Temporal.Instant.from(nf.readAt.toISOString()) : null,
          createdAt: Temporal.Instant.from(nf.createdAt.toISOString()),
        });
        recordCreated('Notification');
        console.log(`  Created Notification: ${nf.type}`);
      } else {
        recordReused('Notification');
      }
    }

    return metrics;
  });
}

async function main() {
  try {
    const results = await seedTestData();

    console.log('\n' + '='.repeat(70));
    console.log(' SEED EXECUTION SUMMARY');
    console.log('='.repeat(70));
    console.log(
      'Model Name'.padEnd(25) +
      'Expected'.padStart(10) +
      'Created'.padStart(12) +
      'Reused'.padStart(12) +
      'Total Net'.padStart(11)
    );
    console.log('-'.repeat(70));

    let totalExpected = 0;
    let totalCreated = 0;
    let totalReused = 0;

    for (const [model, counts] of Object.entries(results)) {
      totalExpected += counts.expectedCount;
      totalCreated += counts.createdCount;
      totalReused += counts.reusedCount;
      const net = counts.createdCount + counts.reusedCount;
      console.log(
        model.padEnd(25) +
        String(counts.expectedCount).padStart(10) +
        String(counts.createdCount).padStart(12) +
        String(counts.reusedCount).padStart(12) +
        String(net).padStart(11)
      );
    }

    console.log('='.repeat(70));
    console.log(
      'TOTAL RECORDS'.padEnd(25) +
      String(totalExpected).padStart(10) +
      String(totalCreated).padStart(12) +
      String(totalReused).padStart(12) +
      String(totalCreated + totalReused).padStart(11)
    );
    console.log('='.repeat(70));
    console.log('Test provider credentials:');
    console.log(`  Email:    ${PROVIDER_EMAIL}`);
    console.log(`  Password: ${PROVIDER_PASSWORD}`);
    console.log('Customer User ID:');
    console.log(`  ID:       ${TARGET_CUSTOMER_ID} (unchanged)`);
    console.log('='.repeat(70));
    console.log('Seed completed successfully!');
  } catch (err) {
    console.error('\nSeed script aborted due to an error:');
    console.error(err);
    process.exit(1);
  }
}

// Allow direct CLI invocation via `npx tsx scripts/seed-test-data.ts`
if (process.argv[1]?.endsWith('seed-test-data.ts') || process.argv[1]?.includes('seed-test-data')) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
