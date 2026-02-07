import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

// Create Supabase Admin client for user creation
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseServiceRoleKey || supabaseServiceRoleKey === 'YOUR_SERVICE_ROLE_KEY_HERE') {
  console.error('❌ ERROR: SUPABASE_SERVICE_ROLE_KEY is not set!');
  console.error('   Please add it to your .env file. Find it in Supabase Dashboard -> Settings -> API -> service_role (secret)');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const DEMO_PASSWORD = 'LearnSphere2024!';

interface DemoUser {
  email: string;
  name: string;
  role: 'ADMIN' | 'INSTRUCTOR' | 'LEARNER';
  totalPoints?: number;
  badgeLevel?: string;
}

const demoUsers: DemoUser[] = [
  { email: 'admin@learnsphere.com', name: 'Admin User', role: 'ADMIN' },
  { email: 'instructor@learnsphere.com', name: 'Sarah Johnson', role: 'INSTRUCTOR' },
  { email: 'learner@learnsphere.com', name: 'John Doe', role: 'LEARNER', totalPoints: 35, badgeLevel: 'EXPLORER' },
];

async function createOrGetSupabaseUser(user: DemoUser): Promise<string> {
  // First, try to get the existing user
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
  const existingUser = existingUsers?.users.find(u => u.email === user.email);
  
  if (existingUser) {
    console.log(`   ↳ User ${user.email} already exists in Supabase Auth`);
    return existingUser.id;
  }

  // Create new user in Supabase Auth
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: user.email,
    password: DEMO_PASSWORD,
    email_confirm: true, // Auto-confirm so they can log in immediately
    user_metadata: { name: user.name, role: user.role }
  });

  if (error) {
    console.error(`   ❌ Failed to create ${user.email}:`, error.message);
    throw error;
  }

  console.log(`   ✓ Created ${user.email} in Supabase Auth`);
  return data.user.id;
}

