import { faker } from '@faker-js/faker';
import { subMonths, startOfMonth, endOfMonth, eachDayOfInterval, format } from 'date-fns';
import { DatabaseStorage } from '../server/database-storage.js';

const storage = new DatabaseStorage();

async function seedDemoData() {
  console.log('🌱 Starting demo data seeding for previous month...');

  try {
    // Get all athletes from the database
    const athletes = await storage.getAthletes();
    console.log(`Found ${athletes.length} athletes to seed data for`);

    if (athletes.length === 0) {
      console.log('❌ No athletes found in database. Please create some athletes first.');
      return;
    }

    // Get date range for previous month
    const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
    const lastMonthEnd = endOfMonth(subMonths(new Date(), 1));
    const daysInMonth = eachDayOfInterval({ start: lastMonthStart, end: lastMonthEnd });

    console.log(`Seeding data from ${format(lastMonthStart, 'yyyy-MM-dd')} to ${format(lastMonthEnd, 'yyyy-MM-dd')}`);
    console.log(`That's ${daysInMonth.length} days for ${athletes.length} athletes`);

    let totalDiaries = 0;
    let totalTrainingSessions = 0;

    // Process each day
    for (const day of daysInMonth) {
      const dayString = format(day, 'yyyy-MM-dd');
      
      for (const athlete of athletes) {
        // 85% chance to fill morning diary (realistic attendance)
        if (Math.random() < 0.85) {
          // Generate realistic wellness metrics
          const sleepQuality = faker.helpers.weightedArrayElement([
            { weight: 5, value: 'Good' },
            { weight: 4, value: 'Average' },
            { weight: 2, value: 'Poor' }
          ]);
          
          const sleepHours = faker.number.float({ min: 5.5, max: 9.5, fractionDigits: 1 });
          const stressLevel = faker.number.int({ min: 1, max: 5 });
          const motivation = faker.number.int({ min: 1, max: 5 });
          const recoveryScore = faker.number.int({ min: 1, max: 5 });
          
          // Generate symptoms (mostly healthy)
          const hasSymptoms = Math.random() < 0.15; // 15% chance of symptoms
          const symptoms = hasSymptoms ? 
            faker.helpers.arrayElement(['Runny Nose', 'Sore Throat', 'Headache', 'Fatigue']) : 
            'None';
          
          // Generate injury status (mostly healthy)
          const hasInjury = Math.random() < 0.1; // 10% chance of injury
          const injuryNote = hasInjury ? 
            faker.helpers.arrayElement(['Minor soreness', 'Tight muscles', 'Slight strain', 'Previous injury area']) : 
            null;
          
          const painIntensity = hasInjury ? faker.number.int({ min: 1, max: 4 }) : 0;
          const painTrend = hasInjury ? 
            faker.helpers.arrayElement(['Better', 'Same', 'Worse']) : 
            'Better';

          // Calculate readiness score based on metrics
          const readinessScore = Math.round(
            (sleepQuality === 'Good' ? 25 : sleepQuality === 'Average' ? 15 : 5) +
            (sleepHours >= 7 ? 25 : sleepHours >= 6 ? 15 : 5) +
            (stressLevel <= 2 ? 25 : stressLevel <= 3 ? 15 : 5) +
            (motivation >= 4 ? 25 : motivation >= 3 ? 15 : 5)
          );

          try {
            await storage.createMorningDiary({
              sleepQuality,
              sleepHours,
              stressLevel,
              motivationEnergyLevel: motivation,
              recoveryFeeling: recoveryScore,
              muscleSoreness: faker.number.int({ min: 0, max: 5 }),
              symptoms,
              hasInjury,
              injuryType: injuryNote,
              painIntensity,
              painTrend,
              additionalNotes: Math.random() < 0.3 ? faker.lorem.sentence() : null
            }, athlete.id, readinessScore);
            
            totalDiaries++;
          } catch (error) {
            console.log(`⚠️ Skipped diary for athlete ${athlete.id} on ${dayString} (may already exist)`);
          }
        }

        // Training sessions - varied by day type
        const dayOfWeek = day.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isRestDay = Math.random() < (isWeekend ? 0.7 : 0.2); // More rest on weekends
        
        if (!isRestDay) {
          // Determine number of sessions (weekdays more likely to have multiple)
          const sessionCount = Math.random() < (isWeekend ? 0.2 : 0.4) ? 2 : 1;
          
          for (let sessionNum = 1; sessionNum <= sessionCount; sessionNum++) {
            // Session type distribution
            const trainingType = faker.helpers.weightedArrayElement([
              { weight: 4, value: 'Field Training' },
              { weight: 3, value: 'Gym Training' },
              { weight: 1, value: 'Recovery Training' }
            ]);

            // Realistic RPE distribution
            const effortLevel = faker.helpers.weightedArrayElement([
              { weight: 1, value: faker.number.int({ min: 1, max: 3 }) }, // Easy
              { weight: 3, value: faker.number.int({ min: 4, max: 6 }) }, // Moderate
              { weight: 4, value: faker.number.int({ min: 7, max: 8 }) }, // Hard
              { weight: 1, value: faker.number.int({ min: 9, max: 10 }) } // Very Hard
            ]);

            // Duration varies by training type
            const duration = trainingType === 'Field Training' ? 
              faker.number.int({ min: 75, max: 120 }) :
              trainingType === 'Gym Training' ?
              faker.number.int({ min: 45, max: 90 }) :
              faker.number.int({ min: 30, max: 60 }); // Recovery

            // Emotional load (mostly neutral with some variation)
            const emotionalLoad = faker.helpers.weightedArrayElement([
              { weight: 1, value: 1 }, // Very low
              { weight: 2, value: 2 }, // Low
              { weight: 5, value: 3 }, // Neutral
              { weight: 2, value: 4 }, // High
              { weight: 1, value: 5 }  // Very high
            ]);

            try {
              await storage.createTrainingEntry({
                userId: athlete.id,
                trainingType,
                date: dayString,
                effortLevel,
                duration,
                emotionalLoad,
                sessionNumber: sessionCount > 1 ? sessionNum : undefined,
                notes: Math.random() < 0.2 ? faker.lorem.sentence() : undefined
              });
              
              totalTrainingSessions++;
            } catch (error) {
              console.log(`⚠️ Skipped training for athlete ${athlete.id} on ${dayString} (may already exist)`);
            }
          }
        }
      }
    }

    console.log('✅ Demo data seeding completed successfully!');
    console.log(`📊 Created ${totalDiaries} morning diary entries`);
    console.log(`🏃 Created ${totalTrainingSessions} training sessions`);
    console.log('');
    console.log('Your charts and analytics should now show realistic historical data!');

  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    throw error;
  }
}

// Run the seeding script immediately
seedDemoData()
  .then(() => {
    console.log('🎉 Seeding script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seeding script failed:', error);
    process.exit(1);
  });

export { seedDemoData };