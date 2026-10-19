// Copies Jake's ArtStation posts into the content file as `artworks`, one small window per post on the art page.
// ArtStation can't be called from the site itself (its JSON API sits behind a Cloudflare challenge and the RSS
// feed sends no CORS headers), so run this after posting new art: `npm run sync:art`.
const fs = require('fs');
const path = require('path');

const FEED = 'https://www.artstation.com/jakehornerman.rss';
const CONTENT = path.join(__dirname, '../../PersonalPortfolio/src/main/resources/static/jakedev-content.json');

const tag = (xml, name) => (xml.match(new RegExp(`<${name}>\\s*(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?\\s*</${name}>`)) || [])[1] || '';
const youTubeId = url => (url.match(/youtube(?:-nocookie)?\.com\/embed\/([\w-]{11})/) || [])[1];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "Wed, 11 May 2022 20:45:49 -0500" → "2022-05-11", the day as posted (converting to UTC can shift it).
function postedOn(pubDate) {
  const [, day, month, year] = pubDate.match(/(\d{1,2}) (\w{3}) (\d{4})/);
  return `${year}-${String(MONTHS.indexOf(month) + 1).padStart(2, '0')}-${day.padStart(2, '0')}`;
}

// A Sketchfab model's preview image, from its oEmbed.
async function sketchfabThumbnail(embedUrl) {
  const res = await fetch(`https://sketchfab.com/oembed?url=${encodeURIComponent(embedUrl.replace(/\/embed$/, ''))}`);
  return res.ok ? (await res.json()).thumbnail_url || '' : '';
}

async function toArtwork(item, index) {
  const html = tag(item, 'content:encoded');
  const link = tag(item, 'link');
  const date = postedOn(tag(item, 'pubDate'));
  // Images and embeds (YouTube, Sketchfab) in the order the post shows them.
  const media = Array.from(html.matchAll(/<(img|iframe)\b[^>]*?\ssrc="([^"]+)"/g), ([, kind, src]) => ({ kind, src }));
  const firstImage = media.find(m => m.kind === 'img');
  const firstVideo = media.map(m => youTubeId(m.src)).find(id => id);
  const firstModel = media.find(m => m.src.includes('sketchfab.com/models/'));
  const contentList = media.map((m, i) => ({
    id: -(index + 1) * 100 - i,
    contentType: m.kind === 'img' ? 'image' : 'video',
    contentTitle: '',
    contentParagraph: '',
    contentUrl: m.kind === 'img' ? m.src : m.src.replace(/\?feature=oembed$/, ''),
    position: i + 1,
  }));
  contentList.push({ id: -(index + 1) * 100 - media.length, contentType: 'link', contentTitle: 'View on ArtStation', contentParagraph: '', contentUrl: link, position: media.length + 1 });
  return {
    id: -(index + 1),
    projectName: tag(item, 'title').replace(/ by Jake Horner$/, ''),
    startDate: date,
    endDate: null,
    mainPoints: '',
    projectDescription: '',
    tldr: '',
    projectImageUrl: firstImage ? firstImage.src.replace('/large/', '/smaller_square/')
      : firstVideo ? `https://i.ytimg.com/vi/${firstVideo}/hqdefault.jpg`
      : firstModel ? await sketchfabThumbnail(firstModel.src) : '',
    linkedInterests: '2',
    staredProject: false,
    artstationUrl: link,
    contentList,
  };
}

async function main() {
  const res = await fetch(FEED, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`${FEED} answered ${res.status}`);
  const items = (await res.text()).split('<item>').slice(1).map(item => item.split('</item>')[0]);
  const artworks = await Promise.all(items.map(toArtwork));
  const content = JSON.parse(fs.readFileSync(CONTENT, 'utf8'));
  content.artworks = artworks;
  // The file is one-space indented with no trailing newline; keep it that way so only `artworks` changes.
  fs.writeFileSync(CONTENT, JSON.stringify(content, null, 1));
  console.log(`Wrote ${artworks.length} ArtStation posts to ${path.relative(process.cwd(), CONTENT)}`);
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
