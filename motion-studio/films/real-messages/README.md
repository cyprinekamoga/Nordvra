# Real messages – chat-style testimonial template

A collage of customer messages in classic chat-green bubbles, with heart-shaped photos and stickers,
animated one message per beat (about 10 s). 9:16 for Stories/Reels, 4:5 as a feed still.

## Only real messages
- Use messages buyers actually sent, word for word. Typos and emojis can stay; don't "improve" them.
- Ask each sender if you may share it (a quick "Can I share your message in an ad?" is enough), and
  keep the original screenshots. Leave out names and numbers unless they say yes.
- Photos: real customer photos with permission (for example a child holding the book), or the book's
  own art. Never stock photos of "happy customers".
- No logo of the chat app: the green bubbles carry the look on their own.

Made-up reviews are against Swedish marketing law (marknadsföringslagen) and the EU's rules on fake
consumer reviews, and against Meta's ad policies.

## Fill it in
Edit `messages.json`: put the real messages in `items` (`text`, `time`), the photos in `photos`,
then set `"placeholder": false`. While it is `true`, every frame is stamped PREVIEW.

```bash
node render.mjs --fps 30 --dur 10 --sub 4 --page films/real-messages/index.html --out out/real_messages_9x16.mp4
node render.mjs --fps 1 --dur 1 --start 9.5 --w 1080 --h 1350 --page films/real-messages/index.html --out out/still.mp4
```
Six messages fit comfortably; with more, the layout shrinks to fit.
