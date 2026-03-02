import { config } from 'dotenv';
import { db } from '../lib/db';
import { listings } from '../lib/schema';

// Load environment variables
config({ path: '.env.local' });

async function testDatabase() {
  console.log('🔍 Testing database connection...');
  
  try {
    // Simple test insert
    const testListing = {
      slug: 'test-skill',
      name: 'Test Skill',
      type: 'skill' as const,
      description: 'A simple test skill to verify database connectivity.',
      authorHandle: 'test',
      repoUrl: 'https://github.com/test/skill',
      installCommand: 'claude install test/skill',
      category: 'testing',
      tags: ['test'],
      isOfficial: false,
      isSafe: true,
      healthScore: 100,
      githubStars: 0,
      weeklyInstalls: 0,
      totalInstalls: 0,
      voteCount: 0,
      files: [],
      agentsInstalledOn: {},
    };

    await db.insert(listings).values(testListing);
    console.log('✅ Test listing inserted successfully!');

    // Clean up
    await db.delete(listings);
    console.log('✨ Cleaned up test data');

    console.log('🎉 Database connection working correctly!');
  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  }
}

testDatabase();