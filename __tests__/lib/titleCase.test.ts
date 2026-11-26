import { titleCase } from '../../src/lib/titleCase';

it('title-cases labels, keeping small words lower case', () => {
  expect(titleCase('Scan pass')).toBe('Scan Pass');
  expect(titleCase('Add a flight')).toBe('Add a Flight');
  expect(titleCase('Duplicate as return')).toBe('Duplicate as Return');
  expect(titleCase('Export backup (JSON)')).toBe('Export Backup (JSON)');
  expect(titleCase('Save all 4 pages')).toBe('Save All 4 Pages');
  expect(titleCase('a flight')).toBe('A Flight');
  expect(titleCase('Neat!')).toBe('Neat!');
});
