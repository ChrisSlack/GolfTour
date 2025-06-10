const scorecards = require('../src/data/scorecards').default || require('../src/data/scorecards');

test('each course has 18 holes', () => {
  Object.values(scorecards).forEach(course => {
    expect(course.holes).toHaveLength(18);
  });
});
