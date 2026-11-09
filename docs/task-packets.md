# Local task-packet contract

The operator supplies a local JSON adapter to the owned corpus. This engine composes a task; `prompt-library` remains the corpus owner. No real private catalog, owner memory, or generated private packet belongs in this public repository.

## Inputs and outputs

[`task-catalog.schema.json`](../schema/task-catalog.schema.json) describes `schema_version`, a source repository/revision/visibility, shared instructions, a specialist-prefix map, and prompts. IDs accept existing `verb_topic` patterns or owner catalog IDs such as `P011`. An ID must be unique across the whole adapter. Every selected prompt requires its version, title, brand, specialist, objective, input requirements, output contract, owning repository/issue, role owner, dependencies, visibility, acceptance, resource ceiling, and complete prompt text. Empty dependencies are allowed; absent input requirements are rejected.

The source visibility covers its prefixes as well as the source record. Mark the source private whenever those shared instructions contain private information. A private source or private prompt makes the whole packet private. This is explicit information labeling supplied by the operator; the engine cannot discover undeclared sensitive content.

`composeTaskPacket(catalog, id)` returns a deterministic [`task-packet.schema.json`](../schema/task-packet.schema.json) object with full structured fields and `brief_markdown`. Shared and specialist instructions precede the task. Input requirements describe material the eventual worker needs; composition does not fetch, validate the contents of, or pretend to have supplied that material. Dependencies remain declarations, not resolved integrations.

The SHA-256 identity covers the selected task, its prefixes, source revision, and metadata using canonical object-key ordering. Execution observations do not change that composition identity. Adapters verify both this hash and Markdown parity before preparing payloads. The hash is an integrity checksum, not a signature or permission grant.

Resource ceilings are declared planning constraints in integer minor currency units, attempts, and minutes. This path performs no work admission, spending, reservation, provider evaluation, or worker launch.

## Local commands

From a clone:

```bash
npm run hub -- compose --catalog test/fixtures/synthetic-catalog.json --id synthetic_product_receipt --json
npm run validate -- test/fixtures/synthetic-catalog.json
```

With `--json`, stdout contains one packet or error document; without it, stdout contains the full Markdown. The command writes no files. Local stdout is an output channel chosen by the operator; any later copy, redirection, or dispatch requires the appropriate destination boundary. Keep private inputs and outputs outside the public repository or in ignored `.local/`.

## GitHub dry-run adapter

```bash
npm run hub -- compose --catalog test/fixtures/synthetic-catalog.json --id synthetic_teaching_article --dry-run --destination github-issue:example/private-synthetic-destination --destination-visibility private --approved-private-destination github-issue:example/private-synthetic-destination --json
```

This example uses public-safe synthetic text marked private to test handling. `prepareGithubIssueDryRun(packet, destination, approvedPrivateDestination)` produces an exact address, declared visibility, privacy/approval record, unchanged execution observation, and GitHub issue `title`/`body` payload. The complete brief is in the body. The adapter is dry-run only: `dispatch.performed` and `worker_started_by_this_command` are false, and no connector or network client is invoked.

For private content, both the destination's private declaration and exact matching approval address are mandatory. This is owner attestation, not an authorization service or live remote-access check. A future dispatch adapter must verify the destination boundary, use the actual granted credentials/authority, and return its receipt before execution can be reported. Notion dispatch is not implemented in this slice.

## Honest execution observations

New packets start with `{ "state": "prepared", "execution_id": null, "receipt": null }`. A planned issue does not mean queued or running.

`applyExecutionReceipt(packet, returnedReceipt)` accepts operator-supplied returned observations with `state`, a non-empty `execution_id`, `adapter`, and a valid UTC ISO `received_at`. A completed observation also needs `evidence_ref`. These fields are typed records; the engine cannot authenticate a caller's receipt, poll runtime liveness, or verify the evidence reference's contents. Supply actual returned observations only.

The CLI can attach one returned receipt using `--receipt <local-returned-receipt.json>`. The library supports applying successive receipts while preserving execution ID, adapter, and time ordering. Packet history persistence is the caller's responsibility.

| Current state | Allowed returned states |
| --- | --- |
| prepared | queued, running, completed, blocked, failed, cancelled |
| queued | queued, running, completed, blocked, failed, cancelled |
| running | running, completed, blocked, failed, cancelled |
| blocked | blocked, queued, running, completed, failed, cancelled |
| completed | completed |
| failed | failed |
| cancelled | cancelled |

A completed observation can follow prepared, queued, or blocked when an adapter returns its result or a job finishes between polls. An intermediate running observation is not required; the completed receipt must supply its execution ID and evidence reference, preserve any existing execution identity, and obey time ordering. Repeated imports are traceable through source revision and packet ID; the engine does not yet provide a dispatch ledger or deduplication guarantee.

## Verification scope

Run `npm run test` and `npm run validate -- test/fixtures/synthetic-catalog.json`. Tests cover all three synthetic classes, missing inputs/prefixes, duplicate IDs, private visibility inheritance, exact export approval, content tampering, unknown or unreceipted states, receipt identity/time/transition checks, and complete no-write CLI output.

The runtime validator enforces catalog uniqueness and prefix resolution plus cross-field packet/receipt checks beyond JSON Schema. The new `validate` command applies to this local task-catalog adapter, not published prompt-pattern frontmatter. Model evals are separate and require configured prompts, dependencies, and an authorized provider budget. No CI workflow is introduced.
