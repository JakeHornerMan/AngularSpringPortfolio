import { Content } from './models/models';

// One content block to render, or (with `gallery`) a run of screenshots laid out together in a grid,
// headed by `content`, the run's first image.
export interface ContentBlock {
  content: Content;
  gallery?: Content[];
}

// Two or more images in a row with no text of their own (a screenshot dump) become one gallery,
// titled by the first one. An image with a paragraph keeps its own row, beside its text.
export function groupContent(list: Content[]): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  let run: Content[] = [];
  const flush = () => {
    if (run.length > 1) blocks.push({ content: run[0], gallery: run });
    else run.forEach(content => blocks.push({ content }));
    run = [];
  };
  for (const content of list) {
    const bareImage = content.contentType == 'image' && !content.contentParagraph;
    // A titled image starts a new gallery, so two titled dumps in a row stay apart.
    if (!bareImage || (run.length && content.contentTitle)) flush();
    if (bareImage) run.push(content);
    else blocks.push({ content });
  }
  flush();
  return blocks;
}
