# Tests — Guide §52

- `tests/unit/` — pure domain: SM-2, baseline, signals, import (see src/lib/__tests__)
- `tests/integration/` — service + repository + SQLite (e.g. cardRepository + Dexie)
- `tests/e2e/` — critical workflows: import → review → grade → schedule

Unit tests live co-located in src/lib/__tests__ for now; integration/e2e placeholders here.
