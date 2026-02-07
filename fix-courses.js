const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAllCourses() {
  try {
    console.log('🔧 Fixing all course access rules to match their prices...\n');
    
    // Get all courses
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        title: true,
        price: true,
        accessRule: true
      }
    });

    let fixed = 0;
    
    for (const course of courses) {
      const currentPrice = course.price ? Number(course.price) : 0;
      const shouldBePayment = currentPrice > 0;
      const correctAccessRule = shouldBePayment ? 'PAYMENT' : 'OPEN';
      
      if (course.accessRule !== correctAccessRule) {
        await prisma.course.update({
          where: { id: course.id },
          data: { accessRule: correctAccessRule }
        });
        
        console.log(`  ✅ ${course.title}: ₹${currentPrice} → ${correctAccessRule}`);
        fixed++;
      }
    }

    if (fixed === 0) {
      console.log('  ✅ All courses are already consistent!');
    } else {
      console.log(`\n✅ Fixed ${fixed} course(s)`);
    }

    console.log('\n📋 Final state:');
    const updatedCourses = await prisma.course.findMany({
      select: { title: true, price: true, accessRule: true }
    });

    updatedCourses.forEach(c => {
      const priceDisplay = c.price ? `₹${Number(c.price)}` : 'FREE';
      const icon = c.accessRule === 'PAYMENT' ? '🔒' : '🆓';
      console.log(`  ${icon} ${c.title}: ${priceDisplay}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAllCourses();
