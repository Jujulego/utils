import { BST } from '../src/bst';

// Prepare data
const numbers = [1, 2, 2, 2, 4, 5];
let bst: BST<number>;

beforeEach(() => {
  bst = BST.fromArray(numbers, n => n, (a, b) => a - b);
});

// Tests suites
describe('BST.nearest', () => {
  test('lt mode', () => {
    expect(bst.nearest(0, 'lt')).toBeNull();
    expect(bst.nearest(4, 'lt')).toBe(2);
    expect(bst.nearest(10, 'lt')).toBe(5);
  });

  test('lte mode', () => {
    expect(bst.nearest(0, 'lte')).toBeNull();
    expect(bst.nearest(4, 'lte')).toBe(4);
    expect(bst.nearest(10, 'lte')).toBe(5);
  });

  test('gte mode', () => {
    expect(bst.nearest(0, 'gte')).toBe(1);
    expect(bst.nearest(4, 'gte')).toBe(4);
    expect(bst.nearest(10, 'gte')).toBeNull();
  });

  test('gt mode', () => {
    expect(bst.nearest(0, 'gt')).toBe(1);
    expect(bst.nearest(4, 'gt')).toBe(5);
    expect(bst.nearest(10, 'gt')).toBeNull();
  });
});

describe('BST.search', () => {
  test('on existing element', () => {
    expect(bst.search(2)).toEqual([2, 2, 2]);
  });

  test('on unknown elements', () => {
    expect(bst.search(3))
      .toEqual([]);

    expect(bst.search(10))
      .toEqual([]);
  });
});

describe('BST.insert', () => {
  test('a new element after same key group', () => {
    bst.insert(4);

    expect(bst.array)
      .toEqual([1, 2, 2, 2, 4, 4, 5]);
  });

  test('a new element before same key group', () => {
    bst.insert(1);

    expect(bst.array)
      .toEqual([1, 1, 2, 2, 2, 4, 5]);
  });

  test('a new element before first', () => {
    bst.insert(0);

    expect(bst.array)
      .toEqual([0, 1, 2, 2, 2, 4, 5]);
  });

  test('a new element after last', () => {
    bst.insert(6);

    expect(bst.array)
      .toEqual([1, 2, 2, 2, 4, 5, 6]);
  });

  test('in an empty bst', () => {
    const bst = BST.empty<number>(n => n, (a, b) => a - b);
    bst.insert(6);

    expect(bst.array)
      .toEqual([6]);
  });

  describe('[insert modes]', () => {
    const data = [{ data: 'a', key: 0 }, { data: 'b', key: 1 }, { data: 'c', key: 1 }, { data: 'd', key: 1 }, { data: 'e', key: 2 }];

    describe('[anywhere mode]', () => {
      it('should insert alongside elements with same key', () => {
        const bst = BST.fromArray(data, item => item.key, (a, b) => a - b);
        bst.insert({ data: 'test', key: 1 }, 'anywhere');

        expect(bst.array)
          .toEqual([
            { data: 'a', key: 0 },
            { data: 'b', key: 1 },
            { data: 'c', key: 1 },
            { data: 'test', key: 1 },
            { data: 'd', key: 1 },
            { data: 'e', key: 2 }
          ]);
      });
    });

    describe('[after mode]', () => {
      it('should insert after elements with same key', () => {
        const bst = BST.fromArray(data, item => item.key, (a, b) => a - b);
        bst.insert({ data: 'test', key: 1 }, 'after');

        expect(bst.array)
          .toEqual([
            { data: 'a', key: 0 },
            { data: 'b', key: 1 },
            { data: 'c', key: 1 },
            { data: 'd', key: 1 },
            { data: 'test', key: 1 },
            { data: 'e', key: 2 }
          ]);
      });

      it('should insert after last', () => {
        const bst = BST.fromArray(data, item => item.key, (a, b) => a - b);
        bst.insert({ data: 'test', key: 2 }, 'after');

        expect(bst.array)
          .toEqual([
            { data: 'a', key: 0 },
            { data: 'b', key: 1 },
            { data: 'c', key: 1 },
            { data: 'd', key: 1 },
            { data: 'e', key: 2 },
            { data: 'test', key: 2 }
          ]);
      });
    });

    describe('before mode', () => {
      it('should insert before elements with same key', () => {
        const bst = BST.fromArray(data, item => item.key, (a, b) => a - b);
        bst.insert({ data: 'test', key: 1 }, 'before');

        expect(bst.array)
          .toEqual([
            { data: 'a', key: 0 },
            { data: 'test', key: 1 },
            { data: 'b', key: 1 },
            { data: 'c', key: 1 },
            { data: 'd', key: 1 },
            { data: 'e', key: 2 }
          ]);
      });

      it('should insert before first', () => {
        const bst = BST.fromArray(data, item => item.key, (a, b) => a - b);
        bst.insert({ data: 'test', key: 0 }, 'before');

        expect(bst.array)
          .toEqual([
            { data: 'test', key: 0 },
            { data: 'a', key: 0 },
            { data: 'b', key: 1 },
            { data: 'c', key: 1 },
            { data: 'd', key: 1 },
            { data: 'e', key: 2 }
          ]);
      });
    });
  });
});

describe('BST.remove', () => {
  test('an existing element', () => {
    expect(bst.remove(2))
      .toEqual([2, 2, 2]);

    expect(bst.array)
      .toEqual([1, 4, 5]);
  });

  test('a missing element', () => {
    expect(bst.remove(0))
      .toEqual([]);

    expect(bst.array)
      .toEqual([1, 2, 2, 2, 4, 5]);
  });
});

describe('BST.removeUntil', () => {
  test('an existing element', () => {
    expect(bst.removeUntil(2))
      .toEqual([1]);

    expect(bst.array)
      .toEqual([2, 2, 2, 4, 5]);
  });
});
