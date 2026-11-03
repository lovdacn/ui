import path from "path"
import fs from "fs-extra"

export type FileSnapshot = {
  path: string
  existed: boolean
  content: string | null
}

/** Capture the current on-disk state of the given files. */
export function snapshotFiles(paths: string[]): FileSnapshot[] {
  const seen = new Set<string>()
  const snapshots: FileSnapshot[] = []

  for (const p of paths) {
    const resolved = path.resolve(p)
    if (seen.has(resolved)) continue
    seen.add(resolved)

    const existed = fs.existsSync(resolved)
    snapshots.push({
      path: resolved,
      existed,
      content: existed ? fs.readFileSync(resolved, "utf8") : null,
    })
  }

  return snapshots
}

/**
 * Restore files to a previously captured snapshot. Files that existed are
 * rewritten with their original content; files that did not exist are removed
 * if they were created after the snapshot.
 */
export function restoreFiles(snapshots: FileSnapshot[]): void {
  for (const snap of snapshots) {
    if (snap.existed && snap.content !== null) {
      fs.ensureDirSync(path.dirname(snap.path))
      fs.writeFileSync(snap.path, snap.content, "utf8")
    } else if (!snap.existed && fs.existsSync(snap.path)) {
      fs.removeSync(snap.path)
    }
  }
}
