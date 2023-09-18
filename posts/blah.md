---
title: slice notes
description: Describing in detail some code for no particular reason other than I'm happy that it works. The joy of works is real.
date: 2023-09-20 00:00:00 -5
draft: true
---

I'm making a web-based audio sampling utility.

First you upload an audio file, then you chop it into pieces.

<img style="display: block; width: 100%;" src="/assets/img/diagram-1.svg" />

Once you have pieces that you like, you can download them.

<img style="display: block; width: 100%;" src="/assets/img/diagram-2.svg" />

Here's the download function:

```Typescript
const download = async (
  buffer: AudioBuffer,
  region: { start: number; end: number },
) => {
  // render audiobuffer of region
  const offlineAudioContext =
    new OfflineAudioContext(
      buffer.numberOfChannels,
      buffer.duration * buffer.sampleRate *
        (region.end - region.start),
      buffer.sampleRate,
    );
  attackRelease(offlineAudioContext, buffer, region);
  const offlineResult = await offlineAudioContext
    .startRendering();

  // convert audiobuffer to an arraybuffer
  // of wav-encoded bytes
  const wav = audiobufferToWav(offlineResult);

  // trigger download
  const link = document.createElement("a");
  link.href = URL.createObjectURL(
    new Blob([wav], { type: "audio/wav" }),
  );
  link.setAttribute("download", "my-audio.wav");
  link.click();
  URL.revokeObjectURL(link.href);
};
```

The download function takes two parameters: an AudioBuffer named buffer and region which is an object indicating the start and endpoints for playback as numbers between 0 and 1 i.e. between 0% and 100% of buffer length.

In the first section of the function body we "render" our audio for download with an OfflineAudioContext.

First we initialize the offline audio context.

```Typescript
const offlineAudioContext =
  new OfflineAudioContext(
    buffer.numberOfChannels,
    buffer.duration * buffer.sampleRate *
      (region.end - region.start),
    buffer.sampleRate,
  );

```

Unlike a regular audio context which tends to run for the lifetime of the application we say up front how long the offline context should run.

In this case we tell it to live for the duration of the audio snippet we intend to export.

Next we queue up the playback events that we want to record.

```
attackRelease(offlineAudioContext, buffer, region);
```

the function attackRelease schedules playback of the specified region of the specified audio buffer with an amplitude envelope applied (0.001s ramp in and out). We apply the amplitude envelope to prevent popping noises when region playback starts or ends.


```Typescript
export function attackRelease(
  audioContext: AudioContext | OfflineAudioContext,
  buffer: AudioBuffer,
  region: { start: number; end: number },
  onended?: () => void,
) {
  const ramp = 0.001;
  const gainNode = audioContext.createGain();
  gainNode.connect(audioContext.destination);
  gainNode.gain.setValueAtTime(
    0, audioContext.currentTime
  );
  gainNode.gain.linearRampToValueAtTime(
    1, audioContext.currentTime + ramp
  );

  const startSeconds = buffer.duration * region.start;
  const endSeconds = buffer.duration * region.end;
  const durationSeconds = endSeconds - startSeconds;

  const end =
    audioContext.currentTime + durationSeconds;
  gainNode.gain.setValueAtTime(1, end - ramp);
  gainNode.gain.linearRampToValueAtTime(0, end);

  const sourceNode =
    audioContext.createBufferSource();
  sourceNode.buffer = buffer;
  sourceNode.connect(gainNode);
  if (onended) sourceNode.onended = onended;
  sourceNode.start(0, startSeconds, durationSeconds);
}
```

Finally, we set everything in motion by calling startRendering on the offline context.

Even though we told the offline context to run for the length of our selection, which may be seconds or minutes long, it will finish the task in much faster than realtime because it doesn't need to throttle itself for human listeners.

When the audio context is finished rendering it returns the result as another AudioBuffer.

We use a library function to convert the AudioBuffer into an bytes encoded in wav format.
