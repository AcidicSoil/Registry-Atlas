import { parseCatalogPolicy } from "../../src/registry-explorer/core/catalogPolicy";
import { readRepositoryDocument } from "./testAtlasDatabase";

/** The same validated snapshot policy formerly installed as global test state. */
export const TEST_CATALOG_POLICY = parseCatalogPolicy(
  readRepositoryDocument("catalog-taxonomy"),
  readRepositoryDocument("catalog-kind-overrides"),
);
