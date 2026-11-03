# Assets

Place skill brand icons here if desired (mirrors the shadcn skill's `assets/`):

- `lvcn-small.png` — small icon
- `lvcn.png` — large icon

Then reference them in [`../agents/openai.yml`](../agents/openai.yml):

```yaml
interface:
  display_name: "lvcn"
  short_description: "..."
  icon_small: "./assets/lvcn-small.png"
  icon_large: "./assets/lvcn.png"
```

No images are bundled yet — the interface config intentionally omits `icon_*` fields so it has no broken references. Add the PNGs and the fields together.
