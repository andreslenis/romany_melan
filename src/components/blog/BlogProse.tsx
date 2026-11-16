import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { slugifyHeading } from "@/lib/slug";

interface BlogProseProps {
  content: string;
  fallbackAlt?: string;
}

function textoDeHijos(children: ReactNode): string {
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(textoDeHijos).join("");
  if (children && typeof children === "object" && "props" in children) {
    const conProps = children as { props?: { children?: ReactNode } };
    return textoDeHijos(conProps.props?.children);
  }
  return "";
}

const componentes: Components = {
  h2: (props) => {
    const { node, children, ...resto } = props;
    void node;
    return (
      <h2 id={slugifyHeading(textoDeHijos(children))} {...resto}>
        {children}
      </h2>
    );
  },
  h3: (props) => {
    const { node, children, ...resto } = props;
    void node;
    return (
      <h3 id={slugifyHeading(textoDeHijos(children))} {...resto}>
        {children}
      </h3>
    );
  },
  a: (props) => {
    const { node, href, children, ...resto } = props;
    void node;
    const url = href || "";
    const esExterno = /^https?:\/\//i.test(url);
    return (
      <a
        href={url}
        {...(esExterno ? { target: "_blank", rel: "noreferrer" } : {})}
        {...resto}
      >
        {children}
      </a>
    );
  },
};

export default function BlogProse({ content, fallbackAlt }: BlogProseProps) {
  return (
    <div className="blog-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          ...componentes,
          img: (props) => {
            const { node, alt, src, ...resto } = props;
            void node;
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt={alt || fallbackAlt || ""} {...resto} />
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}