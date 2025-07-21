import { db } from './db';
import { scrapedJobs, jobPlaylists, playlistJobs } from '@shared/schema';

interface ScrapedJobData {
  title: string;
  company: string;
  description?: string;
  location?: string;
  workMode?: string;
  jobType?: string;
  experienceLevel?: string;
  salaryRange?: string;
  skills?: string[];
  sourceUrl: string;
  sourcePlatform: string;
  externalId?: string;
  category?: string;
  subcategory?: string;
  tags?: string[];
}

class JobScrapingService {
  
  async scrapeJobs(): Promise<void> {
    console.log('[JOB_SCRAPER] Starting job scraping...');
    
    // Sample scraped jobs for demo - in production this would use real scrapers
    const sampleJobs: ScrapedJobData[] = [
      {
        title: "Senior Frontend Developer",
        company: "TechCorp",
        description: "Build amazing user experiences with React and TypeScript. Remote-first company with great benefits.",
        location: "San Francisco, CA (Remote)",
        workMode: "remote",
        jobType: "full-time",
        experienceLevel: "senior",
        salaryRange: "$120,000 - $180,000",
        skills: ["React", "TypeScript", "JavaScript", "CSS", "HTML"],
        sourceUrl: "https://example.com/jobs/1",
        sourcePlatform: "linkedin",
        externalId: "li_123456",
        category: "tech",
        subcategory: "frontend",
        tags: ["remote-first", "startup", "equity"]
      },
      {
        title: "AI/ML Engineer",
        company: "DataScience Inc",
        description: "Work on cutting-edge machine learning models and AI applications. Join our growing AI team.",
        location: "New York, NY",
        workMode: "hybrid",
        jobType: "full-time",
        experienceLevel: "mid",
        salaryRange: "$140,000 - $200,000",
        skills: ["Python", "TensorFlow", "PyTorch", "Machine Learning", "AI"],
        sourceUrl: "https://example.com/jobs/2",
        sourcePlatform: "indeed",
        externalId: "indeed_789",
        category: "tech",
        subcategory: "ai-ml",
        tags: ["ai", "cutting-edge", "growth"]
      },
      {
        title: "Product Designer",
        company: "DesignFirst",
        description: "Create beautiful and intuitive designs for our SaaS platform. Work with cross-functional teams.",
        location: "Los Angeles, CA",
        workMode: "onsite",
        jobType: "full-time",
        experienceLevel: "mid",
        salaryRange: "$90,000 - $130,000",
        skills: ["Figma", "UI/UX Design", "Prototyping", "Design Systems"],
        sourceUrl: "https://example.com/jobs/3",
        sourcePlatform: "glassdoor",
        externalId: "gd_456",
        category: "design",
        subcategory: "product-design",
        tags: ["saas", "cross-functional", "design-systems"]
      },
      {
        title: "DevOps Engineer",
        company: "CloudTech Solutions",
        description: "Manage our cloud infrastructure and CI/CD pipelines. Experience with AWS and Kubernetes required.",
        location: "Austin, TX (Remote)",
        workMode: "remote",
        jobType: "full-time",
        experienceLevel: "senior",
        salaryRange: "$130,000 - $170,000",
        skills: ["AWS", "Kubernetes", "Docker", "CI/CD", "Terraform"],
        sourceUrl: "https://example.com/jobs/4",
        sourcePlatform: "linkedin",
        externalId: "li_789012",
        category: "tech",
        subcategory: "devops",
        tags: ["cloud", "remote", "aws"]
      },
      {
        title: "Marketing Manager",
        company: "GrowthCo",
        description: "Lead our digital marketing efforts and drive user acquisition. Experience with B2B SaaS preferred.",
        location: "Boston, MA",
        workMode: "hybrid",
        jobType: "full-time",
        experienceLevel: "mid",
        salaryRange: "$80,000 - $120,000",
        skills: ["Digital Marketing", "SEM", "SEO", "Analytics", "Content Marketing"],
        sourceUrl: "https://example.com/jobs/5",
        sourcePlatform: "indeed",
        externalId: "indeed_345",
        category: "marketing",
        subcategory: "digital-marketing",
        tags: ["b2b", "saas", "growth"]
      }
    ];

    // Insert scraped jobs
    for (const jobData of sampleJobs) {
      try {
        const [job] = await db.insert(scrapedJobs).values({
          ...jobData,
          lastScraped: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }).onConflictDoNothing().returning();
        
        if (job) {
          console.log(`[JOB_SCRAPER] Added job: ${jobData.title} at ${jobData.company}`);
        }
      } catch (error) {
        console.error(`[JOB_SCRAPER] Failed to add job: ${jobData.title}`, error);
      }
    }

    // Create sample playlists
    await this.createSamplePlaylists();
  }

