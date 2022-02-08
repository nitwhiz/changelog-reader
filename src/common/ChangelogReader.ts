import { remark } from 'remark';
import { Node, Parent } from 'unist';
import { Literal, Root } from 'mdast';
import { visitChildren } from 'unist-util-visit-children';
import { Processor, unified } from 'unified';
import remarkParse from 'remark-parse';
import { Release } from '../composables/useRepository';
import remarkHtml from 'remark-html';

export interface Section {
  headline: string;
  contents: Node[];
}

export default class ChangelogReader {
  private readonly releases: Release[];

  private readonly sections: Record<string, Section>;

  private currentSection: Section | null;

  constructor(releases: Release[]) {
    this.releases = releases;
    this.sections = {};
    this.currentSection = this.newSection('Uncategorized');
  }

  public parse(): string {
    let md = '';

    for (const release of this.releases) {
      md += release.body + '\n\n';
    }

    this.readTree(remark.parse(md));

    const sections = Object.values(this.sections).filter(
      (s) => Boolean(s.headline) && Boolean(s.contents.length),
    );

    let html = '';

    for (const section of sections) {
      html += `<h3>${section.headline}</h3>`;

      for (const content of section.contents) {
        html += (
          unified().use(remarkParse).use(remarkHtml) as Processor
        ).stringify(content);
      }
    }

    return html;
  }

  private closeCurrentSection(): void {
    if (this.currentSection) {
      this.sections[this.currentSection.headline] = this.currentSection;
    }

    this.currentSection = null;
  }

  private newSection(headline: string): Section {
    this.closeCurrentSection();

    this.currentSection = {
      headline,
      contents: [],
    };

    return this.currentSection;
  }

  private getSectionByNode(node: Node): Section {
    if (node.type === 'heading') {
      const name = ((node as Parent).children[0] as Literal).value as string;

      if (this.sections[name]) {
        return this.sections[name];
      }

      return this.newSection(name);
    }

    if (this.currentSection) {
      return this.currentSection;
    }

    throw new Error('ChangelogReader not initialized with a section');
  }

  private readTree(tree: Root): void {
    visitChildren((node: Node) => {
      const section = this.getSectionByNode(node);

      if (node.type !== 'heading') {
        section.contents.push(node);
      }
    })(tree);

    this.closeCurrentSection();
  }
}
