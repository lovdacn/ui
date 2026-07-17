# Assets

Place skill brand icons here if desired (mirrors the shadcn skill's `assets/`):

- `lovdacn-small.png` — small icon
- `lovdacn.png` — large icon

Then reference them in [`../agents/openai.yml`](../agents/openai.yml):

```yaml
interface:
  display_name: "lovdacn (lvcn)"
  short_description: "..."
  icon_small: "./assets/lovdacn-small.png"
  icon_large: "./assets/lovdacn.png"
```

No images are bundled yet — the interface config intentionally omits `icon_*` fields so it has no broken references. Add the PNGs and the fields together.
