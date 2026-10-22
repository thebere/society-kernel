import { expect, test } from 'vitest';
import { activation } from './activation';

const InvalidActivationThrowMessage = 'activation must be a number >= 0 and <= 1';

test('activation value of 0.00 must be a valid range', () => {
  expect(activation(0.00)).toBe(0.00);
});

test('activation value of 0 must be a valid range', () => {
  expect(activation(0)).toBe(0);
});

test('activation value of 1 must be a valid range', () => {
  expect(activation(1)).toBe(1);
});

test('activation value of 0.1 must be a valid range', () => {
  expect(activation(.1)).toBe(.1);
});

test('activation value of 0.5 must be a valid range', () => {
  expect(activation(.5)).toBe(.5);
});


test('activation value of -1 must be an invalid range', () => {
  expect(() => activation(-1)).toThrowError(InvalidActivationThrowMessage);
});

test('activation value of -2 must be an invalid range', () => {
  expect(() => activation(-2)).toThrowError(InvalidActivationThrowMessage);
});

test('activation value of -0.2 must be an invalid range', () => {
  expect(() => activation(-0.2)).toThrowError(InvalidActivationThrowMessage);
});

test('activation value of 1.4 must be an invalid range', () => {
  expect(() => activation(1.4)).toThrowError(InvalidActivationThrowMessage);
});

test('activation value of Infinity must be an invalid range', () => {
  expect(() => activation(Infinity)).toThrowError(InvalidActivationThrowMessage);
});

test.each([null, undefined])('actication value of %s must be an invalid range', (value) => {
  expect(() => activation(value)).toThrowError(InvalidActivationThrowMessage);
});
