declare module "three";

declare module "electrobun/view" {
  import type { ElectrobunRPCSchema, ElectrobunRPCConfig } from "electrobun/bun";

  export class Electroview<T> {
    constructor(config: { rpc: T });
    static defineRPC<Schema extends ElectrobunRPCSchema>(
      config: ElectrobunRPCConfig<Schema, "webview">
    ): any;
  }

  export type { ElectrobunRPCSchema, ElectrobunRPCConfig };
}
