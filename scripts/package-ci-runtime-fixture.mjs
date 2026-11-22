#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { readRuntimeAssets, runtimeAssetPath } from "./lib/runtime-publication.mjs";

const publicDocuments = [
  "catalog-taxonomy",
  "catalog-kind-overrides",
  "catalog-access-rules",
  "catalog-gold-set",
];

/** Snapshot a verified public runtime generation for credential-free, offline CI. */
export async function packageCiRuntimeFixture() {
  const { manifest, core, details } = await readRuntimeAssets("public/data");

  if (!manifest) throw new Error("CI fixture requires an immutable runtime manifest");

  const documents = JSON.parse(await readFile(".instance/atlas-test-documents.json", "utf8"));
  const selected = Object.fromEntries(publicDocuments.map((name) => [name, documents[name]]));

  if (Object.values(selected).some((value) => value === undefined)) {
    throw new Error("CI fixture is missing an approved public policy document");
  }

  const staging = await mkdtemp(join(tmpdir(), "atlas-ci-fixture-"));
  const target = resolve("tests/fixtures/ci-runtime.tar");

  try {
    const dataDir = join(staging, "public/data");
    await mkdir(dirname(runtimeAssetPath(dataDir, "core", manifest)), { recursive: true });
    await mkdir(join(staging, ".instance"));
    await mkdir(dirname(target), { recursive: true });
    await writeFile(runtimeAssetPath(dataDir, "core", manifest), core);
    await writeFile(runtimeAssetPath(dataDir, "details", manifest), details);
    await writeFile(join(dataDir, "runtime-manifest.json"), JSON.stringify(manifest) + "\n");
    await writeFile(
      join(staging, ".instance/atlas-test-documents.json"),
      JSON.stringify(selected) + "\n",
    );

    const pending = join(staging, "ci-runtime.tar");

    const tar = spawnSync(
      "tar",
      [
        "-C",
        staging,
        "--sort=name",
        "--mtime=@0",
        "--owner=0",
        "--group=0",
        "--numeric-owner",
        "-cf",
        pending,
        ".instance",
        "public/data",
      ],
      { stdio: "inherit" },
    );

    if (tar.error) throw tar.error;

    if (tar.status !== 0) throw new Error(`CI fixture packaging failed: ${tar.status}`);

    await rename(pending, target);
    console.log(
      `CI_FIXTURE_OK generation=${manifest.generation} documents=${publicDocuments.length}`,
    );
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}

packageCiRuntimeFixture().catch((error) => {
  console.error("CI_FIXTURE_FAILED", error.message);
  process.exitCode = 1;
});
