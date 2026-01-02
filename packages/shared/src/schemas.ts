import { z } from 'zod';
import { CONTENT_TYPES, TOPICS } from './types.js';

/**
 * Content type enum for Zod schema
 */
export const contentTypeEnum = z.enum(CONTENT_TYPES);

/**
 * Topic enum for Zod schema
 */
export const topicEnum = z.enum(TOPICS);

/**
 * Schema for a single story's LLM-generated enrichment
 * Used with Vercel AI SDK's structured output
 */
export const storyEnrichmentSchema = z.object({
  id: z.number().describe('The HN story ID'),
  content_type: contentTypeEnum.describe(
    "Content type. Use 'show-hn'/'ask-hn' ONLY if title starts with 'Show HN:'/'Ask HN:'. Use 'article' for blog posts, 'paper' for academic/research work, 'news' for current events, 'tutorial' for how-to guides, 'launch' for product announcements, 'discussion' for meta/community posts, 'job' for job postings, 'repository' for links to code repositories, 'media' for videos/podcasts/presentations. Use 'other' as a last resort."
  ),
  topic: topicEnum.describe(
    "PRIMARY topic - pick ONE that best fits. ai-ml=AI/ML/LLMs/neural networks, web-dev=frontend/backend/fullstack, mobile-dev=iOS/Android, design-ux=UI/UX/design systems, systems=OS/kernels/low-level, databases=SQL/NoSQL/storage, devops=CI/CD/cloud/containers, security=infosec/hacking/privacy, networking=protocols/distributed, languages=PLT/compilers, gaming=gamedev/graphics, hardware=electronics/embedded/IoT, robotics=automation/drones, data-science=analytics/stats, math=algorithms/theory, science=physics/bio/chem, startups=founding/fundraising, big-tech=FAANG/enterprise, career=jobs/interviews/workplace, open-source=OSS/community, culture=history/ethics, productivity=tools/workflows, finance=fintech/crypto/trading, policy=regulation/law/politics, media=social/journalism. Use 'other' ONLY as last resort."
  ),
  technologies: z
    .array(z.string())
    .describe(
      'Specific technologies directly discussed (0-10). Languages: python, rust, go, javascript, typescript, java, c, cpp, csharp, php, zig, ruby, swift, kotlin, scala, haskell, elixir. Frameworks: react, vue, angular, svelte, django, rails, nextjs, fastapi, spring, flask, node, net. Tools: postgres, mysql, sqlite, mongodb, redis, kubernetes, docker, aws, gcp, azure, vercel, nginx, git, terraform, ansible, linux. Use lowercase, no versions. Empty array if not tech-specific.'
    ),
  tags: z
    .array(z.string())
    .min(0)
    .max(10)
    .describe(
      'Free-form descriptive tags (0-10). Examples: beginner-friendly, deep-dive, controversial, retrospective, opinion, rant, benchmarks, comparison, announcement, self-hosted, cli, gui, performance, scaling, debugging, architecture, best-practices, anti-patterns, history, interview, salary, remote-work, layoffs, acquisition, ipo, funding, pivot, open-source, privacy, minimalist, enterprise, side-project, weekend-project, visualization, tooling, dx, testing, refactoring, post-mortem, case-study, security-vulnerability, new-release, ama, book-review, satire, nostalgia, yc, bootstrapped, burnout, accessibility, gamedev'
    ),
  is_technical: z
    .number()
    .min(0)
    .max(1)
    .describe(
      'Technical score from 0.0 to 1.0. 1.0: Purely technical content like code deep-dives, algorithmic analysis, performance benchmarks, or compiler design. 0.7: Mostly technical, like a tutorial with code, a new library announcement with examples, or a system architecture overview. 0.5: Tech-adjacent, such as product launches, engineering management discussions, or market analysis of the tech industry. 0.3: Tangentially tech-related, like founder stories, high-level tech ethics debates, or news about VC funding. 0.0: Non-technical content like general politics, human interest stories, or online drama.'
    ),
});

/**
 * Schema for batch LLM response
 * Returns an array of story enrichment results
 */
export const batchEnrichmentSchema = z.object({
  stories: z.array(storyEnrichmentSchema).describe('Array of enriched story results'),
});

export type StoryEnrichment = z.infer<typeof storyEnrichmentSchema>;
export type BatchEnrichment = z.infer<typeof batchEnrichmentSchema>;
