# Match the uploaded MotionPlay app without email/password

## What will change
- Replace the current game presentation with the uploaded MotionPlay codebase, including its illustrated coaches, profile experience, gameplay, voice controls, and dashboard.
- Remove login and signup entirely: no email, password, confirmation, account switching, or logout controls.
- Start with one profile form containing only name, age, and gender; save it on the device and use it throughout the game.
- Keep profile editing available, using the same three fields only.

## Validation
- Confirm no visible or source-level email/password/login/signup references remain in the active app.
- Check that a valid name, age from 5–25, and gender opens coach selection and that the saved profile can be edited.
- Verify the app builds and inspect the updated page at desktop and mobile sizes.

## Technical details
- Copy only the uploaded app source and required configuration/assets, excluding backend/authentication files, database migrations, generated output, and Git metadata.
- Simplify the uploaded single-page state flow from splash/authenticated states to splash → profile → coach selection → game/dashboard.
- Retain local device storage for profile and game progress; no cloud account is required.
