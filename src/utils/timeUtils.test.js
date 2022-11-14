import { timeAgo } from './timeUtils';

describe('timeUtils', function () {
  describe('timeAgo', function () {
    it('correctly converts 55 seconds ago', function () {
      const now = new Date('2018-01-01T00:00:00.000Z');
      expect(timeAgo(new Date('2017-12-31T23:59:05.000Z'), now)).toBe('55 seconds');
    });

    it('correctly converts 1 minute ago', function () {
      const now = new Date('2018-01-01T00:00:00.000Z');
      expect(timeAgo(new Date('2017-12-31T23:59:00.000Z'), now)).toBe('1 minute');
    });

    it('correctly converts 1 hour ago', function () {
      const now = new Date('2018-01-01T00:00:00.000Z');
      expect(timeAgo(new Date('2017-12-31T23:00:00.000Z'), now)).toBe('1 hour');
    });

    it('correctly converts 23 hours ago', function () {
      const now = new Date('2018-01-01T00:00:00.000Z');
      expect(timeAgo(new Date('2017-12-31T01:00:00.000Z'), now)).toBe('23 hours');
    });

    it('correctly converts 1 day ago', function () {
      const now = new Date('2018-01-01T00:00:00.000Z');
      expect(timeAgo(new Date('2017-12-31T00:00:00.000Z'), now)).toBe('1 day');
    });

    it('correctly converts 20 days ago', function () {
      const now = new Date('2018-01-01T00:00:00.000Z');
      expect(timeAgo(new Date('2017-12-12T00:00:00.000Z'), now)).toBe('20 days');
    });

    it('correctly converts 1 month ago', function () {
      const now = new Date('2018-01-01T00:00:00.000Z');
      expect(timeAgo(new Date('2017-12-01T00:00:00.000Z'), now)).toBe('1 month');
    });

    it('correctly converts 11 months ago', function () {
      const now = new Date('2018-01-01T00:00:00.000Z');
      expect(timeAgo(new Date('2017-02-01T00:00:00.000Z'), now)).toBe('11 months');
    });

    it('correctly converts 1 year ago', function () {
      const now = new Date('2018-01-01T00:00:00.000Z');
      expect(timeAgo(new Date('2017-01-01T00:00:00.000Z'), now)).toBe('1 year');
    });

    it('correctly converts 5 years ago', function () {
      const now = new Date('2018-01-01T00:00:00.000Z');
      expect(timeAgo(new Date('2013-01-01T00:00:00.000Z'), now)).toBe('5 years');
    });

    // it('throws error if timeAgo is after now', function () {
    //   const now = new Date('2022-10-29T19:38:35.000Z');
    //   expect(() => timeAgo(new Date('2022-10-29T22:52:36.000Z'), now)).toThrow();
    // });
  });
});
