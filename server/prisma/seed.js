import bcrypt from 'bcryptjs';
import prisma from '../src/prisma.js';

async function main() {
  console.log('🧹 Purging all existing database records...');

  // 1. Delete in dependent child-to-parent order to respect foreign key constraints
  await prisma.eventItem.deleteMany({});
  await prisma.vehicleEvent.deleteMany({});
  await prisma.mileageReading.deleteMany({});
  await prisma.alert.deleteMany({});
  await prisma.vehicleDocument.deleteMany({});
  await prisma.maintenanceRule.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('✅ Database purged clean.');

  console.log('🌱 Seeding minimal required records...');

  // 2. Exactly 1 Admin User
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@eltoro.lk',
      passwordHash: adminPasswordHash,
      fullName: 'El-Toro Administrator',
      role: 'ADMIN',
      department: 'Fleet & Operations Management',
      phone: '+94 11 472 8800',
      isActive: true,
    },
  });

  console.log(`✅ Admin user created: ${adminUser.email} (Password: admin123)`);

  // 3. Exactly 2 Vehicles for El-Toro Roofing Products Ltd.
  const vehicle1 = await prisma.vehicle.create({
    data: {
      registrationNo: 'WP CAB-4521',
      vin: 'MR0FZ22G501234567',
      make: 'Toyota',
      model: 'Hilux Double Cab 4x4',
      year: 2022,
      category: 'PICKUP',
      fuelType: 'DIESEL',
      transmission: 'MANUAL',
      chassisNo: 'CH-CAB-4521-TY',
      engineNo: 'ENG-2GD-948123',
      status: 'ACTIVE',
      currentOdometer: 42500.00,
      assignedDriver: 'Kamal Gunaratne',
      driverContact: '+94 77 123 4567',
      department: 'Factory Logistics & Dispatch',
      branch: 'Western Province',
      operationalLocation: 'Kelaniya Manufacturing Complex',
      currentLatitude: 6.9532,
      currentLongitude: 79.9214,
      locationStatus: 'STOPPED',
      purchaseDate: new Date('2022-04-10'),
      purchasePrice: 42000.00,
      supplier: 'Toyota Lanka (Pvt) Ltd',
      thumbnailUrl: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=400&auto=format&fit=crop&q=80',
      notes: 'Operational logistics and site inspections vehicle for El-Toro Roofing Products Ltd.',
    },
  });

  const vehicle2 = await prisma.vehicle.create({
    data: {
      registrationNo: 'WP ND-8890',
      vin: 'NKR81E-7012345',
      make: 'Isuzu',
      model: 'Elf 14.5ft Light Duty Truck',
      year: 2021,
      category: 'LORRY',
      fuelType: 'DIESEL',
      transmission: 'MANUAL',
      chassisNo: 'CH-ND-8890-ISZ',
      engineNo: 'ENG-4HG1-789234',
      status: 'ACTIVE',
      currentOdometer: 68200.00,
      assignedDriver: 'Sunil Shantha',
      driverContact: '+94 71 987 6543',
      department: 'Distribution & Material Delivery',
      branch: 'Central Region',
      operationalLocation: 'Colombo Distribution Depot',
      currentLatitude: 6.9271,
      currentLongitude: 79.8612,
      locationStatus: 'STOPPED',
      purchaseDate: new Date('2021-08-18'),
      purchasePrice: 56000.00,
      supplier: 'Sathosa Motors PLC',
      thumbnailUrl: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&auto=format&fit=crop&q=80',
      notes: 'Heavy roofing sheets distribution truck for commercial hardware deliveries.',
    },
  });

  console.log(`✅ 2 Vehicles created: ${vehicle1.registrationNo} & ${vehicle2.registrationNo}`);

  // 4. Exactly 1 Service Maintenance Rule (assigned to Vehicle 1)
  const maintenanceRule = await prisma.maintenanceRule.create({
    data: {
      name: 'Engine Oil & Filter Service (5,000 km)',
      category: 'ROUTINE',
      vehicleId: vehicle1.id,
      conditionType: 'DATE_OR_MILEAGE',
      intervalMonths: 6,
      intervalKm: 5000.00,
      warningDaysBefore: 30,
      warningKmBefore: 500.00,
      criticalOverdueDays: 15,
      criticalOverdueKm: 200.00,
      isRecurring: true,
      lastCompletedDate: new Date('2026-06-15'),
      lastCompletedKm: 40000.00,
      nextDueDate: new Date('2026-12-15'),
      nextDueKm: 45000.00,
      isActive: true,
      instructions: 'Replace synthetic diesel engine oil (15W-40), OEM oil filter, clean air filter, and inspect brakes.',
      responsibleDept: 'Maintenance & Mechanical Engineering',
    },
  });

  console.log(`✅ 1 Maintenance Rule created: "${maintenanceRule.name}" assigned to ${vehicle1.registrationNo}`);

  // 5. Exactly 1 Document (assigned to Vehicle 1)
  const document = await prisma.vehicleDocument.create({
    data: {
      vehicleId: vehicle1.id,
      docType: 'INSURANCE',
      title: 'Commercial Comprehensive Fleet Insurance Policy',
      documentNumber: 'SLIC-FLEET-2026-8841',
      issueDate: new Date('2026-01-15'),
      expiryDate: new Date('2027-01-15'),
      warningDaysBefore: 30,
      fileUrl: '',
      fileSize: 102400,
      notes: 'Full comprehensive commercial fleet cover with flood, strike, and natural disaster riders.',
      createdById: adminUser.id,
    },
  });

  console.log(`✅ 1 Document created: "${document.title}" (${document.docType}) assigned to ${vehicle1.registrationNo}`);

  // 6. Record clean initial audit log
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      action: 'SYSTEM_INITIALIZATION',
      entityType: 'System',
      entityId: adminUser.id,
      details: 'Clean database initialization: 1 Admin User, 2 Vehicles, 1 Maintenance Rule, 1 Document.',
    },
  });

  console.log('🎉 Clean seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
