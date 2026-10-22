// The same Markdown component renders reading and print editions.
import React from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { MarkdownDoc } from "./src/v2/components/MarkdownDoc";
const input = JSON.parse(readFileSync(process.argv[2], "utf8"));
process.stdout.write(
  renderToStaticMarkup(
    <MemoryRouter initialEntries={["/doc/" + input.path]}>
      <MarkdownDoc source={input.body} printMode showCopy={false} />
    </MemoryRouter>,
  ),
);
