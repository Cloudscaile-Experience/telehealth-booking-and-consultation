---
name: add-translations
description: Add i18n translations for a new feature or component using cs-ext-utils and react-i18next. Use when adding user-facing text, creating a new component with copy, or asked to internationalise strings.
when_to_use: Triggered when adding any user-facing text to a component. Never hardcode strings in JSX — always create a translation key.
allowed-tools: Read Write
---

Never hardcode user-facing strings in JSX. All copy goes through `react-i18next` registered with the host.

## Step 1 — Create the translation file

```json
// src/locales/myFeature.json
{
  "en": {
    "title": "Patient Management",
    "empty": "No patients found",
    "actions": {
      "add": "Add Patient",
      "edit": "Edit",
      "delete": "Delete"
    },
    "errors": {
      "load": "Failed to load patients. Please try again."
    }
  }
}
```

## Step 2 — Register in the feature context or container

```typescript
// src/contexts/MyFeature.tsx  (or the container component)
import { extensionManager } from "@/utils/extension";
import myFeatureTranslations from "@/locales/myFeature.json";

const ns = extensionManager.getNsForTranslation("myFeature");
extensionManager.registerTranslation(ns, myFeatureTranslations);

// Export ns so child components can access it via context or props
export { ns };
```

## Step 3 — Consume in components

```typescript
import { useTranslation } from 'react-i18next';

interface Props {
  ns: string; // passed down from context or container
}

const PatientList: React.FC<Props> = ({ ns }) => {
  const { t } = useTranslation(ns);

  return (
    <Typography variant="h5">{t('title')}</Typography>
  );
};
```

## Notes

- Registration must happen **before** any component that uses the namespace mounts.
- Namespace string from `getNsForTranslation` is scoped to the extension — do not hardcode it.
- Nested keys use dot notation in `t()`: `t('actions.add')`.
- All user-facing strings — labels, placeholders, tooltips, error messages — require a translation key.
