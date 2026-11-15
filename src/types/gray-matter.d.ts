declare module "gray-matter" {
  export interface GrayMatterOption {
    excerpt?: boolean | ((file: GrayMatterFile) => string);
    engines?: Record<string, (input: string) => unknown>;
    language?: string;
    delimiters?: string | [string, string];
  }

  export interface GrayMatterFile {
    data: Record<string, unknown>;
    content: string;
    excerpt?: string;
    orig?: string | Buffer;
    language?: string;
    matter?: string;
    stringify?: (data: Record<string, unknown>) => string;
  }

  function matter(
    input: string | Buffer | GrayMatterFile,
    options?: GrayMatterOption
  ): GrayMatterFile;

  export default matter;
}