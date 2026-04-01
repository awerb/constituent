# Multilingual Support Guide

Constituent Response supports multiple languages for constituent communications and UI.

## Supported Languages

| Code | Language | Support |
|------|----------|---------|
| en | English | Full |
| es | Spanish | Full |
| vi | Vietnamese | Full |
| zh | Chinese (Simplified) | Full |
| tl | Tagalog | Full |

Other languages can be added. Contact support to request.

## Language Detection

### Auto-Detection

When constituent submits form, language auto-detected from:

1. **Browser language** (if available)
2. **IP geolocation** (if available)
3. **Default city language** (fallback)

Example:
```
Constituent opens form in Spanish browser
→ Form displays in Spanish
→ Constituent can change if needed
→ Their preference saved
```

### Manual Override

Constituent can select language:

```
Language: [English ▼]
  English
  Español
  Tiếng Việt
  中文
  Filipino
```

Their choice stored and used for all future communications.

## Configuration

### Per-City Language Settings

Go to `/admin/settings` > **Languages**:

```
City: San Francisco

Supported Languages:
  ☑ English (primary)
  ☑ Spanish
  ☑ Vietnamese
  ☑ Chinese
  ☑ Tagalog

Default Language: English

Auto-Detect: ON
  (Detect from browser/IP if possible)
```

Enable only languages you can support. Disabling a language hides it from dropdowns and forms.

### Default Language

