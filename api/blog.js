const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');

function getAllPosts() {
  if (!fs.existsSync(BLOG_DIR)) return [];
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
  return files
    .map(file => {
      const raw = fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8');
      const { data, content } = matter(raw);
      const readingTime = Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 200));
      return { ...data, readingTime };
    })
    .filter(p => p.published !== false)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getPostBySlug(slug) {
  const filePath = path.join(BLOG_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);
  if (data.published === false) return null;
  const htmlContent = marked.parse(content);
  const readingTime = Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 200));
  return { ...data, content, htmlContent, readingTime };
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // ── GET: list all posts OR single post by slug ─────────────────────────────
  if (req.method === 'GET') {
    const { slug } = req.query;
    if (slug) {
      const post = getPostBySlug(slug);
      if (!post) return res.status(404).json({ error: 'Post not found' });
      return res.status(200).json(post);
    }
    return res.status(200).json(getAllPosts());
  }

  // ── POST: create a new blog post ───────────────────────────────────────────
  if (req.method === 'POST') {
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.BLOG_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      title, slug, description, date, category,
      author, image, imageAlt, tags, content, published = true
    } = req.body;

    if (!title || !slug || !description || !date || !category || !content) {
      return res.status(400).json({
        error: 'Missing required fields: title, slug, description, date, category, content'
      });
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      return res.status(400).json({
        error: 'Invalid slug — use lowercase letters, numbers, and hyphens only'
      });
    }

    if (!fs.existsSync(BLOG_DIR)) fs.mkdirSync(BLOG_DIR, { recursive: true });

    const filePath = path.join(BLOG_DIR, `${slug}.md`);
    if (fs.existsSync(filePath)) {
      return res.status(409).json({ error: 'A post with this slug already exists' });
    }

    const frontmatter = [
      '---',
      `title: "${title}"`,
      `slug: "${slug}"`,
      `description: "${description}"`,
      `date: "${date}"`,
      `category: "${category}"`,
      `author: "${author || 'JoeLuT AI'}"`,
      `image: "${image || '/images/og-cover.png'}"`,
      `imageAlt: "${imageAlt || title}"`,
      `tags: [${(tags || []).map(t => `"${t}"`).join(', ')}]`,
      `published: ${published}`,
      '---',
    ].join('\n');

    fs.writeFileSync(filePath, `${frontmatter}\n\n${content}`, 'utf-8');
    return res.status(201).json({ success: true, slug, message: 'Blog post created' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
