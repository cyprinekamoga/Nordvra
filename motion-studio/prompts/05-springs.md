# Make the motion feel expensive (Step 7)

Cheap motion slides from A to B on a fixed curve. Expensive motion has weight: it speeds up,
overshoots a hair, and settles. That's a spring. When something changes target several times, don't
restart the spring: stack one spring per change (`track()` in `lib/motion.js`).

```
Replace every easing curve with closed-form springs from lib/motion.js. Tiny
overshoot on UI, none on type. Any value with more than one target uses track().
```

Stiffer springs feel snappy (buttons, toggles). Softer ones feel heavy (big type, logos).
