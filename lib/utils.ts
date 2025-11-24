export async function getRandomTerm() {
  const [term] = await fetch(
    "https://random-word-api.vercel.app/api?words=1",
  ).then((res) => res.json());
  return term;
}
