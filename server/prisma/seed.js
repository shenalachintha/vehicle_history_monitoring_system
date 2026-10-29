import bcrypt from 'bcryptjs';
import prisma from '../src/prisma.js';

async function main() {
  console.log('🌱 Seeding FleetGuard Pro database...');

  // 1. Create Users
  const passwordHash = await bcrypt.hash('password123', 10);
  const adminPass = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@fleetguard.com' },
    update: {},
    create: {
      email: 'admin@fleetguard.com',
      passwordHash: adminPass,
      fullName: 'Shenal Achintha',
      role: 'ADMIN',
      department: 'Executive Fleet Operations',
      phone: '+94 77 123 4567',
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@fleetguard.com' },
    update: {},
    create: {
      email: 'manager@fleetguard.com',
      passwordHash,
      fullName: 'Kavindu Silva',
      role: 'FLEET_MANAGER',
      department: 'Logistics & Dispatch',
      phone: '+94 77 987 6543',
    },
  });

  const officer = await prisma.user.upsert({
    where: { email: 'officer@fleetguard.com' },
    update: {},
    create: {
      email: 'officer@fleetguard.com',
      passwordHash,
      fullName: 'Tharindu Jayasinghe',
      role: 'MAINTENANCE_OFFICER',
      department: 'Technical & Engineering',
      phone: '+94 71 456 7890',
    },
  });

  const recorder = await prisma.user.upsert({
    where: { email: 'recorder@fleetguard.com' },
    update: {},
    create: {
      email: 'recorder@fleetguard.com',
      passwordHash,
      fullName: 'Saman Kumara',
      role: 'MILEAGE_RECORDER',
      department: 'Operations',
      phone: '+94 78 234 5678',
    },
  });

  console.log('✅ Users seeded successfully.');

  // 2. Realistic Vehicles
  const sampleVehicles = [
    {
      registrationNo: 'WP CA 1234',
      vin: 'JTDKN36U901234567',
      make: 'Toyota',
      model: 'Corolla',
      year: 2021,
      category: 'CAR',
      fuelType: 'PETROL',
      transmission: 'AUTOMATIC',
      chassisNo: 'CH-CA-1234-TOY',
      engineNo: 'ENG-2ZR-99881',
      status: 'ACTIVE',
      currentOdometer: 52450.00,
      assignedDriver: 'Nimal Perera',
      driverContact: '077 123 4567',
      department: 'Sales & Marketing',
      branch: 'Colombo Central',
      operationalLocation: 'Trincomalee Highway',
      currentLatitude: 8.5874,
      currentLongitude: 81.2152,
      locationStatus: 'MOVING',
      purchaseDate: new Date('2021-03-15'),
      purchasePrice: 28500.00,
      supplier: 'Toyota Lanka Ltd',
      thumbnailUrl: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=300&auto=format&fit=crop&q=80',
    },
    {
      registrationNo: 'WP KA 5678',
      vin: '1HGCR2F83HA012345',
      make: 'Honda',
      model: 'Civic',
      year: 2022,
      category: 'CAR',
      fuelType: 'PETROL',
      transmission: 'AUTOMATIC',
      chassisNo: 'CH-KA-5678-HON',
      engineNo: 'ENG-L15B-44321',
      status: 'ACTIVE',
      currentOdometer: 38200.00,
      assignedDriver: 'Kavindu Silva',
      driverContact: '077 987 6543',
      department: 'Corporate Relations',
      branch: 'Colombo HQ',
      operationalLocation: 'Kinniya Bypass',
      currentLatitude: 8.4890,
      currentLongitude: 81.1850,
      locationStatus: 'MOVING',
      purchaseDate: new Date('2022-01-20'),
      purchasePrice: 32000.00,
      supplier: 'Stafford Motors',
      thumbnailUrl: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=300&auto=format&fit=crop&q=80',
    },
    {
      registrationNo: 'WP LB 9012',
      vin: 'JN1FA51E5AT098765',
      make: 'Nissan',
      model: 'Note',
      year: 2020,
      category: 'CAR',
      fuelType: 'HYBRID',
      transmission: 'AUTOMATIC',
      chassisNo: 'CH-LB-9012-NIS',
      engineNo: 'ENG-HR12-77112',
      status: 'UNDER_MAINTENANCE',
      currentOdometer: 64100.00,
      assignedDriver: 'Tharindu Jayasinghe',
      driverContact: '071 456 7890',
      department: 'Logistics Support',
      branch: 'Kandy Regional Depot',
      operationalLocation: 'Eppawela Service Center',
      currentLatitude: 8.1400,
      currentLongitude: 80.4100,
      locationStatus: 'STOPPED',
      purchaseDate: new Date('2020-08-10'),
      purchasePrice: 22000.00,
      supplier: 'Associated Motorways',
      thumbnailUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=300&auto=format&fit=crop&q=80',
    },
    {
      registrationNo: 'WP NC 3456',
      vin: 'MPATFR85JHT654321',
      make: 'Isuzu',
      model: 'D-Max 4x4',
      year: 2023,
      category: 'PICKUP',
      fuelType: 'DIESEL',
      transmission: 'MANUAL',
      chassisNo: 'CH-NC-3456-ISU',
      engineNo: 'ENG-4JJ3-11299',
      status: 'ACTIVE',
      currentOdometer: 29800.00,
      assignedDriver: 'Saman Kumara',
      driverContact: '078 234 5678',
      department: 'Field Operations',
      branch: 'Trincomalee Base',
      operationalLocation: 'Kuchchaveli Coast',
      currentLatitude: 8.8150,
      currentLongitude: 81.0920,
      locationStatus: 'MOVING',
      purchaseDate: new Date('2023-04-12'),
      purchasePrice: 46000.00,
      supplier: 'Sathosa Motors',
      thumbnailUrl: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=300&auto=format&fit=crop&q=80',
    },
    {
      registrationNo: 'WP PF 7890',
      vin: 'MA3ETA31S00112233',
      make: 'Suzuki',
      model: 'Alto',
      year: 2019,
      category: 'CAR',
      fuelType: 'PETROL',
      transmission: 'MANUAL',
      chassisNo: 'CH-PF-7890-SUZ',
      engineNo: 'ENG-K10B-55443',
      status: 'ACTIVE',
      currentOdometer: 78500.00,
      assignedDriver: 'Chandima Fernando',
      driverContact: '077 567 8901',
      department: 'Field Courier',
      branch: 'Gampaha Branch',
      operationalLocation: 'Trincomalee Town',
      currentLatitude: 8.5711,
      currentLongitude: 81.2335,
      locationStatus: 'OFFLINE',
      purchaseDate: new Date('2019-11-05'),
      purchasePrice: 14500.00,
      supplier: 'AMW Capital',
      thumbnailUrl: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=300&auto=format&fit=crop&q=80',
    },
  ];

  for (const vData of sampleVehicles) {
    const v = await prisma.vehicle.upsert({
      where: { registrationNo: vData.registrationNo },
      update: {},
      create: vData,
    });

    // Seed Maintenance Rules for each vehicle
    await prisma.maintenanceRule.createMany({
      data: [
        {
          name: 'Periodic Engine Oil & Filter Service',
          category: 'Routine Service',
          vehicleId: v.id,
          conditionType: 'DATE_OR_MILEAGE',
          intervalMonths: 6,
          intervalKm: 5000,
          warningDaysBefore: 30,
          warningKmBefore: 500,
          lastCompletedDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
          lastCompletedKm: Number(v.currentOdometer) - 4600,
          nextDueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          nextDueKm: Number(v.currentOdometer) + 400,
        },
        {
          name: 'Diesel Fuel System Maintenance & Tune-up',
          category: 'Diesel Fuel System',
          vehicleId: v.id,
          conditionType: 'MILEAGE_ONLY',
          intervalKm: 10000,
          warningKmBefore: 500,
          lastCompletedDate: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000),
          lastCompletedKm: Number(v.currentOdometer) - 9700,
          nextDueKm: Number(v.currentOdometer) + 300,
        },
        {
          name: 'Chemical Additive & Injector Treatment',
          category: 'Chemical Additive Treatment',
          vehicleId: v.id,
          conditionType: 'DATE_OR_MILEAGE',
          intervalMonths: 6,
          intervalKm: 5000,
          warningDaysBefore: 15,
          warningKmBefore: 300,
          lastCompletedDate: new Date(Date.now() - 170 * 24 * 60 * 60 * 1000),
          lastCompletedKm: Number(v.currentOdometer) - 4850,
          nextDueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          nextDueKm: Number(v.currentOdometer) + 150,
        },
      ],
    });

    // Seed Sample Event
    const event = await prisma.vehicleEvent.create({
      data: {
        vehicleId: v.id,
        eventType: 'ROUTINE_SERVICE',
        title: '50,000 km Major Periodic Service',
        eventDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        odometerAtEvent: Number(v.currentOdometer) - 2000,
        workPerformed: 'Replaced engine oil (5W-30 Synthetic), oil filter, cabin air filter, and performed 32-point safety check.',
        serviceProvider: 'Toyota Care Center',
        technicianName: 'S. Bandara',
        laborCost: 45.00,
        partsCost: 110.00,
        otherCost: 15.00,
        totalCost: 170.00,
        currency: 'USD',
        nextServiceMileage: Number(v.currentOdometer) + 3000,
        createdById: officer.id,
        items: {
          create: [
            { description: 'Synthetic Engine Oil 5W-30 (4L)', itemType: 'FLUID', brand: 'Mobil 1', quantity: 1, unitCost: 65, totalPrice: 65 },
            { description: 'OEM Oil Filter Cartridge', itemType: 'PART', brand: 'Toyota Genuine', quantity: 1, unitCost: 25, totalPrice: 25 },
            { description: 'Air Cleaner Filter Element', itemType: 'PART', brand: 'Denso', quantity: 1, unitCost: 20, totalPrice: 20 },
          ],
        },
      },
    });

    // Seed Sample Document
    await prisma.vehicleDocument.createMany({
      data: [
        {
          vehicleId: v.id,
          docType: 'INSURANCE',
          title: 'Comprehensive Fleet Insurance Policy',
          documentNumber: `POL-${v.registrationNo.replace(/\s+/g, '')}-2025`,
          issueDate: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000),
          expiryDate: new Date(Date.now() + 65 * 24 * 60 * 60 * 1000),
          fileUrl: 'https://fleetguard.com/docs/sample-policy.pdf',
          createdById: admin.id,
        },
        {
          vehicleId: v.id,
          docType: 'REVENUE_LICENCE',
          title: 'Annual Provincial Revenue Licence',
          documentNumber: `RL-${v.registrationNo.replace(/\s+/g, '')}-99`,
          issueDate: new Date(Date.now() - 350 * 24 * 60 * 60 * 1000),
          expiryDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Expired!
          fileUrl: 'https://fleetguard.com/docs/revenue-licence.pdf',
          createdById: admin.id,
        },
      ],
    });

    // Seed Mileage Readings (4 weeks history)
    for (let w = 4; w >= 1; w--) {
      await prisma.mileageReading.create({
        data: {
          vehicleId: v.id,
          recordedDate: new Date(Date.now() - w * 7 * 24 * 60 * 60 * 1000),
          odometerReading: Number(v.currentOdometer) - w * 450,
          distanceTravelled: 450,
          weekNumber: 40 - w,
          year: 2025,
          recordedById: recorder.id,
        },
      });
    }
  }

  // Trigger alert evaluations
  console.log('🔔 Evaluating initial fleet alerts...');
  // We can call AlertService or seed alerts directly
  console.log('✨ Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

