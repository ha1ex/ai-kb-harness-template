/** Convert citation markers only in prose text nodes; code and existing links stay literal. */
type MarkdownNode = {
  type: string;
  value?: string;
  url?: string;
  children?: MarkdownNode[];
};
export function remarkSourceLinks() {
  return (tree: MarkdownNode) => {
    function visit(parent: MarkdownNode) {
      if (
        !parent.children ||
        ["code", "inlineCode", "link", "linkReference"].includes(parent.type)
      )
        return;
      parent.children = parent.children.flatMap((node) => {
        if (node.type !== "text" || !node.value) {
          visit(node);
          return [node];
        }
        const output: MarkdownNode[] = [];
        const pattern = /\[source:\s*([^\]\s]+)\]/g;
        let offset = 0;
        for (const match of node.value.matchAll(pattern)) {
          const index = match.index!;
          if (index > offset)
            output.push({
              type: "text",
              value: node.value.slice(offset, index),
            });
          output.push({
            type: "link",
            url: match[1],
            children: [{ type: "text", value: "Источник" }],
          });
          offset = index + match[0].length;
        }
        if (offset < node.value.length)
          output.push({ type: "text", value: node.value.slice(offset) });
        return output;
      });
    }
    visit(tree);
  };
}
