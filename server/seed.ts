import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { connectDB, dbRepo } from './db.ts';

dotenv.config();

async function runSeed() {
  console.log('🌱 Starting Smart To-Do Planner Database Seeding...');
  await connectDB();

  const demoEmail = 'demo@smartplanner.io';
  const demoPassword = 'password123';
  let demoUser = await dbRepo.findUserByEmail(demoEmail);

  if (!demoUser) {
    console.log(`Creating demo user: ${demoEmail}`);
    const hashedPassword = await bcrypt.hash(demoPassword, 10);
    demoUser = await dbRepo.createUser({
      email: demoEmail,
      password: hashedPassword,
      name: 'Alex Rivera',
      settings: {
        dailyHours: 6,
        workingDays: [1, 2, 3, 4, 5],
        startTime: '09:00',
        bufferPercent: 20,
      },
    });
  } else {
    console.log(`Found existing demo user: ${demoUser.name} (${demoUser._id})`);
  }

  // Clear existing tasks for demo user to ensure clean state
  await dbRepo.clearUserTasks(demoUser._id);

  const now = new Date();
  const dayMs = 86400000;

  const sampleTasks = [
    {
      userId: demoUser._id,
      title: 'Review Quarterly Security Audit',
      description: 'Verify IAM role permissions and audit VPC security group rules.',
      priority: 'High' as const,
      deadline: new Date(now.getTime() + dayMs * 1).toISOString(),
      estimatedEffort: 3.5,
      category: 'Security',
      status: 'In Progress' as const,
      hoursCompleted: 1,
    },
    {
      userId: demoUser._id,
      title: 'Implement Core Planner Algorithm',
      description: 'Implement workload leveling, deadline constraints, and 20% buffer reservation.',
      priority: 'High' as const,
      deadline: new Date(now.getTime() + dayMs * 2).toISOString(),
      estimatedEffort: 6.0,
      category: 'Engineering',
      status: 'In Progress' as const,
      hoursCompleted: 2.5,
    },
    {
      userId: demoUser._id,
      title: 'Design Client Presentation Deck',
      description: 'Prepare pitch deck slides with product roadmap and ROI projections.',
      priority: 'Medium' as const,
      deadline: new Date(now.getTime() + dayMs * 4).toISOString(),
      estimatedEffort: 4.0,
      category: 'Marketing',
      status: 'Pending' as const,
      hoursCompleted: 0,
    },
    {
      userId: demoUser._id,
      title: 'Prepare Tax & Financial Invoices',
      description: 'Reconcile Q3 receipts and submit expense filings to accounting.',
      priority: 'High' as const,
      deadline: new Date(now.getTime() - dayMs * 0.5).toISOString(), // Overdue
      estimatedEffort: 2.0,
      category: 'Finance',
      status: 'Pending' as const,
      hoursCompleted: 0,
    },
    {
      userId: demoUser._id,
      title: 'Write Unit Tests for Task Prioritizer',
      description: 'Cover priority weights, deadline urgency decays, and effort pressure multipliers.',
      priority: 'Medium' as const,
      deadline: new Date(now.getTime() + dayMs * 3).toISOString(),
      estimatedEffort: 3.0,
      category: 'Engineering',
      status: 'Pending' as const,
      hoursCompleted: 0,
    },
    {
      userId: demoUser._id,
      title: 'Annual Health Checkup & Lab Tests',
      description: 'Routine blood panel and physical checkup at clinic.',
      priority: 'Low' as const,
      deadline: new Date(now.getTime() + dayMs * 7).toISOString(),
      estimatedEffort: 1.5,
      category: 'Health',
      status: 'Pending' as const,
      hoursCompleted: 0,
    },
    {
      userId: demoUser._id,
      title: 'Draft Product Architecture Whitepaper',
      description: 'Large multi-day effort describing system scalability, data isolation, and JWT auth flow.',
      priority: 'High' as const,
      deadline: new Date(now.getTime() + dayMs * 5).toISOString(),
      estimatedEffort: 10.0,
      category: 'Engineering',
      status: 'Pending' as const,
      hoursCompleted: 0,
    },
    {
      userId: demoUser._id,
      title: 'Renew Home Office Equipment Insurance',
      description: 'Review policy coverage and update electronics serial list.',
      priority: 'Low' as const,
      deadline: new Date(now.getTime() + dayMs * 9).toISOString(),
      estimatedEffort: 1.0,
      category: 'Personal',
      status: 'Pending' as const,
      hoursCompleted: 0,
    },
  ];

  for (const t of sampleTasks) {
    await dbRepo.createTask(t);
  }

  console.log(`✅ Successfully seeded ${sampleTasks.length} tasks for user: ${demoEmail}`);
  console.log(`Credentials -> Email: ${demoEmail} | Password: ${demoPassword}`);
  process.exit(0);
}

runSeed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
