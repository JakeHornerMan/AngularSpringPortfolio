// Copies Jake's latest 20 Instagram posts into the content file as `instagram`, shown with the ArtStation posts
// on the art page. Instagram can't be scraped, so this uses the official Instagram API (Instagram Login) with a
// long-lived token in `IG_TOKEN` (env var, or `IG_TOKEN=...` in the git-ignored `.env.local`).
// Instagram media links are signed and expire after a few days, so a daily GitHub Action runs this
// (.github/workflows/sync-instagram.yml). Locally: `npm run sync:insta`.
const fs = require('fs');
const path = require('path');

const API = 'https://graph.instagram.com';
const CONTENT = path.join(__dirname, '../../PersonalPortfolio/src/main/resources/static/jakedev-content.json');
const ENV_FILE = path.join(__dirname, '../.env.local');
const COUNT = 20;

function token() {
  if (process.env.IG_TOKEN) return process.env.IG_TOKEN.trim();
  if (fs.existsSync(ENV_FILE)) {
    const line = fs.readFileSync(ENV_FILE, 'utf8').split(/\r?\n/).find(l => l.startsWith('IG_TOKEN='));
    if (line) return line.slice('IG_TOKEN='.length).trim();
  }
  throw new Error('No IG_TOKEN: set the env var or put IG_TOKEN=... in PersonalPortfolioApp/.env.local');
}

async function get(url) {
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok) throw new Error(`Instagram answered ${res.status}: ${body.error?.message ?? JSON.stringify(body)}`);
  return body;
}

// The first line of the caption, without hashtags, as the window title.
function title(caption) {
  const line = (caption || '').split('\n')[0].replace(/#\S+/g, '').trim();
  if (!line) return 'Instagram post';
  return line.length > 60 ? line.slice(0, 57).trimEnd() + '…' : line;
}

function toPost(post, index) {
  const id = -1000 - index;
  const media = post.media_type === 'CAROUSEL_ALBUM' ? post.children?.data ?? [] : [post];
  const contentList = media.map((m, i) => ({
    id: id * 100 - i,
    contentType: m.media_type === 'VIDEO' ? 'video' : 'image',
    contentTitle: '',
    contentParagraph: '',
    contentUrl: m.media_url,
    position: i + 1,
  }));
  contentList.push({ id: id * 100 - media.length, contentType: 'link', contentTitle: 'View on Instagram', contentParagraph: '', contentUrl: post.permalink, position: media.length + 1 });
  const cover = media[0] ?? post;
  return {
    id,
    projectName: title(post.caption),
    startDate: post.timestamp.slice(0, 10),
    endDate: null,
    mainPoints: '',
    projectDescription: '',
    tldr: '',
    projectImageUrl: post.thumbnail_url || cover.thumbnail_url || (cover.media_type === 'VIDEO' ? '' : cover.media_url) || '',
    linkedInterests: '2',
    staredProject: false,
    instagramUrl: post.permalink,
    contentList,
  };
}

async function main() {
  const accessToken = encodeURIComponent(token());
  // Extends the token's 60-day life on every run; the token itself doesn't change.
  await get(`${API}/refresh_access_token?grant_type=ig_refresh_token&access_token=${accessToken}`).catch(err => console.warn(`Token not refreshed: ${err.message}`));
  const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,children{media_type,media_url,thumbnail_url}';
  const { data } = await get(`${API}/me/media?fields=${encodeURIComponent(fields)}&limit=${COUNT}&access_token=${accessToken}`);
  const instagram = data.slice(0, COUNT).map(toPost);
  const content = JSON.parse(fs.readFileSync(CONTENT, 'utf8'));
  content.instagram = instagram;
  // The file is one-space indented with no trailing newline; keep it that way so only `instagram` changes.
  fs.writeFileSync(CONTENT, JSON.stringify(content, null, 1));
  console.log(`Wrote ${instagram.length} Instagram posts to ${path.relative(process.cwd(), CONTENT)}`);
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
