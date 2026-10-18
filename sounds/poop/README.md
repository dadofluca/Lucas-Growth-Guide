# Recorded fart sound sources

P71 uses four real MP3 recordings hosted in the public SoundMonster repository, rather than synthesizing oscillator sounds. Source: https://github.com/jonjonsson/SoundMonster (Public domain folder). Its README lists each of the four sounds under CC0.

- fart short.mp3 — short
- fart wet.mp3 — wet
- fart powerful.mp3 — powerful
- fart long.mp3 — long

The files are loaded directly from raw.githubusercontent.com. This avoids shipping missing local audio assets, but **requires network access**. The source file paths were confirmed through GitHub; actual iPhone playback and sound quality still need device validation. For production reliability, a later release should vendor the licensed binaries into the app. No synthetic fallback is used. The user sound toggle remains effective.
