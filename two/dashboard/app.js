async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 1000 } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const response = await fetch(resource, {
    ...options,
    signal: controller.signal,
    mode: "no-cors",
    headers: {
      Host: "example.com",
      "User-Agent": "Mozilla",
    },
  });
  clearTimeout(id);
  return response;
}

async function wait(ms = 1000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const start = document.querySelector("#start");
const connected = document.querySelector("#connected");
const timeout = document.querySelector("#timeout");

async function loop(url) {
  try {
    await fetchWithTimeout(url, {
      timeout: 200,
    });
    connected.classList.remove("dn");
    timeout.classList.add("dn");
    await wait(1000);
    return loop(url);
  } catch (error) {
    connected.classList.add("dn");
    timeout.classList.remove("dn");
    await wait(1000);
    loop(url);
  }
}

start.querySelector("button").addEventListener(
  "click",
  () => {
    const url = start.querySelector("input").value;
    start.classList.add("dn");
    loop(url);
  },
  { once: true }
);