Every case assigned a default language (usually constituent's preference or English). All communications use that language unless overridden.

## Translations

### UI Translations

Entire interface translated. Constituents see:

```
English:
  Cases: [+ Create] [Search]

Spanish:
  Casos: [+ Crear] [Buscar]

Vietnamese:
  Trường hợp: [+ Tạo] [Tìm kiếm]
```

Uses next-intl for client-side and server-side translations.

### Response Templates

Create multilingual templates:

Go to `/admin/templates`:

```
Name: Acknowledgment
Languages:
  English:
    "Thank you for your report. Case #[REF]"
  Spanish:
    "Gracias por su informe. Caso #[REF]"
  Vietnamese:
    "Cảm ơn bạn đã báo cáo. Trường hợp #[REF]"
```

When staff sends response to Spanish-speaking constituent, Spanish template auto-populated.

### Email Translations

Acknowledgment and response emails auto-translated:

```
Constituent language: Spanish

Email sent in Spanish:
  Subject: Su caso ha sido recibido
  Body: Gracias por contactarnos...
  Signature: Departamento de Obras Públicas
```

## Dynamic Translation

When staff doesn't have multilingual team:

### AI Translation

(If AI enabled) Staff can translate response with one click:

```
1. Staff writes response in English
2. Clicks [Translate to Spanish] button
3. AI translates response
4. Staff reviews translation (check for errors)
5. Sends to Spanish-speaking constituent
```

### Professional Translation

For critical communications, flag for human translator:

```
Response in: English
Translate to: Spanish
Urgency: High (within 24 hours)

[Request Translation]
→ Sent to translation service
→ Professional translation within 24 hours
→ Staff reviews and sends
```

Translation service: (configure in admin settings)

## Language Preferences

### Store Preference

Constituent's language preference auto-saved after first communication.

View/edit at:
- Constituent record (admin UI)
- Case detail (staff UI)

Example:
```
Alice Smith
Email: alice@example.com
Language Preference: Spanish
  (Changed from English on 2024-01-15)
```

### Household Preferences

If multiple people contact from same household, language preference applies to subsequent contacts unless they override.

Example:
```
Scenario:
1. Alice contacts, prefers Spanish
2. Bob (Alice's husband) contacts from same address
3. System suggests Spanish (same address)
4. Bob selects English override
5. Bob's future contacts in English, Alice's in Spanish
```

## Translation Quality

### Best Practices

1. **Professional translation for legal content**
   - Use templates reviewed by professional translators
   - AI adequate for routine acknowledgments
   - Human review required for complex issues

2. **Keep messages simple**
   - Shorter sentences translate better
   - Avoid idioms and slang
   - Use clear, direct language

3. **Test translations**
   - Review translations with native speakers
   - Fix ambiguous or incorrect translations
   - Document common errors

4. **Brand consistency**
   - Translate department names, not just descriptions
   - Use consistent terminology across all languages
   - Document translation glossary

Example translation glossary:
```
English          Spanish              Vietnamese
Pothole          Bache                Ổ gà
Public Works     Obras Públicas       Công Cộng
Case Reference   Número de Caso       Số Tham Chiếu
```

## API Response Language

Public APIs respect language preference:

```bash
curl https://respond.transparentcity.co/api/v1/cases/CR-2024-00001/status \
  -H "Accept-Language: es"

# Response in Spanish
{
  "referenceNumber": "CR-2024-00001",
  "status": "EN_PROGRESO",
  ...
}
```

## Reporting

### Language Statistics

Go to `/admin/reports` > **Language Usage**:

```
This Month:
  English: 320 cases (64%)
  Spanish: 140 cases (28%)
  Vietnamese: 25 cases (5%)
  Chinese: 15 cases (3%)

Trending:
  Spanish: ↑ (up from 22% last month)
  Vietnamese: → (stable)

Staff Response Time by Language:
  English: 4 hours (on time)
  Spanish: 6 hours (on time)
  Vietnamese: 5 hours (on time)
```

Use to:
- Determine which languages need more staff
- Identify translation quality issues
- Plan staffing by language

## Implementation Notes

### Database

Language stored with each case:

```
Cases table:
  - id: UUID
  - language: VARCHAR (en, es, vi, etc.)
  - constituentLanguagePreference: VARCHAR
```

Constituent preferences:
```
Constituents table:
  - id: UUID
  - languagePreference: VARCHAR
```

### Code

All user-facing strings use translation keys:

```typescript
// Bad (hardcoded English):
return <div>Thank you for your report</div>

// Good (uses translation):
import { useTranslations } from 'next-intl';

export default function Page() {
  const t = useTranslations('cases');
  return <div>{t('acknowledgment')}</div>;
}

// In translation files:
// en.json:
{
  "cases": {
    "acknowledgment": "Thank you for your report"
  }
}

// es.json:
{
  "cases": {
    "acknowledgment": "Gracias por su informe"
  }
}
```

## Adding a New Language

### Step 1: Request Language

Contact support: support@city.gov

```
City: San Francisco
Language Requested: Portuguese (pt)
Reason: 8% of constituent emails in Portuguese
Urgency: Medium
```

Response within 1 week.

### Step 2: Get Translations

City provides:
- All UI strings
- All email templates
- All response templates

Professional translator (city's responsibility) provides translations for all strings.

### Step 3: Upload Translations

Admin uploads translations to system:

Go to `/admin/languages` > **+ Add Language**

```
Language: Portuguese (pt)
Upload Files:
  - ui.json (UI translations)
  - emails.json (email templates)
  - responses.json (response templates)
```

System validates and imports.

### Step 4: Test

- [ ] UI displays in Portuguese
- [ ] Forms show Portuguese labels
- [ ] Emails send in Portuguese
- [ ] Responses translate to Portuguese

### Step 5: Enable

Go to `/admin/settings` > **Languages**:

```
☑ Portuguese (pt)
```

Now constituents can select Portuguese in language dropdown.

## Troubleshooting

### Response in wrong language

1. Check constituent's language preference:
   - Go to constituent record
   - Verify language preference is correct

2. Check template language:
   - If using template, verify it's in correct language
   - If using AI draft, verify it was translated

3. Force correct language:
   - Edit case language field
   - Resend response in correct language

### Translation missing

1. Check translation file exists:
   - Go to `/admin/languages`
   - See which translations are loaded

2. Contact support if translation missing:
   - support@city.gov
   - Provide missing translation

3. Fallback behavior:
   - If translation missing, UI shows in English
   - Staff notified of missing translation

### Encoding errors (special characters)

Ensure all translation files are UTF-8 encoded:

```bash
file -i translation-file.json
# Should show: utf-8

# Convert if needed:
iconv -f ISO-8859-1 -t UTF-8 translation-file.json -o translation-file-utf8.json
```

## Performance

Translation adds minimal overhead:

- UI: < 50ms (keys loaded at startup)
- API: < 10ms (lookup in memory)
- Email: < 100ms (template lookup + translation)

No noticeable impact on response times.

## Data Privacy

Translations handled locally (no cloud translation service by default):

- Translation keys stored in database
- No third-party service access
- No translation data sent outside system
- Meets GDPR/CCPA requirements

If using AI translation:
- Request body sent to AI provider
- Response returned and deleted
- See AI-CONFIGURATION.md for privacy details

## Support

- **Language request**: support@city.gov
- **Translation bug**: support@city.gov
- **Missing language**: support@city.gov

Include:
- Language code or name
- Use case/frequency
- How it affects constituents
