/**
 * Database seed: realistic Nepal bus routes, buses, drivers and schedules.
 *
 * Run with:  npm run seed
 *
 * Safe to re-run: drivers/routes are upserted, and buses+schedules are only
 * created when none exist yet (so it won't create duplicates).
 */
import { PrismaClient, BusTypes, BusClassTypes } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

// Build a seat map: { "1": "S1", "2": "S2", ... } as the app expects.
function makeSeats(count: number): Record<string, string> {
  const seats: Record<string, string> = {};
  for (let i = 1; i <= count; i++) seats[String(i)] = `S${i}`;
  return seats;
}

// A departure datetime for "tomorrow" at a given hour (local-ish).
function departureAt(hour: number, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

const DRIVERS = [
  { firstName: 'Ramesh', lastName: 'Shrestha', email: 'ramesh.driver@busgo.test', phoneNumber: '9800000001' },
  { firstName: 'Sita', lastName: 'Gurung', email: 'sita.driver@busgo.test', phoneNumber: '9800000002' },
  { firstName: 'Bikash', lastName: 'Tamang', email: 'bikash.driver@busgo.test', phoneNumber: '9800000003' },
  { firstName: 'Anita', lastName: 'Magar', email: 'anita.driver@busgo.test', phoneNumber: '9800000004' },
  { firstName: 'Dipak', lastName: 'Thapa', email: 'dipak.driver@busgo.test', phoneNumber: '9800000005' },
];

const ROUTES = [
  { origin: 'Kathmandu', destination: 'Pokhara', distanceInKm: 200, estimatedTimeInMin: 420 },
  { origin: 'Kathmandu', destination: 'Chitwan', distanceInKm: 150, estimatedTimeInMin: 300 },
  { origin: 'Kathmandu', destination: 'Butwal', distanceInKm: 260, estimatedTimeInMin: 540 },
  { origin: 'Kathmandu', destination: 'Biratnagar', distanceInKm: 400, estimatedTimeInMin: 600 },
  { origin: 'Pokhara', destination: 'Chitwan', distanceInKm: 110, estimatedTimeInMin: 240 },
  { origin: 'Kathmandu', destination: 'Janakpur', distanceInKm: 225, estimatedTimeInMin: 480 },
];

const BUS_PICTURE =
  'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=60';

// Bus definitions; routeIndex points into ROUTES, driverIndex into DRIVERS.
const BUSES = [
  { reg: 'BA-1-KHA-1234', type: BusTypes.AC_BUS, cls: BusClassTypes.BUSINESS, fare: 1200, seats: 36, routeIndex: 0, driverIndex: 0, depHour: 7 },
  { reg: 'BA-2-CHA-2233', type: BusTypes.SLEEPER_BUS, cls: BusClassTypes.FIRSTCLASS, fare: 1800, seats: 30, routeIndex: 0, driverIndex: 1, depHour: 20 },
  { reg: 'GA-1-PA-4521', type: BusTypes.NONE_AC_BUS, cls: BusClassTypes.ECONOMY, fare: 700, seats: 40, routeIndex: 1, driverIndex: 2, depHour: 9 },
  { reg: 'NA-4-KHA-8890', type: BusTypes.AC_BUS, cls: BusClassTypes.BUSINESS, fare: 950, seats: 36, routeIndex: 1, driverIndex: 3, depHour: 14 },
  { reg: 'LU-2-JA-7781', type: BusTypes.AC_BUS, cls: BusClassTypes.BUSINESS, fare: 1500, seats: 38, routeIndex: 2, driverIndex: 4, depHour: 8 },
  { reg: 'KO-5-PA-3390', type: BusTypes.SLEEPER_BUS, cls: BusClassTypes.FIRSTCLASS, fare: 2200, seats: 28, routeIndex: 3, driverIndex: 0, depHour: 16 },
  { reg: 'GA-3-CHA-1102', type: BusTypes.NONE_AC_BUS, cls: BusClassTypes.ECONOMY, fare: 600, seats: 42, routeIndex: 4, driverIndex: 1, depHour: 10 },
  { reg: 'BA-6-KHA-5567', type: BusTypes.AC_BUS, cls: BusClassTypes.BUSINESS, fare: 1300, seats: 36, routeIndex: 5, driverIndex: 2, depHour: 19 },
];

async function main() {
  console.log('🌱 Seeding database…');

  // Hash a shared demo password for the driver accounts.
  const driverPassword = await argon2.hash('Driver@123');

  // 1) Drivers (upsert by unique email).
  const driverIds: string[] = [];
  for (const d of DRIVERS) {
    const user = await prisma.user.upsert({
      where: { email: d.email },
      update: { role: 'DRIVER', isVerified: true },
      create: {
        firstName: d.firstName,
        lastName: d.lastName,
        email: d.email,
        phoneNumber: d.phoneNumber,
        role: 'DRIVER',
        password: driverPassword,
        isVerified: true,
      },
    });
    driverIds.push(user.id);
  }
  console.log(`   ✓ ${driverIds.length} drivers ready`);

  // 2) Routes (find-or-create; Route has no unique constraint on origin/destination).
  const routeIds: string[] = [];
  for (const r of ROUTES) {
    let route = await prisma.route.findFirst({
      where: { origin: r.origin, destination: r.destination },
    });
    if (!route) {
      route = await prisma.route.create({ data: r });
    }
    routeIds.push(route.id);
  }
  console.log(`   ✓ ${routeIds.length} routes ready`);

  // 3) Buses + schedules — only when the catalog is empty, to avoid duplicates.
  const existingBuses = await prisma.bus.count();
  if (existingBuses > 0) {
    console.log(`   • ${existingBuses} buses already exist — skipping bus/schedule creation.`);
  } else {
    for (const b of BUSES) {
      const bus = await prisma.bus.create({
        data: {
          busRegistrationNumber: b.reg,
          busType: b.type,
          class: b.cls,
          farePerTicket: b.fare,
          seats: makeSeats(b.seats),
          driverId: driverIds[b.driverIndex],
          busPicture: BUS_PICTURE,
        },
      });

      const departure = departureAt(b.depHour);
      const arrival = addMinutes(departure, ROUTES[b.routeIndex].estimatedTimeInMin);

      await prisma.schedule.create({
        data: {
          busId: bus.id,
          routeId: routeIds[b.routeIndex],
          estimatedDepartureTimeDate: departure,
          estimatedArrivalTimeDate: arrival,
        },
      });
    }
    console.log(`   ✓ ${BUSES.length} buses + schedules created`);
  }

  console.log('✅ Seed complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
