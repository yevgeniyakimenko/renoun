export default function scoreCalc(word) {
  const length = word.length;
  const base = length * 10;
  let bonus = 0;
  for (let i = length - 1; i > 0; i--) {
    bonus += i;
  }

  return base + bonus;
}