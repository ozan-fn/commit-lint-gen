import { defineConfig } from "@rslib/core";

export default defineConfig({
    lib: [
        {
            format: "esm",
            bundle: true,
            dts: true,
            source: {
                entry: {
                    cli: "./src/cli.ts",
                },
            },
        },
    ],
    output: {
        target: "node",
    },
});