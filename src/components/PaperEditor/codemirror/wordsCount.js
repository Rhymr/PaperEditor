export let englishWords = [];

/**
 * @returns {void}
 */
export function fetchWordList () {
  fetch('words.json')
    .then(response => response.json())
    .then(data => {
      englishWords = data;
    })
    .catch(error => {
      console.error('Error fetching word list:', error);
    });
}

/**
 * @param {import('@codemirror/state').Text} doc
 * @returns {number} Total word count across the whole document.
 */
export function countWords (doc) {
  let count = 0; const iter = doc.iter();
  while (!iter.next().done) {
    let inWord = false;
    for (let i = 0; i < iter.value.length; i++) {
      const word = /\w/.test(iter.value[i]);
      if (word && !inWord) count++;
      inWord = word;
    }
  }
  return count;
}
