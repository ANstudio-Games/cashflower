# Transaction filter polish and date picker

## Approved direction
Keep PR #11's existing inline filter UI, rather than redesigning it as a sheet. User approved option 1 and requested a date picker for the add/edit transaction form.

## Behavior
- Year/month remain combinable; selecting a specific date clears both. Selecting a year/month clears the specific date.
- Reuse strict calendar validation. Picker input prevents impossible native dates instead of allowing invalid manual text.
- Switching to transfer resets and hides the category filter. Switching expense/income clears incompatible categories.
- Keep reset-all and separate date-only clear controls. Avoid nested pressables.
- Limit the expanded date panel height and allow scrolling, preserving room for transaction results.
- Share DateField between transaction form and date filter. Use installed SDK 57 @expo/ui/community/datetime-picker (actual exported path includes the hyphen). Android uses native confirmation/cancellation; iOS uses a modal calendar with cancel/save. Browser uses input[type=date] because the installed Expo UI web picker returns null.
- Store YYYY-MM-DD using local calendar components, not UTC conversion, to avoid timezone day shifts.
- Preserve Today shortcut, stored data shape, existing form validation, and translations (id/en/zh).

## Verification
Behavior tests for mutually exclusive date modes, date matching and validation, category resets, and local date round trips. Run the full existing suite, TypeScript, diff whitespace checks, and native/web bundle exports. Native runtime interaction remains a manual verification requirement; bundle success does not verify native picker presentation.
