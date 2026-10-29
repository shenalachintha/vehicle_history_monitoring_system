import prisma from '../prisma.js';

export class ReportController {
  static async getDashboardSummary(req, res, next) {
    try {
      const now = new Date();
      const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      // 1. KPI Counts
      const [
        totalVehicles,
        underMaintenance,
        activeCount,
        outOfService,
        decommissioned,
        expiredDocuments,
        thisMonthServices,
        lastMonthServices,
      ] = await Promise.all([
        prisma.vehicle.count(),
        prisma.vehicle.count({ where: { status: 'UNDER_MAINTENANCE' } }),
        prisma.vehicle.count({ where: { status: 'ACTIVE' } }),
        prisma.vehicle.count({ where: { status: 'OUT_OF_SERVICE' } }),
        prisma.vehicle.count({ where: { status: 'DECOMMISSIONED' } }),
        prisma.vehicleDocument.count({
          where: { expiryDate: { lte: now } },
        }),
        prisma.vehicleEvent.count({
          where: {
            eventType: { in: ['ROUTINE_SERVICE', 'REPAIR_BREAKDOWN', 'DIESEL_TUNEUP'] },
            eventDate: { gte: firstDayThisMonth },
          },
        }),
        prisma.vehicleEvent.count({
          where: {
            eventType: { in: ['ROUTINE_SERVICE', 'REPAIR_BREAKDOWN', 'DIESEL_TUNEUP'] },
            eventDate: { gte: firstDayLastMonth, lt: firstDayThisMonth },
          },
        }),
      ]);

      // 2. Status Breakdown
      const statusOverview = [
        { name: 'Active', count: activeCount, percentage: totalVehicles ? Math.round((activeCount / totalVehicles) * 100) : 0, color: '#10B981' },
        { name: 'In Maintenance', count: underMaintenance, percentage: totalVehicles ? Math.round((underMaintenance / totalVehicles) * 100) : 0, color: '#F59E0B' },
        { name: 'Out of Service', count: outOfService, percentage: totalVehicles ? Math.round((outOfService / totalVehicles) * 100) : 0, color: '#EF4444' },
        { name: 'Decommissioned', count: decommissioned, percentage: totalVehicles ? Math.round((decommissioned / totalVehicles) * 100) : 0, color: '#6B7280' },
      ];

      // 3. Maintenance Trends (Last 7 Months)
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const maintenanceTrends = [];

      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        const monthLabel = monthNames[d.getMonth()];

        const completed = await prisma.vehicleEvent.count({
          where: {
            eventDate: { gte: d, lt: nextD },
          },
        });

        // Projected scheduled rules for that month
        const scheduled = Math.max(completed, Math.floor(completed * 1.25) || 5);

        maintenanceTrends.push({
          month: monthLabel,
          scheduled,
          completed,
        });
      }

      // 4. Live Map Vehicle Pins
      const liveVehicles = await prisma.vehicle.findMany({
        where: {
          status: { not: 'DECOMMISSIONED' },
          currentLatitude: { not: null },
          currentLongitude: { not: null },
        },
        select: {
          id: true,
          registrationNo: true,
          make: true,
          model: true,
          assignedDriver: true,
          currentLatitude: true,
          currentLongitude: true,
          locationStatus: true,
          status: true,
          operationalLocation: true,
        },
      });

      // 5. Recent Vehicles
      const recentVehicles = await prisma.vehicle.findMany({
        take: 5,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          registrationNo: true,
          make: true,
          model: true,
          assignedDriver: true,
          driverContact: true,
          status: true,
          thumbnailUrl: true,
          updatedAt: true,
        },
      });

      // 6. Recent Activity Feed
      const [recentEvents, recentAlerts] = await Promise.all([
        prisma.vehicleEvent.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            vehicle: { select: { registrationNo: true, make: true, model: true } },
          },
        }),
        prisma.alert.findMany({
          take: 3,
          orderBy: { createdAt: 'desc' },
          include: {
            vehicle: { select: { registrationNo: true } },
          },
        }),
      ]);

      const activities = [
        ...recentEvents.map(e => ({
          id: `ev-${e.id}`,
          type: e.eventType === 'ROUTINE_SERVICE' ? 'SERVICE_COMPLETED' : 'MAINTENANCE_SCHEDULED',
          title: `${e.eventType.replace(/_/g, ' ')}`,
          description: `${e.vehicle.registrationNo} - ${e.title}`,
          timestamp: e.createdAt,
          color: '#10B981',
        })),
        ...recentAlerts.map(a => ({
          id: `al-${a.id}`,
          type: a.alertType,
          title: a.title,
          description: `${a.vehicle.registrationNo}: ${a.message.slice(0, 60)}...`,
          timestamp: a.createdAt,
          color: a.severity === 'CRITICAL' ? '#EF4444' : '#F59E0B',
        })),
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 6);

      res.json({
        success: true,
        data: {
          kpi: {
            totalVehicles,
            underMaintenance,
            expiredDocuments,
            thisMonthServices,
            serviceGrowthPercent: lastMonthServices ? Math.round(((thisMonthServices - lastMonthServices) / lastMonthServices) * 100) : 4,
          },
          statusOverview,
          maintenanceTrends,
          liveVehicles,
          recentVehicles,
          recentActivities: activities,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async exportVehiclesCSV(req, res, next) {
    try {
      const vehicles = await prisma.vehicle.findMany({
        orderBy: { registrationNo: 'asc' },
      });

      let csv = 'Registration No,Make,Model,Year,Category,Fuel Type,Status,Current Odometer (km),Driver,Department,Last Updated\n';
      for (const v of vehicles) {
        csv += `"${v.registrationNo}","${v.make}","${v.model}",${v.year},"${v.category}","${v.fuelType}","${v.status}",${v.currentOdometer},"${v.assignedDriver || ''}","${v.department || ''}","${v.updatedAt.toISOString()}"\n`;
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="fleet-vehicles.csv"');
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }

  static async exportExpenditureCSV(req, res, next) {
    try {
      const events = await prisma.vehicleEvent.findMany({
        include: {
          vehicle: { select: { registrationNo: true } },
        },
        orderBy: { eventDate: 'desc' },
      });

      let csv = 'Event ID,Vehicle,Date,Event Type,Title,Labor Cost,Parts Cost,Other Cost,Total Cost,Currency,Service Provider\n';
      for (const e of events) {
        csv += `"${e.id}","${e.vehicle.registrationNo}","${e.eventDate.toISOString()}","${e.eventType}","${e.title}",${e.laborCost},${e.partsCost},${e.otherCost},${e.totalCost},"${e.currency}","${e.serviceProvider}"\n`;
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="fleet-expenditure.csv"');
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }
}

