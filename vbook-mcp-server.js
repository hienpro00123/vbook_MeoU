#!/usr/bin/env node

/**
 * VBook MCP Server
 * 
 * Allows AI agents (like Claude/Antigravity) to call VBook CLI tools directly
 * via the Model Context Protocol.
 */

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");
const { execSync } = require("child_process");
const path = require("path");

const server = new Server(
  {
    name: "vbook-tool-server",
    version: "3.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const TOOLS = [
  {
    name: "vbook_build_catalog",
    description: "Rebuild the extension catalog (mandatory after adding/editing extensions)",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "vbook_build_extension",
    description: "Build an extension to plugin.zip",
    inputSchema: {
      type: "object",
      properties: {
        pluginPath: { type: "string", description: "Path to extension folder" },
      },
      required: ["pluginPath"],
    },
  },
  {
    name: "vbook_verify",
    description: "Perform a full project consistency check (catalog sync + ZIP integrity)",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "vbook_validate",
    description: "Check an extension for Rhino compatibility and VBook API patterns",
    inputSchema: {
      type: "object",
      properties: {
        pluginPath: { type: "string", description: "Path to extension folder (e.g., extensions/novel/my_ext)" },
      },
      required: ["pluginPath"],
    },
  },
  {
    name: "vbook_analyze",
    description: "Analyze a URL to suggest CSS selectors and VBook code snippets",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "The URL of the website to analyze" },
      },
      required: ["url"],
    },
  },
  {
    name: "vbook_check_env",
    description: "Verify the development environment and .env configuration",
    inputSchema: {
      type: "object",
      properties: {},
    },
  }
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "vbook_build_catalog": {
        const output = execSync(`node ${path.join(__dirname, 'tools/cli/index.js')} build-catalog --json`).toString();
        return { content: [{ type: "text", text: output }] };
      }
      case "vbook_build_extension": {
        const output = execSync(`node ${path.join(__dirname, 'tools/cli/index.js')} build --plugin ${args.pluginPath} --json`).toString();
        return { content: [{ type: "text", text: output }] };
      }
      case "vbook_verify": {
        const output = execSync(`node ${path.join(__dirname, 'tools/cli/index.js')} verify --json`).toString();
        return { content: [{ type: "text", text: output }] };
      }
      case "vbook_validate": {
        const output = execSync(`node ${path.join(__dirname, 'tools/cli/index.js')} validate --plugin ${args.pluginPath} --json`).toString();
        return { content: [{ type: "text", text: output }] };
      }
      case "vbook_analyze": {
        const output = execSync(`node ${path.join(__dirname, 'tools/cli/index.js')} analyze ${args.url} --json`).toString();
        return { content: [{ type: "text", text: output }] };
      }
      case "vbook_check_env": {
        const output = execSync(`node ${path.join(__dirname, 'tools/cli/index.js')} check-env --json`).toString();
        return { content: [{ type: "text", text: output }] };
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("VBook MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