  async createSamplePlaylists(): Promise<void> {
    const playlists = [
      {
        name: "🚀 Remote Tech Jobs",
        description: "The best remote opportunities in technology",
        category: "tech",
        autoFilters: { workMode: ["remote"], category: ["tech"] }
      },
      {
        name: "🎨 Design Opportunities",
        description: "Creative roles in UI/UX and product design",
        category: "design",
        autoFilters: { category: ["design"] }
      },
      {
        name: "🤖 AI & Machine Learning",
        description: "Cutting-edge roles in artificial intelligence",
        category: "tech",
        autoFilters: { subcategory: ["ai-ml"], skills: ["Python", "TensorFlow", "Machine Learning"] }
      },
      {
        name: "📈 Marketing & Growth",
        description: "Drive growth and reach new audiences",
        category: "marketing",
        autoFilters: { category: ["marketing"] }
      },
      {
        name: "🔧 DevOps & Infrastructure",
        description: "Build and scale cloud infrastructure",
        category: "tech",
        autoFilters: { subcategory: ["devops"], skills: ["AWS", "Kubernetes", "Docker"] }
      }
    ];

    for (const playlistData of playlists) {
      try {
        const [playlist] = await db.insert(jobPlaylists).values({
          ...playlistData,
          isSystemGenerated: true,
          isFeatured: true
        }).onConflictDoNothing().returning();

        if (playlist) {
          // Add matching jobs to playlist
          await this.populatePlaylist(playlist.id, playlistData.autoFilters);
          console.log(`[JOB_SCRAPER] Created playlist: ${playlistData.name}`);
        }
      } catch (error) {
        console.error(`[JOB_SCRAPER] Failed to create playlist: ${playlistData.name}`, error);
      }
    }
  }

  async populatePlaylist(playlistId: number, filters: any): Promise<void> {
    try {
      // Get jobs that match the filters
      const matchingJobs = await db.select().from(scrapedJobs).where(
        // Simple filter logic - in production this would be more sophisticated
        filters.category ? 
          db.sql`category = ANY(${filters.category})` : 
          db.sql`true`
      ).limit(20);

      // Add jobs to playlist
      for (const [index, job] of matchingJobs.entries()) {
        await db.insert(playlistJobs).values({
          playlistId,
          scrapedJobId: job.id,
          order: index
        }).onConflictDoNothing();
      }

      // Update job count
      await db.update(jobPlaylists).set({
        jobsCount: matchingJobs.length
      }).where(db.sql`id = ${playlistId}`);

    } catch (error) {
      console.error(`[JOB_SCRAPER] Failed to populate playlist ${playlistId}:`, error);
    }
  }

  async getPlaylistJobs(playlistId: number, limit: number = 20): Promise<any[]> {
    try {
      const jobs = await db.select({
        id: scrapedJobs.id,
        title: scrapedJobs.title,
        company: scrapedJobs.company,
        description: scrapedJobs.description,
        location: scrapedJobs.location,
        workMode: scrapedJobs.workMode,
        jobType: scrapedJobs.jobType,
        experienceLevel: scrapedJobs.experienceLevel,
        salaryRange: scrapedJobs.salaryRange,
        skills: scrapedJobs.skills,
        sourceUrl: scrapedJobs.sourceUrl,
        sourcePlatform: scrapedJobs.sourcePlatform,
        category: scrapedJobs.category,
        subcategory: scrapedJobs.subcategory,
        tags: scrapedJobs.tags,
        createdAt: scrapedJobs.createdAt,
        order: playlistJobs.order
      })
      .from(playlistJobs)
      .innerJoin(scrapedJobs, db.sql`${playlistJobs.scrapedJobId} = ${scrapedJobs.id}`)
      .where(db.sql`${playlistJobs.playlistId} = ${playlistId}`)
      .orderBy(playlistJobs.order)
      .limit(limit);

      return jobs;
    } catch (error) {
      console.error(`[JOB_SCRAPER] Failed to get playlist jobs:`, error);
      return [];
    }
  }
}

export const jobScrapingService = new JobScrapingService();