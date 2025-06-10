const { generateId } = require('../src/utils/id');

test('generateId returns unique ids', () => {
  const ids = new Set();
  for (let i = 0; i < 100; i++) {
    ids.add(generateId());
  }
  expect(ids.size).toBe(100);
});
