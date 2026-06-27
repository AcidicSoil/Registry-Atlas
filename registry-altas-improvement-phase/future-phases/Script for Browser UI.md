# Script for Browser UI

**Created:** 6/26/2026 22:00:53  
**Updated:** 6/26/2026 22:02:05  
**Exported:** 6/26/2026 22:04:21  
**Link:** [https://chatgpt.com/g/g-p-699e141c586c8191a60c161296bf2ae0-g-chat/c/6a3f3ce3-c5dc-83ea-a312-985ccf3b8684](https://chatgpt.com/g/g-p-699e141c586c8191a60c161296bf2ae0-g-chat/c/6a3f3ce3-c5dc-83ea-a312-985ccf3b8684)  

## Prompt:
How can we configure a script that can take a target URL (it's basically a registry URL)? We want to configure this script to use a browser that uses packages or libraries SDK, whichever one is the most relevant, and we want it to configure our local models. We want to target that target UI component site; that way we can interact with it for four specific use cases. 

* [browser-use](https://browser-use.com)

* [browser-use](https://github.com/browser-use/browser-use)

## Response:
I’ll ground this on the current `browser-use` API and local-model setup, then give you a script shape you can drop into a project. I’ll assume the “four use cases” are registry discovery, item detail extraction, install command capture, and screenshot/route verification unless you want different ones.

Use `browser-use` as the agent layer and a local OpenAI-compatible model endpoint as the LLM layer. For your setup, LM Studio is the cleaner default because it can serve local models from its Developer tab and exposes OpenAI-compatible endpoints like `/v1/chat/completions`; Browser Use also supports OpenAI-compatible models through `ChatOpenAI(base_url=...)`. ([LM Studio](https://lmstudio.ai/docs/developer/core/server)) ([LM Studio](https://lmstudio.ai/docs/developer/openai-compat)) ([Browser Use](https://docs.browser-use.com/open-source/supported-models))

Browser Use is the right tool when the target registry UI changes shape across sites and you want the model to navigate, search, click, inspect docs, and extract structured findings. Use Playwright directly only for deterministic tests after the agent has mapped the site.

Install:

```bash
mkdir registry-browser-agent
cd registry-browser-agent

uv venv --python 3.12
source .venv/bin/activate

uv pip install browser-use python-dotenv pydantic
uvx browser-use install
```

Browser Use’s quickstart currently uses `uv pip install browser-use` and `uvx browser-use install` to install the package and browser runtime. ([Browser Use](https://docs.browser-use.com/open-source/quickstart))

Create `.env`:

```env
LOCAL_LLM_PROVIDER=lmstudio
LOCAL_LLM_BASE_URL=http://localhost:1234/v1
LOCAL_LLM_MODEL=your-loaded-model-id
LOCAL_LLM_API_KEY=lm-studio

BROWSER_HEADLESS=false
BROWSER_PROFILE_DIR=.browser-profile
REGISTRY_OUTPUT_DIR=.registry-runs
```

Start LM Studio’s server first:

```bash
lms server start
```

Or use LM Studio UI: Developer tab → Start Server. LM Studio documents both the Developer-tab server toggle and `lms server start`. ([LM Studio](https://lmstudio.ai/docs/developer/core/server))

For Ollama instead:

```env
LOCAL_LLM_PROVIDER=ollama
LOCAL_LLM_BASE_URL=http://localhost:11434/v1
LOCAL_LLM_MODEL=llama3.2
LOCAL_LLM_API_KEY=ollama
```

Ollama also exposes OpenAI-compatible endpoints and requires pulling a model before use. ([Ollama Documentation](https://docs.ollama.com/api/openai-compatibility))

Create `registry_agent.py`:

```python
import argparse
import asyncio
import json
import os
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse

from dotenv import load_dotenv
from pydantic import BaseModel, Field

from browser_use import Agent, Browser, ChatOpenAI, ChatOllama

class RegistryRunResult(BaseModel):
    target_url: str
    use_case: str
    summary: str = ""
    registry_name: str | None = None
    item_count_estimate: int | None = None
    discovered_items: list[dict] = Field(default_factory=list)
    install_commands: list[str] = Field(default_factory=list)
    routes_or_links: list[str] = Field(default_factory=list)
    screenshots_or_artifacts: list[str] = Field(default_factory=list)
    risks_or_blockers: list[str] = Field(default_factory=list)
    next_actions: list[str] = Field(default_factory=list)

USE_CASE_TASKS = {
    "catalog": """
You are inspecting a UI component registry site.

Goal:
Discover the registry catalog from the target URL.

Extract:
- registry/site name
- component/item names
- category/tag/group labels
- item URLs
- descriptions
- whether each item appears installable, copyable, demo-only, or documentation-only

Rules:
- Do not install anything.
- Do not log in.
- Stay within the target site unless documentation links are clearly part of the same registry.
- Prefer structured facts over prose.
""",
    "detail": """
You are inspecting a UI component registry item/detail flow.

Goal:
Open representative item/detail pages and extract implementation metadata.

Extract:
- item name
- docs URL
- demo URL if present
- install command
- copy command
- dependencies
- registry JSON endpoint if visible
- props/API table if present
- files/components referenced by the docs

Rules:
- Do not install anything.
- Do not paste commands into a terminal.
- If there are many items, sample the first 10 useful ones.
""",
    "verify": """
You are verifying a UI component registry for route and interaction eligibility.

Goal:
Check whether registry pages can be routed to, viewed, searched, filtered, and copied from.

Test:
- landing page loads
- registry/catalog page loads
- search/filter works if present
- item/detail pages load
- copy/install command UI works if present
- broken links or blocked pages
- any route pattern you can infer

Rules:
- Do not authenticate.
- Do not install anything.
- Report exact broken or blocked URLs.
""",
    "capture": """
You are capturing durable research evidence from a UI component registry.

Goal:
Collect durable evidence for a later implementation agent.

Capture:
- page titles
- important URLs
- install/view commands
- labels/categories
- visible component names
- notes about UI behavior
- any registry endpoint or command format
- screenshots if the browser tool supports them

Rules:
- Do not install anything.
- Do not rely on memory.
- Output concise structured findings.
""",
}

def build_llm():
    provider = os.getenv("LOCAL_LLM_PROVIDER", "lmstudio").lower()
    model = os.environ["LOCAL_LLM_MODEL"]

    if provider == "ollama":
        return ChatOllama(model=model)

    return ChatOpenAI(
        model=model,
        base_url=os.getenv("LOCAL_LLM_BASE_URL", "http://localhost:1234/v1"),
        api_key=os.getenv("LOCAL_LLM_API_KEY", "lm-studio"),
        temperature=0,
    )

def safe_name(url: str) -> str:
    parsed = urlparse(url)
    host = parsed.netloc.replace(":", "_") or "registry"
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    return f"{host}-{stamp}"

async def run_registry_task(target_url: str, use_case: str, max_steps: int):
    load_dotenv()

    if use_case not in USE_CASE_TASKS:
        raise ValueError(f"Unknown use case: {use_case}. Valid: {', '.join(USE_CASE_TASKS)}")

    out_root = Path(os.getenv("REGISTRY_OUTPUT_DIR", ".registry-runs"))
    run_dir = out_root / safe_name(target_url)
    run_dir.mkdir(parents=True, exist_ok=True)

    profile_dir = Path(os.getenv("BROWSER_PROFILE_DIR", ".browser-profile")).resolve()
    profile_dir.mkdir(parents=True, exist_ok=True)

    headless = os.getenv("BROWSER_HEADLESS", "false").lower() == "true"

    browser = Browser(
        headless=headless,
        user_data_dir=str(profile_dir),
        downloads_path=str(run_dir / "downloads"),
        traces_dir=str(run_dir / "traces"),
        record_har_path=str(run_dir / "network.har"),
    )

    task = f"""
Target URL:
{target_url}

Use case:
{use_case}

Instructions:
{USE_CASE_TASKS[use_case]}

Final output requirement:
Return valid JSON matching this shape:
{RegistryRunResult.model_json_schema()}

The JSON must be directly useful to an implementation agent.
"""

    llm = build_llm()

    agent = Agent(
        task=task,
        llm=llm,
        browser=browser,
        save_conversation_path=str(run_dir / "conversation.json"),
    )

    history = await agent.run(max_steps=max_steps)

    result_text = ""
    if hasattr(history, "final_result"):
        result_text = history.final_result() or ""

    raw_path = run_dir / "result.raw.txt"
    raw_path.write_text(result_text, encoding="utf-8")

    try:
        parsed = json.loads(result_text)
    except json.JSONDecodeError:
        parsed = {
            "target_url": target_url,
            "use_case": use_case,
            "summary": result_text,
            "risks_or_blockers": ["Agent did not return strict JSON. See result.raw.txt."],
        }

    result_path = run_dir / "result.json"
    result_path.write_text(json.dumps(parsed, indent=2), encoding="utf-8")

    print(json.dumps({
        "run_dir": str(run_dir),
        "result_json": str(result_path),
        "raw_result": str(raw_path),
        "conversation": str(run_dir / "conversation.json"),
        "network_har": str(run_dir / "network.har"),
    }, indent=2))

def main():
    parser = argparse.ArgumentParser(description="Inspect a UI component registry with browser-use and a local model.")
    parser.add_argument("target_url", help="Registry/catalog/docs URL to inspect.")
    parser.add_argument(
        "--use-case",
        choices=sorted(USE_CASE_TASKS.keys()),
        default="catalog",
        help="Interaction mode to run.",
    )
    parser.add_argument("--max-steps", type=int, default=40)
    args = parser.parse_args()

    asyncio.run(run_registry_task(args.target_url, args.use_case, args.max_steps))

if __name__ == "__main__":
    main()
```

Run it:

```bash
python registry_agent.py "https://your-registry-site.example" --use-case catalog
python registry_agent.py "https://your-registry-site.example" --use-case detail
python registry_agent.py "https://your-registry-site.example" --use-case verify
python registry_agent.py "https://your-registry-site.example" --use-case capture
```

Browser Use supports persistent browser profile configuration through `user_data_dir`, downloads paths, traces, HAR recording, timing settings, and headless/headed browser mode; `Browser` is also documented as the cleaner alias for `BrowserSession`. ([Browser Use](https://docs.browser-use.com/open-source/customize/browser/all-parameters))

For your Registry Explorer work, the useful output contract should be stable and not depend on the target site. Keep each run’s output under `.registry-runs/<host>-<timestamp>/` and feed `result.json`, `conversation.json`, and `network.har` to the later implementation agent. The implementation agent should not repeat the browser research unless the result has blockers.

A better project layout:

```text
registry-browser-agent/
  .env
  registry_agent.py
  registry-targets.yml
  .registry-runs/
  .browser-profile/
```

Optional `registry-targets.yml`:

```yml
targets:
  - id: aceternity
    url: "https://ui.aceternity.com/components"
    use_cases: ["catalog", "detail", "verify", "capture"]

  - id: cult-ui
    url: "https://www.cult-ui.com/docs/components"
    use_cases: ["catalog", "detail", "verify", "capture"]
```

Add a batch runner later if needed, but keep the single-target script first. It is easier to debug, replay, and hand off to agents.

One important constraint: local models often fail browser action schemas more than hosted frontier models. Browser Use’s own docs note that some smaller Qwen models can return malformed action schemas, and they recommend adding concrete action-format examples when using those models. ([Browser Use](https://docs.browser-use.com/open-source/supported-models)) For this task, use a stronger local instruction model with good tool/function calling behavior, low temperature, and enough context. For registry extraction, the model needs reliability more than creativity.

---

**Sources:**

- [LM Studio as a Local LLM API Server | LM Studio](https://lmstudio.ai/docs/developer/core/server)
- [Supported Models - Browser Use](https://docs.browser-use.com/open-source/supported-models)
- [OpenAI compatibility - Ollama](https://docs.ollama.com/api/openai-compatibility)



---
Powered by [ChatGPT Exporter](https://www.chatgptexporter.com)