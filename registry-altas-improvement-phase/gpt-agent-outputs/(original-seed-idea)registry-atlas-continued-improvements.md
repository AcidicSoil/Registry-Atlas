# registry-atlas-improvements

Current app has the right skeleton: it loads a local `registries.json`, validates mirror data, resolves item routes, builds install/view commands, and has discovery/profile/matrix views. But the “actual component” layer is still shallow: `RegistryItemSummary` only stores summary metadata, the profile view lists items but does not fetch/render the item JSON, and the matrix uses a small fixed `MATRIX_COLUMNS` list even though `COMPONENT_TAG_VALUES` is much larger.

src-snapshot

The next round should focus on these changes.

**1\. Add an actual component/item view route**

Add a route/state like:

```
view: 'discover' | 'focus' | 'component' | 'matrix' | 'item'
selectedRegistryName: string | null
selectedItemSlug: string | null
```

Then support URLs like:

```
?view=item&registry=@cult-ui&item=button
?view=item&registry=@assistant-ui&item=thread
```

Right now the app can resolve a raw item route and open it externally, but it should also have an internal “View component” action that fetches the registry item JSON and renders it in the app.

The shadcn CLI already has a `view` command for viewing registry items before installing them, including namespaced items like `@acme/auth`; it also supports viewing multiple items at once. [![](https://www.google.com/s2/favicons?domain=https://ui.shadcn.com&sz=128)Shadcn UI](https://ui.shadcn.com/docs/cli?utm_source=chatgpt.com) Your UI should mirror that concept visually.

Add a new core module:

```
src/registry-explorer/core/registryItem.ts
```

With something like:

```
export interface RegistryItemDetail {
  name: string;
  title?: string;
  description?: string;
  type?: string;
  author?: string;
  dependencies?: string[];
  devDependencies?: string[];
  registryDependencies?: string[];
  files?: RegistryItemFile[];
  raw: unknown;
}

export interface RegistryItemFile {
  path: string;
  type: string;
  target?: string;
  content?: string;
}
```

The official registry item schema includes fields like `name`, `title`, `description`, `type`, `dependencies`, `devDependencies`, `registryDependencies`, and `files`. [![](https://www.google.com/s2/favicons?domain=https://ui.shadcn.com&sz=128)Shadcn UI](https://ui.shadcn.com/docs/registry/registry-item-json?utm_source=chatgpt.com) That is what the item detail page should render.

**2\. Fetch real item JSON, not only item summaries**

Add:

```
export async function loadRegistryItemDetail(
  registry: Registry,
  itemSlug: string,
  fetchImpl: FetchLike = fetch,
): Promise<RegistryItemDetail>
```

Flow:

```
registry + slug
→ resolveRegistryItemRoute()
→ fetch item JSON
→ validate minimal registry-item shape
→ render item detail page
```

The view should show:

```
Title
Description
Registry namespace
Item slug
Item type
Dependencies
Dev dependencies
Registry dependencies
Files included
Targets
Raw JSON
Copy install
Copy inspect
Add to queue
Open raw item JSON
```

This gives you the “actual component” route you’re asking for.

**3\. Add a source/files tab inside the item view**

For each item, show a files table:

```
Path
Type
Target
Has content?
```

Then add tabs:

```
Overview
Files
Dependencies
Raw JSON
Install
```

The value is that you can inspect what a registry item is going to add before installing it. The schema’s `files` field is built around file path/type/target metadata, and `registryDependencies` can pull other registry items too. [![](https://www.google.com/s2/favicons?domain=https://ui.shadcn.com&sz=128)Shadcn UI](https://ui.shadcn.com/docs/registry/registry-item-json?utm_source=chatgpt.com)

**4\. Add a “view command” panel, not just install**

You already build:

```
npx shadcn@latest view @registry/item
```

But the UI should treat “view” as first-class:

```
View in app
Copy shadcn view command
Open raw JSON
Copy install command
Add to queue
```

Also add batch inspect:

```
pnpm dlx shadcn@latest view @foo/button @bar/dialog @baz/card
```

The official CLI supports `search`, `list`, and `view`, including namespaced registries. [![](https://www.google.com/s2/favicons?domain=https://ui.shadcn.com&sz=128)Shadcn UI](https://ui.shadcn.com/docs/cli?utm_source=chatgpt.com)

**5\. Replace fixed matrix columns with dynamic component coverage**

Your `COMPONENT_TAG_VALUES` list is broad, but `MATRIX_COLUMNS` is tiny:

```
export const MATRIX_COLUMNS = [
  'chatbot',
  'button',
  'badge',
  'input',
  'select',
  'dropdown',
  'table',
  'chart',
  'auth-form',
  'navbar',
  'tabs',
  'card',
  'modal',
  'hero-section',
];
```

That means the matrix artificially hides most of the useful catalog. Change it to:

```
buildMatrixColumns(registries, options)
```

Options:

```
{
  mode: 'popular' | 'all' | 'selected' | 'preset';
  selectedTags?: ComponentTag[];
  limit?: number;
}
```

Then add a matrix column picker:

```
All components
Popular components
AI app preset
Dashboard preset
Forms preset
Marketing preset
Navigation preset
Audio/voice preset
```

The source already has many more tags, including `file-upload`, `dropzone`, `command`, `combobox`, `dialog`, `drawer`, `sheet`, `audio-player`, `waveform`, `voice-picker`, and `transcript-viewer`.

src-snapshot

The UI should expose them.

**6\. Extend the component taxonomy from actual registry items**

Do not only hand-maintain `COMPONENT_TAG_VALUES`. Add a sync step that discovers item names and maps them into tags.

Example:

```
item slug: login-01
type: registry:block
category: auth
→ tags: auth-form, card, input, button

item slug: voice-picker
type: registry:component
category: audio
→ tags: voice-picker, audio-player

item slug: data-table
type: registry:block
category: dashboard
→ tags: table, data-grid, filter-bar, pagination
```

Keep the curated taxonomy, but add derived tags:

```
component_tags: ComponentTag[]
derived_component_tags: string[]
item_tags: string[]
```

Then search can include both curated and actual registry terms.

**7\. Add registry index hydration**

The shadcn registry system supports a registry index/directory, and the official registry directory is used by the CLI when adding or searching namespaced registries. [![](https://www.google.com/s2/favicons?domain=https://ui.shadcn.com&sz=128)Shadcn UI](https://ui.shadcn.com/docs/registry/registry-index?utm_source=chatgpt.com) Your sync process should ingest more than the top-level registry list.

Add a build-time pipeline:

```
sync registries
→ fetch registry index/catalog where available
→ fetch item summaries
→ optionally fetch item JSON details
→ validate
→ write public/data/registries.json
→ write public/data/items/@namespace/slug.json
```

This would keep runtime fast while still giving you actual component views.

**8\. Add item search backed by real registry search**

The CLI supports:

```
pnpm dlx shadcn@latest search @registry -q "button"
pnpm dlx shadcn@latest list @registry
```

It also supports searching multiple registries. [![](https://www.google.com/s2/favicons?domain=https://ui.shadcn.com&sz=128)Shadcn UI](https://ui.shadcn.com/docs/cli?utm_source=chatgpt.com) Your app could mirror this in two ways:

For a static browser app, do this during sync and store results.

For a local/dev app, add a small server endpoint:

```
/api/registry-search?registries=@foo,@bar&q=button
/api/registry-item?registry=@foo&item=button
```

Then the UI can query live registry data instead of only the local mirror.

**9\. Add “component page” separate from “registry page”**

Right now “component” means a group of registries that claim a tag. Instead, add a true component detail route:

```
?view=component-detail&component=button
```

That page should show:

```
All registries with button-like items
Verified exact item matches
Fallback/inferred matches
Related items: icon-button, loading-button, toggle
Best installable candidates
Comparison table
Preview/view links
```

For example:

```
/button
  @shadcn/button
  @cult-ui/button
  @reui/button
  @basecn/button
  @diceui/button
```

Then each row gets:

```
View component
Open raw item
Copy view
Copy install
Add to queue
Compare
```

**10\. Add registry item type filters**

The registry item schema supports types like:

```
registry:block
registry:component
registry:ui
registry:hook
registry:lib
registry:page
registry:file
registry:theme
registry:style
```

These types should become filters. [![](https://www.google.com/s2/favicons?domain=https://ui.shadcn.com&sz=128)Shadcn UI](https://ui.shadcn.com/docs/registry/registry-item-json?utm_source=chatgpt.com)

In practice:

```
Show only UI primitives
Show only blocks
Show only hooks
Show only pages
Show only themes
Show only libs/utils
```

This matters because “component” registries often contain much more than visual components.

**11\. Add dependency/risk badges from real item JSON**

Once you fetch actual item JSON, you can show useful badges:

```
Uses Framer Motion
Uses Radix
Uses React Aria
Adds registry dependencies
Adds npm dependencies
Adds page files
Adds hooks
Adds lib/utils
Contains CSS variables
```

This is much more useful than generic registry-level warnings.

**12\. Add previews where possible, but do not fake them**

A “view route” can mean two different things:

```
Raw item JSON view
Rendered component preview
```

The raw item JSON route is straightforward.

Rendered previews are harder because registry items may include dependencies, aliases, Tailwind config, CSS vars, and framework assumptions. So implement preview support in tiers:

```
Tier 1: Raw registry item JSON
Tier 2: File/code viewer
Tier 3: Static screenshot/preview URL if registry provides one
Tier 4: Local sandbox preview generated after install/inspect
```

Do not make the UI pretend it can render everything safely in-browser.

**13\. Add “open in shadcn-compatible route” from `components.json` rules**

The `components.json` registry config uses namespace-to-URL templates with `{name}` placeholders. [![](https://www.google.com/s2/favicons?domain=https://ui.shadcn.com&sz=128)Shadcn UI](https://ui.shadcn.com/docs/components-json?utm_source=chatgpt.com) Your resolver already handles URL templates. Extend it so users can see the exact template resolution:

```
Registry template:
https://registry.example.com/{name}.json

Item slug:
button

Resolved route:
https://registry.example.com/button.json
```

Add this to the item view so failures are obvious.

**14\. Rename some concepts to match registry reality**

Current naming like “Component index” and “Component group” is fine, but it blurs three different things:

```
Component tag = your normalized category
Registry item = actual installable registry object
Registry item type = official schema type
Component candidate = search result, possibly inferred
```

Make the UI labels explicit:

```
Components / Tags
Registry Items
Installable Items
Inferred Matches
Raw Registry Data
```

That will reduce confusion.

**15\. Recommended implementation order**

I would build it in this order:

```
1. Add item route state: view=item&registry=&item=
2. Add loadRegistryItemDetail()
3. Add item detail UI: overview/files/dependencies/raw/install
4. Add “View component” buttons everywhere an item is route eligible
5. Replace fixed matrix columns with dynamic tag columns
6. Add component/tag picker and presets
7. Expand sync to hydrate actual registry item catalogs
8. Add component detail pages
9. Add registry item type filters
10. Add dependency/risk badges from item JSON
```

The core change is this: stop treating `itemSummaries` as the final layer. Treat them as links into real registry item documents. Once the app can fetch, validate, route to, and display actual registry items, it becomes a real registry explorer instead of a curated registry directory.
