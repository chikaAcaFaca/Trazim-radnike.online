import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ============================================
  // Seed Subscription Plans
  // ============================================
  console.log('📦 Seeding subscription plans...');

  const subscriptionPlans = [
    {
      code: 'FREE',
      name: 'Besplatno',
      description: 'Osnovna vidljivost, ograničen broj kontakata',
      priceMonthly: 0,
      priceYearly: 0,
      creditsPerMonth: 2,
      features: JSON.stringify([
        'Profil na platformi',
        '2 kontakta mesečno',
        'Osnovna vidljivost',
      ]),
      maxActiveJobs: 1,
      priorityListing: false,
      verifiedBadge: false,
      featuredProfile: false,
      isActive: true,
      isPopular: false,
      displayOrder: 1,
      colorAccent: '#6B7280',
    },
    {
      code: 'STARTER',
      name: 'Starter',
      description: 'Za majstore koji tek počinju',
      priceMonthly: 300,
      priceYearly: 3000,
      creditsPerMonth: 10,
      features: JSON.stringify([
        'Sve iz Besplatnog paketa',
        '10 kontakata mesečno',
        'Normalan ranking u pretrazi',
        'Email podrška',
      ]),
      maxActiveJobs: 5,
      priorityListing: false,
      verifiedBadge: false,
      featuredProfile: false,
      isActive: true,
      isPopular: false,
      displayOrder: 2,
      colorAccent: '#3B82F6',
    },
    {
      code: 'PRO',
      name: 'Pro',
      description: 'Za ozbiljne profesionalce',
      priceMonthly: 600,
      priceYearly: 6000,
      creditsPerMonth: 30,
      features: JSON.stringify([
        'Sve iz Starter paketa',
        '30 kontakata mesečno',
        'Prioritet u pretrazi',
        'Verifikovan badge',
        'Prioritetna podrška',
      ]),
      maxActiveJobs: 15,
      priorityListing: true,
      verifiedBadge: true,
      featuredProfile: false,
      isActive: true,
      isPopular: true,
      displayOrder: 3,
      colorAccent: '#8B5CF6',
    },
    {
      code: 'UNLIMITED',
      name: 'Unlimited',
      description: 'Neograničen pristup za velike igrače',
      priceMonthly: 1500,
      priceYearly: 15000,
      creditsPerMonth: 999,
      features: JSON.stringify([
        'Sve iz Pro paketa',
        'Neograničeni kontakti',
        'TOP pozicija u pretrazi',
        'Featured profil na naslovnoj',
        'Dedikovan account manager',
        'Analitika i statistike',
      ]),
      maxActiveJobs: null,
      priorityListing: true,
      verifiedBadge: true,
      featuredProfile: true,
      isActive: true,
      isPopular: false,
      displayOrder: 4,
      colorAccent: '#F59E0B',
    },
  ];

  for (const plan of subscriptionPlans) {
    await prisma.subscriptionPlan.upsert({
      where: { code: plan.code },
      update: plan,
      create: plan,
    });
  }
  console.log('✅ Subscription plans seeded');

  // ============================================
  // Seed Professions
  // ============================================
  console.log('👷 Seeding professions...');

  const professions = [
    // CONSTRUCTION - Građevina
    { name: 'Zidar', nameEn: 'Mason/Bricklayer', category: 'CONSTRUCTION', icon: '🧱' },
    { name: 'Keramičar', nameEn: 'Tile Setter', category: 'CONSTRUCTION', icon: '🔲' },
    { name: 'Moler', nameEn: 'Painter', category: 'CONSTRUCTION', icon: '🖌️' },
    { name: 'Fasader', nameEn: 'Facade Worker', category: 'CONSTRUCTION', icon: '🏗️' },
    { name: 'Gipsar', nameEn: 'Plasterer', category: 'CONSTRUCTION', icon: '🪣' },
    { name: 'Tesar', nameEn: 'Carpenter', category: 'CONSTRUCTION', icon: '🪚' },
    { name: 'Armirač', nameEn: 'Reinforcement Worker', category: 'CONSTRUCTION', icon: '🔩' },
    { name: 'Krovopokrivač', nameEn: 'Roofer', category: 'CONSTRUCTION', icon: '🏠' },
    { name: 'Izolater', nameEn: 'Insulation Worker', category: 'CONSTRUCTION', icon: '🧤' },
    { name: 'Pomoćni radnik', nameEn: 'Construction Helper', category: 'CONSTRUCTION', icon: '👷' },

    // HOME_SERVICES - Kućne usluge
    { name: 'Vodoinstolater', nameEn: 'Plumber', category: 'HOME_SERVICES', icon: '🔧' },
    { name: 'Električar', nameEn: 'Electrician', category: 'HOME_SERVICES', icon: '⚡' },
    { name: 'Stolar', nameEn: 'Joiner/Furniture Maker', category: 'HOME_SERVICES', icon: '🪑' },
    { name: 'Bravar', nameEn: 'Locksmith/Metalworker', category: 'HOME_SERVICES', icon: '🔐' },
    { name: 'Klima serviser', nameEn: 'HVAC Technician', category: 'HOME_SERVICES', icon: '❄️' },
    { name: 'Podopolagač', nameEn: 'Flooring Installer', category: 'HOME_SERVICES', icon: '🪵' },
    { name: 'Staklar', nameEn: 'Glazier', category: 'HOME_SERVICES', icon: '🪟' },
    { name: 'Roletnar', nameEn: 'Blinds/Shutters Installer', category: 'HOME_SERVICES', icon: '🚪' },

    // AUTOMOTIVE - Auto
    { name: 'Auto mehaničar', nameEn: 'Auto Mechanic', category: 'AUTOMOTIVE', icon: '🔧' },
    { name: 'Auto električar', nameEn: 'Auto Electrician', category: 'AUTOMOTIVE', icon: '🔌' },
    { name: 'Auto limar', nameEn: 'Auto Body Repair', category: 'AUTOMOTIVE', icon: '🚗' },
    { name: 'Auto lakirer', nameEn: 'Auto Painter', category: 'AUTOMOTIVE', icon: '🎨' },
    { name: 'Vulkanizer', nameEn: 'Tire Technician', category: 'AUTOMOTIVE', icon: '🛞' },

    // CLEANING - Čišćenje
    { name: 'Čistač/Spremačica', nameEn: 'Cleaner', category: 'CLEANING', icon: '🧹' },
    { name: 'Perač prozora', nameEn: 'Window Cleaner', category: 'CLEANING', icon: '🪟' },
    { name: 'Čišćenje bazena', nameEn: 'Pool Cleaner', category: 'CLEANING', icon: '🏊' },

    // GARDEN - Baštovanstvo
    { name: 'Baštovan', nameEn: 'Gardener', category: 'GARDEN', icon: '🌱' },
    { name: 'Košenje trave', nameEn: 'Lawn Mowing', category: 'GARDEN', icon: '🌿' },
    { name: 'Orezivanje drveća', nameEn: 'Tree Trimming', category: 'GARDEN', icon: '🌳' },

    // TRANSPORT - Transport
    { name: 'Vozač', nameEn: 'Driver', category: 'TRANSPORT', icon: '🚛' },
    { name: 'Selidbe', nameEn: 'Moving Services', category: 'TRANSPORT', icon: '📦' },
    { name: 'Dostava', nameEn: 'Delivery', category: 'TRANSPORT', icon: '🚚' },

    // OTHER - Ostalo
    { name: 'Majstor za sve', nameEn: 'Handyman', category: 'OTHER', icon: '🛠️' },
    { name: 'Monter nameštaja', nameEn: 'Furniture Assembly', category: 'OTHER', icon: '🪛' },
    { name: 'IT podrška', nameEn: 'IT Support', category: 'OTHER', icon: '💻' },
  ];

  for (const prof of professions) {
    await prisma.profession.upsert({
      where: { name: prof.name },
      update: prof,
      create: prof,
    });
  }
  console.log('✅ Professions seeded');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@trazim-radnike.online' },
    update: {},
    create: {
      email: 'admin@trazim-radnike.online',
      phone: '+381601234567',
      phoneVerified: true,
      emailVerified: true,
      passwordHash: adminPassword,
      role: 'ADMIN',
      gdprConsent: true,
      gdprConsentAt: new Date(),
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create test employer
  const employerPassword = await bcrypt.hash('test123', 12);
  const employer = await prisma.user.upsert({
    where: { email: 'poslodavac@test.com' },
    update: {},
    create: {
      email: 'poslodavac@test.com',
      phone: '+381607654321',
      phoneVerified: true,
      emailVerified: true,
      passwordHash: employerPassword,
      role: 'EMPLOYER',
      gdprConsent: true,
      gdprConsentAt: new Date(),
      company: {
        create: {
          name: 'Test Gradnja d.o.o.',
          country: 'RS',
          city: 'Beograd',
          industry: 'Građevinarstvo',
          description: 'Kompanija za građevinske radove sa 20 godina iskustva.',
        },
      },
    },
    include: { company: true },
  });
  console.log('✅ Test employer created:', employer.email);

  // Create sample job
  if (employer.company) {
    const job = await prisma.job.upsert({
      where: { slug: 'zidari-beograd-2024' },
      update: {},
      create: {
        companyId: employer.company.id,
        title: 'Zidari - gradilište Beograd',
        slug: 'zidari-beograd-2024',
        descriptionFull: `Tražimo 5 iskusnih zidara za rad na gradilištu u Beogradu.

**Uslovi:**
- Radno iskustvo minimum 3 godine
- Poznavanje rada sa ciglom i betonom
- Spremnost za timski rad

**Nudimo:**
- Plata: 900-1200 EUR mesečno
- Besplatan smeštaj
- Redovna isplata
- Mogućnost prekovremenog rada

**Radno vreme:**
- Ponedeljak - Petak: 07:00 - 16:00
- Subota: 07:00 - 13:00 (opciono)`,
        descriptionPublic:
          'Tražimo zidare za rad u Beogradu. Nudimo konkurentnu platu i smeštaj.',
        salary: '900-1200 EUR',
        salaryMin: 900,
        salaryMax: 1200,
        salaryCurrency: 'EUR',
        numWorkers: 5,
        location: 'Beograd, Srbija',
        locationCity: 'Beograd',
        locationCountry: 'RS',
        workHours: 'Pun radno vreme, 07:00-16:00',
        housing: true,
        housingDesc: 'Besplatan smeštaj u kontejnerima na gradilištu. Kupatilo i kuhinja.',
        experience: 'Minimum 3 godine iskustva u zidarskim radovima',
        languages: JSON.stringify(['Srpski', 'Engleski (osnovno)']),
        requirements: 'Fizička spremnost, tačnost, pouzdanost',
        benefits: 'Besplatan smeštaj, redovna isplata, mogućnost prekovremenog rada',
        urgency: 'HIGH',
        status: 'POSTED',
        visibility: 'PRIVATE',
        postedAt: new Date(),
      },
    });
    console.log('✅ Sample job created:', job.title);
  }

  // ============================================
  // Seed Site Settings - Beta Period Configuration
  // ============================================
  console.log('⚙️ Seeding site settings...');

  const siteSettings = [
    {
      key: 'BETA_MODE',
      value: 'true',
      description: 'Enable beta mode - all features free while platform builds up',
    },
    {
      key: 'FREE_TIER_CREDITS',
      value: '6', // Beta: 6 credits, Production: 2
      description: 'Monthly free credits for FREE tier users (beta: 6, production: 2)',
    },
    {
      key: 'BETA_FREE_MATCHING',
      value: 'true',
      description: 'All contact reveals are free during beta period',
    },
    {
      key: 'MIN_WORKERS_FOR_PRODUCTION',
      value: '100',
      description: 'Minimum worker profiles needed to exit beta mode',
    },
    {
      key: 'CONTACT_REVEAL_PRICE',
      value: '30',
      description: 'Price in RSD for contact reveal (when not in beta)',
    },
    {
      key: 'PRIORITY_LISTING_PRICE',
      value: '150',
      description: 'Price in RSD for priority listing',
    },
    {
      key: 'URGENT_LISTING_PRICE',
      value: '300',
      description: 'Price in RSD for urgent listing',
    },
  ];

  for (const setting of siteSettings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value, description: setting.description },
      create: setting,
    });
  }
  console.log('✅ Site settings seeded');

  // Update FREE plan for beta period (6 credits instead of 2)
  await prisma.subscriptionPlan.update({
    where: { code: 'FREE' },
    data: {
      creditsPerMonth: 6, // Beta period: 6 free matches
      description: 'Besplatno - 6 kontakata mesečno (beta period)',
      features: JSON.stringify([
        'Profil na platformi',
        '6 kontakata mesečno (beta)',
        'Osnovna vidljivost',
        'Besplatno tokom beta perioda!',
      ]),
    },
  });
  console.log('✅ FREE plan updated for beta period');

  console.log('🎉 Database seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
