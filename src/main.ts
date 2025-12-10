import { setup, createActor, fromPromise, assign } from "xstate";

const FURHATURI = "127.0.0.1:54321";
// const FURHATURI = "10.232.52.103:1932";

async function fhVoice(name: string) {
  const myHeaders = new Headers();
  myHeaders.append("accept", "application/json");
  const encName = encodeURIComponent(name);
  return fetch(`http://${FURHATURI}/furhat/voice?name=${encName}`, {
    method: "POST",
    headers: myHeaders,
    body: "",
  });
}

async function fhSay(text: string) {
  const myHeaders = new Headers();
  myHeaders.append("accept", "application/json");
  const encText = encodeURIComponent(text);
  return fetch(`http://${FURHATURI}/furhat/say?text=${encText}&blocking=true`, {
    method: "POST",
    headers: myHeaders,
    body: "",
  });
}

async function attention() {
        const myHeaders = new Headers();
  myHeaders.append("accept", "application/json");
  return fetch(`http://${FURHATURI}/furhat/attend?user=CLOSEST`, {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify({
      enum: "CLOSEST",
    }),
  });
}

async function gettingUser() {
  const myHeaders = new Headers();
  myHeaders.append("accept", "application/json");
  return fetch(`http://${FURHATURI}/furhat/users`, {
    method: "GET",
    headers: myHeaders,
  });
}


async function eyeRolling() {
  const myHeaders = new Headers();
  myHeaders.append("accept", "application/json");
  return fetch(`http://${FURHATURI}/furhat/gesture?blocking=false`, {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify({
      name: "eye-rolling",
      frames: [
        {
          time: [0.0], 
          persist: true,
          params: {
            LOOK_RIGHT: 4.0,
            BROW_UP_LEFT : 1.0,
            BROW_UP_RIGHT : 1.0,

          },
        },
        {
          time: [1.5], 
          persist: true,
          params: {
            LOOK_UP: 8.0,
            BROW_UP_LEFT : 1.0,
            BROW_UP_RIGHT : 1.0,

          },
        },
        {
          time: [2.0], 
          persist: true,
          params: {
            LOOK_LEFT: 4.0,
            BROW_UP_LEFT : 1.0,
            BROW_UP_RIGHT : 1.0,
            NOSE_WIDER: 1.0,
          },
        },
        {
          time: [3.5],
          persist: true,
          params: {
            reset: true,
          },
        },
      ],
      class: "furhatos.gestures.Gesture",
    }),
  });
}

async function noddingWithDisgust() {
  const myHeaders = new Headers();
  myHeaders.append("accept", "application/json");
  return fetch(`http://${FURHATURI}/furhat/gesture?blocking=false`, {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify({
      name: "eye-noddingWithDisgust",
      frames: [
              {
                time: [0.0],
                params: { 
                  NECK_PAN: -30,
                  EXPR_DISGUST : 1.0
                }
              },
              {
                time: [1.0],
                params: { 
                  NECK_PAN: 30,
                  EXPR_DISGUST : 1.0 
                }
              },
              {
                time: [2.0],
                params: { 
                  NECK_PAN: -30,
                  EXPR_DISGUST : 1.0
                 }
              },
              {
                time: [3.0],
                params: { 
                  NECK_PAN: 30,
                  EXPR_DISGUST : 1.0
                 }
              },
              {
                time: [4.0],
                params: { reset: true }
              }
      ],
      class: "furhatos.gestures.Gesture",
    }),
  });
}


async function fhGestureAudio(text: string) {
  const myHeaders = new Headers();
  myHeaders.append("accept", "application/json");
  return fetch(
    `http://${FURHATURI}/furhat/say?url=${text}&blocking=true`,
    {
      method: "POST",
      headers: myHeaders,
      body: "",
    },
  );
}

async function fhListen() {
  const myHeaders = new Headers();
  myHeaders.append("accept", "application/json");
  return fetch(`http://${FURHATURI}/furhat/listen`, {
    method: "GET",
    headers: myHeaders,
  })
    .then((response) => response.body)
    .then((body) => body.getReader().read())
    .then((reader) => reader.value)
    .then((value) => JSON.parse(new TextDecoder().decode(value)).message);
}

const dmMachine = setup({
  actors: {
    fhVoice: fromPromise<any, null>(async () => {
      return fhVoice("en-US-EchoMultilingualNeural");
    }),
    fhHello: fromPromise<any, null>(async () => {
      return fhSay("Hey, I'm furhat. I want to demonstrate to you my eye roll");
    }),
    utt2nd: fromPromise<any, null>(async () => {
      return fhSay("Now I want to show you how I shake my head with disgust and a sound");
    }),
    fhL: fromPromise<any, null>(async () => {
     return fhListen();
   }),
    fhEyeRolling: fromPromise<any, null>(async () => {
      return eyeRolling();
   }),
    fhNodd: fromPromise<any, null>(async () => {
      return noddingWithDisgust();
   }),
    fhUserDetection: fromPromise<any, null>(async () => {
      return gettingUser();
   }),
    fhAttend: fromPromise<any, null>(async () => {
      return attention();
   }),
    fhAudio: fromPromise<any, string>(async ({input}) => {
      return ([
        fhGestureAudio(input),
        noddingWithDisgust()
      ])
   }),
   
  },
}).createMachine({
  id: "root",
  initial: "GettingUser",
  states: {

    GettingUser: {
      invoke: {
        src: "fhUserDetection",      
        input: null,
        onDone: {
          target: "AttentionOn",
          actions: ({ event }) => console.log(event.output),
        },
        onError: {
          target: "Fail",
          actions: ({ event }) => console.error(event),
        },
      },
    },

    AttentionOn: {
      invoke: {
        src: "fhAttend",      
        input: null,
        onDone: {
          target: "Start",
          actions: ({ event }) => console.log(event.output),
        },
        onError: {
          target: "Fail",
          actions: ({ event }) => console.error(event),
        },
      },
    },

    Start: { after: { 1000: "Next" } },
    Next: {
      invoke: {
        src: "fhHello",      
        input: null,
        onDone: {
          target: "EyeRoll",
          actions: ({ event }) => console.log(event.output),
        },
        onError: {
          target: "Fail",
          actions: ({ event }) => console.error(event),
        },
      },
    },

    EyeRoll: {
      invoke: {
        src: "fhEyeRolling",      
        input: null,
        onDone: {
          target: "Delay",
          actions: ({ event }) => console.log(event.output),
        },
        onError: {
          target: "Fail",
          actions: ({ event }) => console.error(event),
        },
      },
    },

    Delay: { after: { 3000: "Utterance2nd" } },
    
    Utterance2nd: {
      invoke: {
        src: "utt2nd",      
        input: null,
        onDone: {
          target: "Disgust",
          actions: ({ event }) => console.log(event.output),
        },
        onError: {
          target: "Fail",
          actions: ({ event }) => console.error(event),
        },
      },
    },

    Disgust: {
      invoke: {
        src: "fhAudio",      
        input: "https://github.com/deadpigeonskrk/xstate-furhat-starter/raw/refs/heads/master/disgust_fem.wav",
        onDone: {
          target: "Listen",
          actions: ({ event }) => console.log(event.output),
        },
        onError: {
          target: "Fail",
          actions: ({ event }) => console.error(event),
        },
      },
    },

    Listen: {
    },
    Fail: {},
  },
});

const actor = createActor(dmMachine).start();
console.log(actor.getSnapshot().value);

actor.subscribe((snapshot) => {
  console.log(snapshot.value);
});

