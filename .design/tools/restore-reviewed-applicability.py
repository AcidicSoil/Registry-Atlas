#!/usr/bin/env python3
"""Reconcile previously documented applicability after a project stack refresh.

Not a compliance evaluator or approval tool. Reject changed rule sources, invalid
evidence and missing reviews; retain noncompliant and pending-approval statuses.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
from pathlib import Path

SAFE = {"compliant", "unevaluated", "remediation-required", "pending-approval", "blocked"}


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def checked_evidence(root: Path, paths: list[str]) -> dict[str, str]:
    if not paths:
        raise ValueError("No review evidence")
    digests = {}
    for path in paths:
        file = Path(path)
        if file.is_absolute() or ".." in file.parts or not (root / file).is_file():
            raise ValueError(f"Invalid evidence: {path!r}")
        digests[path] = sha(root / file)
    return digests


def reconcile(root: Path, current: dict, previous: dict) -> tuple[dict, dict]:
    updated = json.loads(json.dumps(current))
    preserved = []
    held = []
    evidence_changed = set()

    for ref, row in updated["assessments"].items():
        old = previous["assessments"].get(ref)
        if not old or old["sourceDigest"] != row["sourceDigest"]:
            held.append([ref, "Source changed or standard newly added"])
            continue
        if old["applicability"] not in {"applicable", "not-applicable"}:
            held.append([ref, "Previously unreviewed"])
            continue
        if old["compliance"] not in SAFE:
            held.append([ref, "Unexpected compliance status"])
            continue
        if not old.get("reason", "").strip():
            held.append([ref, "Missing prior review rationale"])
            continue

        try:
            hashes = checked_evidence(root, old.get("evidence", []))
        except ValueError as error:
            held.append([ref, str(error)])
            continue

        delta = sorted(path for path, digest in hashes.items()
                       if old.get("evidenceDigests", {}).get(path) != digest)
        evidence_changed.update(delta)

        row.update({
            "applicability": old["applicability"],
            # A re-review of applicability does not change compliance, even when
            # technical checks passed. PAO approval remains a separate decision.
            "compliance": old["compliance"],
            "reason": old["reason"],
            "evidence": old["evidence"],
            "evidenceDigests": hashes,
            "reviewedSourceDigest": row["sourceDigest"],
            "stackFingerprint": updated["project"]["stack"]["fingerprint"],
            "paoDecisionRef": old.get("paoDecisionRef", ""),
        })
        preserved.append(ref)

    return updated, {
        "restoredReviewedApplicability": len(preserved),
        "requiresReview": held,
        "changedReviewEvidenceFiles": sorted(evidence_changed),
        "unresolvedApplicable": [
            ref for ref in preserved if updated["assessments"][ref]["applicability"] == "applicable"
            and updated["assessments"][ref]["compliance"] not in {"compliant", "approved-exception"}
        ],
        "preservedPendingApprovals": [
            ref for ref in preserved if updated["assessments"][ref]["compliance"] == "pending-approval"
        ],
        "preservedRemediationRequired": [
            ref for ref in preserved if updated["assessments"][ref]["compliance"] == "remediation-required"
        ],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", type=Path, default=Path.cwd())
    parser.add_argument("--apply", action="store_true",
                        help="Write baseline only after reviewing changed evidence and current app signals")
    parser.add_argument("--report", type=Path, default=Path(".instance/standards-review/reconciled.json"))
    args = parser.parse_args()
    root = args.project.resolve()
    baseline = root / ".design/standards.json"

    previous = json.loads(subprocess.check_output(
        ["git", "show", "HEAD:.design/standards.json"], cwd=root, text=True
    ))
    current = json.loads(baseline.read_text())
    updated, report = reconcile(root, current, previous)
    report_file = root / args.report
    report_file.parent.mkdir(parents=True, exist_ok=True)
    report_file.write_text(json.dumps(report, indent=2) + "\n")
    if args.apply:
        baseline.write_text(json.dumps(updated, indent=2, ensure_ascii=False) + "\n")
    print(json.dumps({
        "apply": args.apply,
        "restoredReviewedApplicability": report["restoredReviewedApplicability"],
        "requiresReview": len(report["requiresReview"]),
        "changedReviewEvidenceFiles": len(report["changedReviewEvidenceFiles"]),
        "unresolvedApplicable": len(report["unresolvedApplicable"]),
        "preservedPendingApprovals": len(report["preservedPendingApprovals"]),
        "preservedRemediationRequired": len(report["preservedRemediationRequired"]),
        "report": str(report_file),
    }, indent=2))


if __name__ == "__main__":
    main()
