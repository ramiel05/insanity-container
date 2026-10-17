export default {
  meta: { name: "workspace" },
  rules: {
    "no-restricted-query-imports": {
      meta: {
        docs: "Ban runtime imports of the query library outside the sanctioned workspace lib files.",
      },
      create(context) {
        return {
          ImportDeclaration(node) {
            const source = typeof node.source.value === "string" ? node.source.value : "";
            if (source === "@tanstack/react-query" || source.startsWith("@tanstack/react-query/")) {
              context.report({
                node: node.source,
                message:
                  "Define mutations in the sanctioned workspace lib files (apps/web/src/lib/workspace-mutations.ts or apps/web/src/lib/workspace.ts) so the single-flight guard applies; consumers read state from the workspace context. See docs/adr/0011-single-flight-mutation-guard.md.",
              });
            }
          },
        };
      },
    },
  },
};