async function main() {
  console.log('🌱 Starting seed...\n');
  console.log('📋 Demo Password for all users:', DEMO_PASSWORD, '\n');

  // Create demo users in BOTH Supabase Auth AND Prisma
  console.log('👥 Creating users...');
  const userIds: Record<string, string> = {};

  for (const user of demoUsers) {
    const supabaseId = await createOrGetSupabaseUser(user);
    userIds[user.email] = supabaseId;

    // Upsert user profile in Prisma DB
    await prisma.user.upsert({
      where: { email: user.email },
      update: { id: supabaseId }, // Update ID if it changed
      create: {
        id: supabaseId,
        email: user.email,
        name: user.name,
        role: user.role,
        totalPoints: user.totalPoints || 0,
        badgeLevel: user.badgeLevel || 'NEWBIE',
      },
    });
  }

  console.log('✅ Users created\n');

  const instructorId = userIds['instructor@learnsphere.com'];
  const learnerId = userIds['learner@learnsphere.com'];

  // Create courses
  console.log('📚 Creating courses...');
  const webDevCourse = await prisma.course.upsert({
    where: { id: 'course-web-dev' },
    update: {},
    create: {
      id: 'course-web-dev',
      title: 'Complete Web Development Bootcamp',
      description: 'Learn HTML, CSS, JavaScript, React, and Node.js from scratch. Build real-world projects and become a full-stack developer.',
      imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=60',
      isPublished: true,
      visibility: 'EVERYONE',
      accessRule: 'OPEN',
      totalDuration: 180,
      viewsCount: 1250,
      instructorId: instructorId,
    },
  });

  const pythonCourse = await prisma.course.upsert({
    where: { id: 'course-python' },
    update: {},
    create: {
      id: 'course-python',
      title: 'Python for Data Science',
      description: 'Master Python programming for data analysis, visualization, and machine learning. Perfect for beginners and professionals.',
      imageUrl: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&auto=format&fit=crop&q=60',
      isPublished: true,
      visibility: 'EVERYONE',
      accessRule: 'OPEN',
      totalDuration: 150,
      viewsCount: 890,
      instructorId: instructorId,
    },
  });

  const designCourse = await prisma.course.upsert({
    where: { id: 'course-design' },
    update: {},
    create: {
      id: 'course-design',
      title: 'UI/UX Design Masterclass',
      description: 'Learn modern UI/UX design principles, Figma, and create stunning user interfaces that users love.',
      imageUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&auto=format&fit=crop&q=60',
      isPublished: true,
      visibility: 'EVERYONE',
      accessRule: 'PAYMENT',
      price: 49.99,
      totalDuration: 120,
      viewsCount: 650,
      instructorId: instructorId,
    },
  });

  const draftCourse = await prisma.course.upsert({
    where: { id: 'course-draft' },
    update: {},
    create: {
      id: 'course-draft',
      title: 'Advanced React Patterns',
      description: 'Deep dive into advanced React patterns, performance optimization, and architecture.',
      isPublished: false,
      instructorId: instructorId,
    },
  });

  console.log('✅ Courses created\n');

  // Create tags
  console.log('🏷️  Creating tags...');
  await prisma.courseTag.createMany({
    data: [
      { id: 'tag-1', name: 'Web Development', courseId: webDevCourse.id },
      { id: 'tag-2', name: 'JavaScript', courseId: webDevCourse.id },
      { id: 'tag-3', name: 'React', courseId: webDevCourse.id },
      { id: 'tag-4', name: 'Python', courseId: pythonCourse.id },
      { id: 'tag-5', name: 'Data Science', courseId: pythonCourse.id },
      { id: 'tag-6', name: 'Machine Learning', courseId: pythonCourse.id },
      { id: 'tag-7', name: 'UI/UX', courseId: designCourse.id },
      { id: 'tag-8', name: 'Figma', courseId: designCourse.id },
      { id: 'tag-9', name: 'React', courseId: draftCourse.id },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Tags created\n');

  // Create lessons for Web Dev course
  console.log('📖 Creating lessons...');
  const webLessons = [
    { id: 'lesson-1', title: 'Introduction to Web Development', type: 'VIDEO', duration: 15, videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
    { id: 'lesson-2', title: 'HTML Fundamentals', type: 'VIDEO', duration: 30, videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
    { id: 'lesson-3', title: 'CSS Styling Basics', type: 'VIDEO', duration: 25, videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
    { id: 'lesson-4', title: 'JavaScript Essentials', type: 'VIDEO', duration: 40, videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
    { id: 'lesson-5', title: 'HTML/CSS Cheatsheet', type: 'DOCUMENT', duration: 10, documentUrl: 'https://example.com/cheatsheet.pdf', allowDownload: true },
    { id: 'lesson-6', title: 'Module 1 Quiz', type: 'QUIZ', duration: 15 },
  ];

  for (let i = 0; i < webLessons.length; i++) {
    const lesson = webLessons[i];
    await prisma.lesson.upsert({
      where: { id: lesson.id },
      update: {},
      create: {
        id: lesson.id,
        title: lesson.title,
        type: lesson.type as any,
        duration: lesson.duration,
        videoUrl: lesson.videoUrl || null,
        documentUrl: lesson.documentUrl || null,
        allowDownload: lesson.allowDownload || false,
        orderIndex: i,
        courseId: webDevCourse.id,
        description: `Learn about ${lesson.title.toLowerCase()} in this comprehensive lesson.`,
      },
    });
  }
  console.log('✅ Lessons created\n');

  // Create quiz for lesson 6
  console.log('❓ Creating quiz...');
  const quiz = await prisma.quiz.upsert({
    where: { id: 'quiz-1' },
    update: {},
    create: {
      id: 'quiz-1',
      lessonId: 'lesson-6',
      firstAttemptPoints: 100,
      secondAttemptPoints: 75,
      thirdAttemptPoints: 50,
      fourthPlusPoints: 25,
    },
  });

  // Create questions
  const questions = [
    {
      id: 'q1',
      text: 'What does HTML stand for?',
      options: [
        { id: 'q1-a', text: 'Hyper Text Markup Language', isCorrect: true },
        { id: 'q1-b', text: 'High Tech Modern Language', isCorrect: false },
        { id: 'q1-c', text: 'Hyperlink Text Management Language', isCorrect: false },
        { id: 'q1-d', text: 'Home Tool Markup Language', isCorrect: false },
      ],
    },
    {
      id: 'q2',
      text: 'Which CSS property is used to change the text color?',
      options: [
        { id: 'q2-a', text: 'font-color', isCorrect: false },
        { id: 'q2-b', text: 'text-color', isCorrect: false },
        { id: 'q2-c', text: 'color', isCorrect: true },
        { id: 'q2-d', text: 'foreground', isCorrect: false },
      ],
    },
    {
      id: 'q3',
      text: 'Which is the correct way to declare a JavaScript variable?',
      options: [
        { id: 'q3-a', text: 'variable name = value;', isCorrect: false },
        { id: 'q3-b', text: 'let name = value;', isCorrect: true },
        { id: 'q3-c', text: 'v name = value;', isCorrect: false },
        { id: 'q3-d', text: 'var: name = value;', isCorrect: false },
      ],
    },
  ];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    await prisma.question.upsert({
      where: { id: q.id },
      update: {},
      create: {
        id: q.id,
        text: q.text,
        orderIndex: i,
        quizId: quiz.id,
      },
    });

    for (const opt of q.options) {
      await prisma.option.upsert({
        where: { id: opt.id },
        update: {},
        create: {
          id: opt.id,
          text: opt.text,
          isCorrect: opt.isCorrect,
          questionId: q.id,
        },
      });
    }
  }
  console.log('✅ Quiz and questions created\n');

  // Create enrollment for learner
  console.log('📝 Creating enrollments...');
  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: learnerId, courseId: webDevCourse.id } },
    update: {},
    create: {
      userId: learnerId,
      courseId: webDevCourse.id,
      status: 'ACTIVE',
      startedAt: new Date(),
      progress: 33,
    },
  });

  // Create progress for first 2 lessons
  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: learnerId, lessonId: 'lesson-1' } },
    update: {},
    create: {
      userId: learnerId,
      lessonId: 'lesson-1',
      isCompleted: true,
      completedAt: new Date(),
    },
  });

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: learnerId, lessonId: 'lesson-2' } },
    update: {},
    create: {
      userId: learnerId,
      lessonId: 'lesson-2',
      isCompleted: true,
      completedAt: new Date(),
    },
  });
  console.log('✅ Enrollments and progress created\n');

  // Create reviews
  console.log('⭐ Creating reviews...');
  await prisma.review.upsert({
    where: { userId_courseId: { userId: learnerId, courseId: webDevCourse.id } },
    update: {},
    create: {
      userId: learnerId,
      courseId: webDevCourse.id,
      rating: 5,
      comment: 'Excellent course! The instructor explains everything clearly and the projects are really helpful.',
    },
  });
  console.log('✅ Reviews created\n');

  console.log('═══════════════════════════════════════════════════════');
  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('   📧 Demo Accounts:');
  console.log('      • admin@learnsphere.com');
  console.log('      • instructor@learnsphere.com');
  console.log('      • learner@learnsphere.com');
  console.log('');
  console.log('   🔐 Password:', DEMO_PASSWORD);
  console.log('═══════════════════════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
