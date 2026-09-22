# Compare sizes in the guest's entered units; brand cm and inch tables are rounded separately

Fabindia's M bust is 36 in on the inch table but 91 cm on the cm table (36 in is
91.44 cm). Converting a guest's 36 in to cm and comparing against the cm table pushed
them to L. The first unit test caught it.

Fix that held: keep both official tables verbatim (`src/lib/sizeCharts.ts`), store
measurements in cm plus the entered `units`, convert back at read time, and let
`recommendSize` compare against the table for those units with a 0.06 epsilon for
the 0.1 rounding round-trip.

Why it matters: any future chart must be added with both unit tables from the
brand, never one table converted.
