# MotionPlay Fitness Fun

Build the MotionPlay cartoon fitness game with all specifications from the attached briefs:

1. Player Profile & Age Validation:
- Setup screen with Name, Age (restricted strictly to 5–25 years old; dropdown/stepper, validate whole numbers, show warning if < 5 or > 25, prevent start until valid), Gender, Character selection, and Difficulty.
- Age-adaptive workout adjustments:
  * Age 5–8: Simple exercises, longer demos, slower cartoon pace, shorter sessions, extra voice guidance.
  * Age 9–12: Basic + intermediate, moderate pace, simple challenges.
  * Age 13–17: Intermediate exercises, faster pace, more reps, combo challenges.
  * Age 18–25: Full library, advanced exercises, tighter pose matching, rapid challenges.

2. Character Voice Coach System:
- 4 selectable cartoon coaches: Character 1 (friendly, energetic), Shinchan (playful, funny, child-like), Spider-Man (confident superhero coach), Doraemon (warm, helpful, gentle encouragement).
- Browser Text-to-Speech (window.speechSynthesis) using tuned pitch, rate, and distinct personality voice lines for welcomes, countdowns ("3... 2... 1... GO!"), real-time pose accuracy feedback, combo announcements, level clears, and workout summaries.

3. 50-Exercise Library & Webcam Pose Tracking:
- Webcam feed with MediaPipe Pose landmark detection, user skeleton overlay, target guide skeleton, and real-time accuracy scoring.
- Full 50-exercise catalog across Beginner / Easy (1–15), Medium (16–30), Hard / Advanced (31–48), and Special Challenges (49. Follow the Cartoon, 50. Random Pose Challenge).
- Scoring, hold timers, repetition counters, combo multiplier, lives/hearts, stars, and coins.

4. Dance-to-Fitness Mode:
- Sequences of exercises combined into rhythm/dance flows (e.g. Squat → Arms Up → Side Step → Jump → High Knee).

5. Performance Dashboard:
- Streak tracking, total stars, exercise count, avg accuracy, best combo, active workout time.
- Accuracy history graph (Mon–Sun / recent days), plus Strong Exercises and Weak Exercises breakdown.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://motionplay-cartoon-fitness.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0c62cd52-696a-41e9-b746-8d2731778fd3).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
