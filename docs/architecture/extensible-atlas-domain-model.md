# Extensible Registry Atlas Domain Model

Status: prototype-backed design decision

Issue: https://github.com/AcidicSoil/Registry-Atlas/issues/3

Prototype primary source: https://github.com/AcidicSoil/Registry-Atlas/tree/prototype/extensible-atlas-domain-model

## Decision

Registry Atlas should become a graph-shaped catalog whose durable domain consists of open-ended entities, typed relationships, metadata, and data-defined query facets. Focus, Component, Matrix, registry profiles, capability browsing, and future interfaces are projections over that graph rather than core schema concepts.

The production redesign should replace the existing closed taxonomy architecture. It should not preserve the old shape through compatibility types, dual writes, migration adapters, or fallback projections.

## Why the current model stops scaling

The current core schema makes several discovery concepts structural:

- `PrimaryFocus` is a closed union.
- `ComponentTag` is a closed union.
- component taxonomy categories are another closed union.
- `Registry` owns `primary_focus` and `component_tags` arrays directly.
- Focus, Component, and Matrix have dedicated core DTOs and grouping functions.
- shell state treats those views and selections as first-class application state.

That works while Registry Atlas only needs known shadcn registry/component categories. It makes new component families, new classification axes, and cross-cutting capabilities progressively more expensive because new data requires source edits before it can participate in discovery.

## Minimal durable model

### Entity

An entity is anything Atlas may identify, describe, relate, filter, or project.

```ts
interface Entity {
  id: string;
  type: string;
  label: string;
  metadata: Record<string, JsonValue>;
}
```

`type` is intentionally open. Known values may include `registry`, `component`, `family`, `capability`, and `facet`, but a new value such as `agent-skill`, `workflow-pack`, `theme`, `template`, or a future registry-defined type must not require a schema change.

### Relationship

A relationship is a directed semantic edge between two entities.

```ts
interface Relationship {
  id: string;
  type: string;
  from: string;
  to: string;
  metadata: Record<string, JsonValue>;
}
```

`type` is intentionally open. Current useful relationships include `contains`, `classified-as`, and `provides-capability`. The prototype also introduces `supersedes` and `variant-of` without changing the model.

### Metadata

Metadata holds descriptive or evidentiary facts that do not justify a new structural field.

Common metadata keys may be documented and validated where useful, but the model must not require every source to share the same metadata shape.

Provenance belongs with the fact it qualifies. For relationships and imported entity facts, use metadata such as:

- `source`
- `confidence`
- `evidenceUrl`
- `syncedAt`

These are metadata conventions, not view-specific status fields.

## First-class semantic entities

### Registries

A registry is an entity, not the root schema for all discoverable data. It relates to items through `contains`.

This permits a registry to contain components, templates, agent skills, workflow packs, themes, or future entity types without changing the registry interface.

### Families

A family is an entity used for classification. Items connect to families with `classified-as`.

Classification is many-to-many. There is no `primary_focus` field and no assumption that one classification axis is dominant.

A family may carry metadata such as `axis: "use-case"`, `axis: "form-factor"`, or a future value. A Focus-like view is therefore a projection that selects families from the desired axis.

### Capabilities

A capability is an entity. Providers connect to it with `provides-capability`.

Capabilities are not component types and should not be collapsed into taxonomy tags. One entity may provide many capabilities, and the same capability may be provided by many entity types.

### Facets

A facet is a data-defined query descriptor. It describes how to derive filter values from entity metadata or graph relationships.

The prototype exercises two minimal facet operators:

- metadata value: read a metadata key such as `framework` or `runtime`
- relationship target: traverse a relationship such as `classified-as` or `provides-capability` and use target entities as values

Adding a facet such as Runtime is therefore a data change, not a new domain field or UI branch.

## Projection pipeline

Every Atlas view should follow the same sequence:

1. select candidate entities
2. traverse relationships as required
3. derive facet values
4. apply active filters/search
5. aggregate into the projection's read model
6. render

Examples:

- Focus-like: group discoverable entities by `classified-as` families whose `axis` is `use-case`.
- Component-like: group discoverable entities by any selected family axis or entity type.
- Matrix-like: choose row entities and column entities, then derive boolean/count cells from relationship traversal.
- Capability view: group by capability and list providers.
- Registry profile: start at a registry and traverse `contains` plus related families/capabilities.
- Relationship ledger: render edges directly with provenance metadata.

No projection is allowed to become the canonical storage shape.

## Prototype evidence

The LOGIC prototype encodes the following stress cases:

| Case | Prototype behavior |
| --- | --- |
| New registry | Adds a registry, item, classification, and capability without structural changes. |
| Unknown entity family | Adds an `agent-skill` entity type and `agent-development` family without structural changes. |
| Overlapping classification | One item participates in multiple families across independent axes. |
| Multiple capabilities | One item provides several capabilities; capabilities are also shared by other items. |
| New relationship type | `supersedes` and `variant-of` are introduced as data. |
| New facet | Runtime filtering is introduced through a facet entity and metadata operator. |
| Multiple projections | Focus-like, family, capability, and registry × capability projections derive from the same graph. |
| Provenance | Source/confidence remain attached to the entity/relationship facts they qualify. |

The throwaway UI prototype uses the same graph representation to render four substantially different interfaces: graph lanes, a faceted catalog, a capability wall, and a relationship ledger. Variant selection changes presentation without changing the domain representation.

The prototype contains a built-in invariant suite for interactive execution. Runtime browser execution is intentionally separate from this durable decision record.

## Production implications

When this model is implemented in the real application:

- delete `PRIMARY_FOCUS_VALUES` and the `PrimaryFocus` closed union
- delete `COMPONENT_TAG_VALUES` and the `ComponentTag` closed union
- delete the closed component taxonomy category union as a domain constraint
- remove `primary_focus` and `component_tags` from the canonical registry record
- remove Focus/Component/Matrix DTOs from the core domain; projection-specific read models may live at the projection boundary
- replace registry-centric grouping functions with generic graph query/projection functions
- make the sync/import pipeline emit entities and relationships directly
- regenerate derived catalog data from upstream sources rather than writing migration scripts for the obsolete schema
- keep provenance/confidence conventions close to imported facts
- keep UI state about filters, selections, and projection choice outside the domain graph

## What should remain from the existing application

The redesign does not require discarding useful behavior that is independent of the old taxonomy shape. The following concepts can survive behind new query boundaries:

- generated local data and explicit synchronization
- provenance and confidence
- search
- install/view actions for eligible shadcn items
- local install queue behavior
- URL-restorable discovery state
- isolated DOM renderers or equivalent UI modules

Their inputs should become projection results or entity/relationship queries instead of the existing `Registry` taxonomy fields.

## Rejected directions

### Keep extending closed unions

Rejected because every new family or classification still requires code changes and release work.

### Put every new concept in `Registry.metadata`

Rejected because relationships, shared capabilities, and overlapping classifications become opaque and difficult to query.

### Create a schema for each component family

Rejected because the Atlas would reproduce the same extensibility problem at a larger scale.

### Make Focus, Component, or Matrix canonical

Rejected because each is only one useful arrangement of the same underlying graph.

## Implementation boundary

The prototypes are not production code and must not be merged into `main`.

The durable decision is the graph-shaped domain and projection architecture described here. A production implementation should begin from this document and issue #3, then replace the obsolete domain model directly rather than adapting the prototype files.