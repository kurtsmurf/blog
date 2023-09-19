---
title: Slice Notes 1
description: Feature - download Javascript AudioBuffers as wav files. 
date: 2023-09-19 00:00:00 -5
draft: true
---

Working on a web-based sampler named [slice](https://github.com/kurtsmurf/slice).

So far slice can

- load audio
- slice audio

<img style="display: block; width: 100%;" src="/assets/img/diagram-1.svg" />

With [this commit](https://github.com/kurtsmurf/slice/commit/f47dcfb75fc1d80a5ef79e1275868d394d8c9a8b) it can also

- selectively download audio

<img style="display: block; width: 100%;" src="/assets/img/diagram-2.svg" />


## code

Given a [buffer](https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer) and a region (defined as two numbers range 0-1 **start** and **end**)


```Javascript
const download = async (buffer, region) => {
  // ...
};
```

### 1. Write the region (with effects applied) to a new buffer

Use an [OfflineAudioContext](https://developer.mozilla.org/en-US/docs/Web/API/OfflineAudioContext) to render Web Audio output in faster than realtime.

```Javascript
const offlineAudioContext =
  new OfflineAudioContext(
    buffer.numberOfChannels,
    buffer.duration * buffer.sampleRate * (region.end - region.start),
    buffer.sampleRate,
  );
attackRelease(offlineAudioContext, buffer, region);
const offlineResult = await offlineAudioContext.startRendering();
```

The **attackRelease** function (defined [elsewhere](https://github.com/kurtsmurf/slice/blob/f47dcfb75fc1d80a5ef79e1275868d394d8c9a8b/src/player.ts#L53)) is responsible for scheduling playback of the region with a gain envelope of 0.001s attack 0.001s release. This is done to soften the edges of samples that may cross the source waveform at non-zero values, leading to undesirable pops and clicks.

The plan is to use even more effects in the future - variable filter, speed and volume. With OfflineAudioContext the same effects we use for in-app playback will be applied to the files we download.

### 2. Convert the buffer to wav-encoded bytes 

Use package [audio-buffer-to-wav](https://www.npmjs.com/package/audiobuffer-to-wav)

```Javascript
const wav = audiobufferToWav(offlineResult);
```

### 3. Create and trigger a download link 

```Javascript
const link = document.createElement("a");
link.href = URL.createObjectURL(
  new Blob([wav], { type: "audio/wav" }),
);
link.setAttribute("download", "untitled.wav");
link.click();
URL.revokeObjectURL(link.href);
```

[createObjectUrl](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static)

## references

[http://joesul.li/van/tale-of-no-clocks/](http://joesul.li/van/tale-of-no-clocks/)

[https://stackoverflow.com/questions/62172398/convert-audiobuffer-to-arraybuffer-blob-for-wav-download](https://stackoverflow.com/questions/62172398/convert-audiobuffer-to-arraybuffer-blob-for-wav-download)

[https://github.com/Jam3/audiobuffer-to-wav/tree/master](https://github.com/Jam3/audiobuffer-to-wav/tree/master)

<style>
	a { word-break: break-word }
</style>
